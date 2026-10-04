import type {
  BlueprintEdge, BlueprintGraph, BlueprintNode, BlueprintRegistry,
  PortDef, PortRef, SubGraphDef,
} from "./types";
import { EXEC_IN_PORT, execOutIds, nodeShape } from "./connect";
import { makeId } from "./useBlueprint";

/**
 * 子图 (折叠 / 展开) 与区间注释。
 *
 * ## 折叠为什么值得做
 *
 * 一张真实的蓝图会有几十上百个节点。"把一片节点折成一个节点"是**唯一**
 * 能让它保持可读的手段 —— 分层, 而不是靠缩放去找。
 *
 * ## 关键设计: 隧道是真实节点
 *
 * 子图的对外端口由内部的 `subgraph.input` / `subgraph.output` 节点承担
 * (UE5 管这叫 Tunnel, n8n 叫 "Execute Workflow" 的 IO)。这么做的好处是:
 * 子图内部的连线是**普通的边**, 于是校验、环检测、拓扑序、求值
 * 全都不需要为子图写任何特例 —— 它们看到的就是一张普通的图。
 *
 * 代价是"隧道节点"这个概念要多解释一句。相比之下, 让每个下游函数都
 * 判一次"我是不是在子图里"要糟得多。
 */

/** 隧道节点的类型 id。注册中心里要有它, 否则子图内部会报 unknown-node-type。 */
/** 子图节点的 type id。 */
export const SUBGRAPH_NODE = "subgraph";
export const TUNNEL_IN = "subgraph.input";
export const TUNNEL_OUT = "subgraph.output";

/**
 * 注册子图所需的节点类型。建注册中心时调一次。
 *
 * 三件事一起做是因为它们**必须同时存在**才有用:
 *   - `subgraph` 子图节点本身 (一个空壳, 外形由子图定义给)
 *   - `subgraph.input` / `subgraph.output` 隧道
 * 少了任何一个, 折叠出来的图校验就报 unknown-node-type。
 */
export function registerTunnels(reg: BlueprintRegistry): void {
  ((reg as unknown as { nodeTypes: Map<string, unknown> }).nodeTypes).set(SUBGRAPH_NODE, {
    type: SUBGRAPH_NODE,
    label: "子图",
    category: "子图",
    description: "一张被折叠起来的图。双击进入。",
    // 外形完全由 SubGraphDef 决定, 这里刻意不声明任何端口 ——
    // 声明了就会与子图定义打架, 而"哪个说话算"又是一个要解释的新规则
  });

  ((reg as unknown as { nodeTypes: Map<string, unknown> }).nodeTypes).set(TUNNEL_IN, {
    type: TUNNEL_IN,
    label: "输入",
    category: "子图",
    description: "子图的对外输入口。它把外部进来的值吐给内部。",
    outputs: [{ id: "value", label: "值", type: "any" }],
    params: [{ id: "name", label: "名字", kind: "text", default: "in" }],
    evaluate: ({ params }) => ({ value: params.__value }),
  });
  ((reg as unknown as { nodeTypes: Map<string, unknown> }).nodeTypes).set(TUNNEL_OUT, {
    type: TUNNEL_OUT,
    label: "输出",
    category: "子图",
    description: "子图的对外输出口。它把内部算出的值交回外部。",
    inputs: [{ id: "value", label: "值", type: "any" }],
    outputs: [{ id: "value", label: "值", type: "any" }],
    params: [{ id: "name", label: "名字", kind: "text", default: "out" }],
    /**
     * 把进来的值原样吐出去。
     *
     * 这一行看着多余 (没有它时求值器也会"透传同名端口"), 但那条兜底依赖
     * 输入与输出端口**同名**; 而隧道的端口 id 是跟着对外端口走的 (可能是
     * "out" 也可能是别的), 不等同于这里的 "value"。显式写一遍才可靠。
     */
    evaluate: ({ inputs }) => ({ value: inputs.value }),
  });
}

/**
 * 计算"这批节点对外的端口"。
 *
 * 判定规则: 一条边**跨越**了这批节点的边界 (一头在里面、一头在外面),
 * 那么它在边界上留下一个口:
 *   - 内部的节点是这条边的**终点** -> 外面有个输入口, 名字取自原输入口
 *   - 内部的节点是这条边的**起点** -> 外面有个输出口
 *
 * 为什么按端口 id 去重而不是按边去重: 两条不同来源的边连到同一个输入口时,
 * 对外应该只有**一个**口 (否则外面要连两次)。这也是 UE5 隧道的行为。
 */
export function boundaryPorts(
  reg: BlueprintRegistry,
  graph: BlueprintGraph,
  ids: readonly string[]
): {
  inputs: PortDef[];
  outputs: PortDef[];
  readonly execIn: boolean;
  readonly execOut: string[];
  /** 外部边 -> 折叠后该连到子图节点的哪个口。 */
  readonly remap: ReadonlyMap<string, { readonly dir: "in" | "out"; readonly port: string }>;
} {
  const inside = new Set(ids);
  const inputs: PortDef[] = [];
  const outputs: PortDef[] = [];
  const remap = new Map<string, { dir: "in" | "out"; port: string }>();
  let execIn = false;
  const execOutSet = new Set<string>();

  const ensure = (list: PortDef[], p: PortDef): PortDef => {
    const found = list.find((x) => x.id === p.id);
    if (found) return found;
    list.push(p);
    return p;
  };

  for (const e of graph.edges) {
    const fromIn = inside.has(e.from.node);
    const toIn = inside.has(e.to.node);

    // 外面的 -> 里面的: 对外是输入口
    if (!fromIn && toIn) {
      if (e.to.port === EXEC_IN_PORT) {
        execIn = true;
        remap.set(e.id, { dir: "in", port: EXEC_IN_PORT });
        continue;
      }
      const shape = nodeShape(reg, graph, e.to.node);
      const src = shape.inputs.find((p) => p.id === e.to.port);
      ensure(inputs, src ?? { id: e.to.port, type: "any" });
      remap.set(e.id, { dir: "in", port: e.to.port });
      continue;
    }

    // 里面的 -> 外面的: 对外是输出口
    if (fromIn && !toIn) {
      const outIds = execOutIds(nodeShape(reg, graph, e.from.node));
      if (outIds.includes(e.from.port)) {
        execOutSet.add(e.from.port);
        remap.set(e.id, { dir: "out", port: e.from.port });
        continue;
      }
      const shape = nodeShape(reg, graph, e.from.node);
      const src = shape.outputs.find((p) => p.id === e.from.port);
      ensure(outputs, src ?? { id: e.from.port, type: "any" });
      remap.set(e.id, { dir: "out", port: e.from.port });
    }
  }

  return { inputs, outputs, execIn, execOut: [...execOutSet], remap };
}

/**
 * 折叠: 把一批节点变成一个子图节点。
 *
 * 返回新图, 不改原图 —— 折叠是可撤销的一步, 撤销就是"用原图替换"。
 */
export function collapseToSubgraph(
  reg: BlueprintRegistry,
  graph: BlueprintGraph,
  ids: readonly string[],
  opts: { readonly label?: string; readonly id?: string } = {}
): BlueprintGraph {
  const inside = new Set(ids);
  if (inside.size === 0) return graph;

  const nodesIn = graph.nodes.filter((n) => inside.has(n.id));
  if (nodesIn.length === 0) return graph;

  const b = boundaryPorts(reg, graph, ids);
  const sgId = opts.id ?? makeId("sg");


  // 子图内部: 只留下完全在里面的边, 外加隧道连线
  const innerEdges = graph.edges
    .filter((e) => inside.has(e.from.node) && inside.has(e.to.node))
    .map((e) => ({ ...e }));

  // 隧道节点: 每个对外端口一个
  const tunnels: BlueprintNode[] = [];
  const tunnelEdges: BlueprintEdge[] = [];
  const box = boundsOf(nodesIn);

  /**
   * 隧道的端口 id **就是**对外端口的 id。
   *
   * 写死成 "value" 是最自然的写法, 但它会让隧道与外部端口失去对应关系:
   * 求值器收值时拿不到 "out" 这一路, 结果就是空对象且不报错。
   * 端口 id 是连线与取值共同的主键, 必须一路传到底。
   */
  for (const p of b.inputs) {
    const id = makeId("ti");
    tunnels.push({
      id, type: TUNNEL_IN, x: box.x, y: box.y,
      params: { name: p.label ?? p.id },
      ports: { outputs: [{ id: "value", label: p.label ?? p.id, type: p.type }] },
    });
    // 外部进来的值 -> 原目的地
    for (const e of graph.edges) {
      if (inside.has(e.from.node) || !inside.has(e.to.node)) continue;
      if (e.to.port !== p.id) continue;
      if (e.to.port === EXEC_IN_PORT) continue;
      tunnelEdges.push({ id: makeId("e"), from: { node: id, port: "value" }, to: { node: e.to.node, port: e.to.port }, kind: "data" });
    }
  }

  for (const p of b.outputs) {
    const id = makeId("to");
    tunnels.push({
      id, type: TUNNEL_OUT, x: box.x + 200, y: box.y,
      params: { name: p.label ?? p.id },
      ports: { inputs: [{ id: "value", label: p.label ?? p.id, type: p.type }] },
    });
    for (const e of graph.edges) {
      if (!inside.has(e.from.node) || inside.has(e.to.node)) continue;
      if (e.from.port !== p.id) continue;
      tunnelEdges.push({ id: makeId("e"), from: { node: e.from.node, port: e.from.port }, to: { node: id, port: "value" }, kind: "data" });
    }
  }

  /**
   * 对外输入口一律 **multi**。
   *
   * 折叠一片区域时, 原本连到不同节点、不同端口的多条外部边, 会汇到新子图
   * 节点的同一个输入口上。若沿用"独占"语义, 第二条边会把第一条顶掉 ——
   * 折叠一次就丢一部分连线, 且不报错 (实测: 折叠后校验报 input-occupied,
   * 或者更糟, 边被静默替换)。
   *
   * 折叠的语义是"把这片东西收起来", 不是"选一个来源", 所以汇合是对的。
   */
  const subgraph: SubGraphDef = {
    id: sgId,
    ...(opts.label ? { label: opts.label } : {}),
    inputs: b.inputs.map((p) => ({ ...p, multi: true })),
    outputs: b.outputs,
    execIn: b.execIn,
    execOut: b.execOut,
    nodes: [...nodesIn, ...tunnels],
    edges: [...innerEdges, ...tunnelEdges],
  };

  // 外层: 删掉这批节点, 放一个子图节点, 把跨界边重接到它身上
  const subNode: BlueprintNode = {
    id: makeId("n"),
    type: "subgraph",
    x: box.x,
    y: box.y,
    subgraph: sgId,
    ...(opts.label ? { title: opts.label } : {}),
  };

  const outerEdges: BlueprintEdge[] = [];
  const seenOuter = new Set<string>();
  for (const e of graph.edges) {
    const fromIn = inside.has(e.from.node);
    const toIn = inside.has(e.to.node);
    if (!fromIn && !toIn) {
      outerEdges.push(e);
      continue;
    }
    if (fromIn && toIn) continue; // 已收进子图

    const m = b.remap.get(e.id);
    if (!m) continue;
    /**
     * 去重键必须包含**两端**。
     *
     * 第一版只判了 "in" 分支的重复, 而且键里没有 from —— 实测踩到:
     * 一个节点有两个执行出口都连到外面时 (例如 mode 的 parallel 出口
     * 同时连到并行池和 skip), 折叠后两条边映到子图节点的同一个出口上,
     * 若对端节点也相同就产出完全重复的边, 而校验报的是
     * `duplicate-edge @undefined` —— 连是哪个节点都说不出。
     */
    const key = m.dir === "in"
      ? `${e.from.node}.${e.from.port}>${subNode.id}.${m.port}`
      : `${subNode.id}.${m.port}>${e.to.node}.${e.to.port}`;
    if (seenOuter.has(key)) continue;
    seenOuter.add(key);
    if (m.dir === "in") {
      outerEdges.push({ id: makeId("e"), from: e.from, to: { node: subNode.id, port: m.port }, kind: e.kind });
    } else {
      outerEdges.push({ id: makeId("e"), from: { node: subNode.id, port: m.port }, to: e.to, kind: e.kind });
    }
  }

  return {
    nodes: [...graph.nodes.filter((n) => !inside.has(n.id)), subNode],
    edges: outerEdges,
    subgraphs: { ...(graph.subgraphs ?? {}), [sgId]: subgraph },
    ...(graph.comments ? { comments: graph.comments } : {}),
  };
}

/**
 * 展开: 把子图节点还原成里头的那片节点。
 *
 * `keepSubgraphDef` 默认 true —— 定义留着, 别处还有调用点时不会跟着炸。
 */
export function expandSubgraph(
  graph: BlueprintGraph,
  nodeId: string,
  opts: { readonly keepSubgraphDef?: boolean } = {}
): BlueprintGraph {
  const node = graph.nodes.find((n) => n.id === nodeId);
  if (!node?.subgraph) return graph;
  const sg = graph.subgraphs?.[node.subgraph];
  if (!sg) return graph;

  // 内部节点要挪到"该子图节点现在所在的位置" —— 否则展开后它们出现在
  // 创建子图时的原始坐标, 而那个位置可能早就被别的节点占了
  const inner = sg.nodes.filter((n) => n.type !== TUNNEL_IN && n.type !== TUNNEL_OUT);
  const box = inner.length ? boundsOf(inner) : { x: node.x, y: node.y, w: 0, h: 0 };
  const dx = node.x - box.x;
  const dy = node.y - box.y;

  // 隧道节点不还原: 它们的职责已经由外部连线接过了
  const restored = inner.map((n) => ({ ...n, x: n.x + dx, y: n.y + dy }));

  // 外部连到子图的边 -> 连回内部真实的那一端
  const tunnelInByPort = new Map<string, string>();
  const tunnelOutByPort = new Map<string, string>();
  for (const e of sg.edges) {
    const from = sg.nodes.find((n) => n.id === e.from.node);
    const to = sg.nodes.find((n) => n.id === e.to.node);
    if (from?.type === TUNNEL_IN) {
      const name = String(from.params?.name ?? "");
      tunnelInByPort.set(name, e.to.node + ":" + e.to.port);
    }
    if (to?.type === TUNNEL_OUT) {
      const name = String(to.params?.name ?? "");
      tunnelOutByPort.set(name, e.from.node + ":" + e.from.port);
    }
  }

  const outerEdges: BlueprintEdge[] = [];
  for (const e of graph.edges) {
    if (e.to.node === nodeId) {
      const target = tunnelInByPort.get(portLabelOf(sg, e.to.port, "in"));
      if (target) {
        const [n, p] = target.split(":");
        outerEdges.push({ id: makeId("e"), from: e.from, to: { node: n, port: p }, kind: e.kind });
      } else if (e.to.port === EXEC_IN_PORT) {
        // 执行入口: 接回子图里原本没有上游执行入口的那个节点
        const entry = sg.nodes.find((n) => n.type !== TUNNEL_IN && n.type !== TUNNEL_OUT && !sg.edges.some((x) => x.to.node === n.id && x.to.port === EXEC_IN_PORT));
        if (entry) outerEdges.push({ id: makeId("e"), from: e.from, to: { node: entry.id, port: EXEC_IN_PORT }, kind: "exec" });
      }
      continue;
    }
    if (e.from.node === nodeId) {
      const src = tunnelOutByPort.get(portLabelOf(sg, e.from.port, "out"));
      if (src) {
        const [n, p] = src.split(":");
        outerEdges.push({ id: makeId("e"), from: { node: n, port: p }, to: e.to, kind: e.kind });
      }
      continue;
    }
    outerEdges.push(e);
  }

  // 子图内部的边 (去掉接隧道的那些)
  const innerIds = new Set(restored.map((n) => n.id));
  const innerEdges = sg.edges.filter((e) => innerIds.has(e.from.node) && innerIds.has(e.to.node)).map((e) => ({ ...e }));

  const subgraphs = { ...(graph.subgraphs ?? {}) };
  /**
   * 默认**保留**定义。
   *
   * 坑: 写成 `if (!opts.keepSubgraphDef) delete` 时, 不传参 = undefined
   * = !undefined = true = 删掉。与"默认保留"的意图正好相反, 而且不报错。
   * 默认保留是对的: 一个子图可能有多个调用点, 展开其中一个就把定义删了,
   * 别的调用点会立刻变成悬空引用。
   */
  if (opts.keepSubgraphDef === false) delete subgraphs[node.subgraph];

  return {
    nodes: [...graph.nodes.filter((n) => n.id !== nodeId), ...restored],
    edges: [...outerEdges, ...innerEdges],
    subgraphs,
    ...(graph.comments ? { comments: graph.comments } : {}),
  };
}

function portLabelOf(sg: SubGraphDef, portId: string, dir: "in" | "out"): string {
  const p = (dir === "in" ? sg.inputs : sg.outputs)?.find((x) => x.id === portId);
  return p?.label ?? p?.id ?? portId;
}

function boundsOf(nodes: readonly BlueprintNode[]) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const n of nodes) {
    x0 = Math.min(x0, n.x);
    y0 = Math.min(y0, n.y);
    x1 = Math.max(x1, n.x);
    y1 = Math.max(y1, n.y);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * 取子图内部那张图。进入编辑时用它。
 *
 * 注意: 返回的图**带上外层的 subgraphs 表**, 这样子图里再套子图也能正常解析。
 */
export function subgraphAsGraph(graph: BlueprintGraph, sgId: string): BlueprintGraph | null {
  const sg = graph.subgraphs?.[sgId];
  if (!sg) return null;
  return {
    nodes: sg.nodes,
    edges: sg.edges,
    subgraphs: graph.subgraphs,
    ...(graph.comments ? { comments: [] } : {}),
  };
}

/** 写回: 把编辑后的内部图存回子图定义。 */
export function writeSubgraph(
  graph: BlueprintGraph,
  sgId: string,
  inner: Pick<BlueprintGraph, "nodes" | "edges">,
  shape?: { readonly inputs?: readonly PortDef[]; readonly outputs?: readonly PortDef[] }
): BlueprintGraph {
  const sg = graph.subgraphs?.[sgId];
  if (!sg) return graph;
  const next: SubGraphDef = {
    ...sg,
    nodes: inner.nodes,
    edges: inner.edges,
    ...(shape ? { inputs: shape.inputs ?? sg.inputs, outputs: shape.outputs ?? sg.outputs } : {}),
  };
  return { ...graph, subgraphs: { ...(graph.subgraphs ?? {}), [sgId]: next } };
}

/** 子图有没有别的调用点。决定展开时能不能安全删掉定义。 */
export function subgraphRefCount(graph: BlueprintGraph, sgId: string): number {
  return graph.nodes.filter((n) => n.subgraph === sgId).length;
}
