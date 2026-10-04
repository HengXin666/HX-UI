import type {
  BlueprintGraph,
  BlueprintRegistry,
  EvalContext,
} from "./types";
import { EXEC_IN_PORT, execOutIds } from "./connect";
import { topoSort } from "./validate";

/**
 * 求值引擎。
 *
 * ## 它是可选的
 *
 * 蓝图库的本职是"图 + 合法性"。很多用法根本不需要在这里跑:
 * 导出 JSON 给后端、生成代码、只当配置编辑器。所以 `evaluate` 在节点定义上
 * 是可选字段, 引擎遇到没有它的节点就当"透传"处理。
 *
 * ## 为什么按拓扑序而不是递归
 *
 * 递归求值在菱形图上会把公共上游算两遍 (A→B、A→C、B/C→D 时 A 算两次)。
 * 拓扑序 + 结果缓存保证每个节点只算一次。
 *
 * ## 执行流怎么和数据流共存
 *
 * 拓扑序只保证"数据先于消费", 但执行流要求的是"沿 exec 边走, 走到才求值"。
 * 所以分两趟: 先用 exec 边从入口走一遍得到**执行路径**, 路径上每个节点
 * 求值其数据输入 (数据输入再按拓扑序回溯求值)。没被走到的分支不求值 ——
 * 这正是"分支"的语义, 也是副作用节点必须挂在 exec 上的理由。
 */
import type { BlueprintNode } from "./types";

export interface EvalResult {
  /** 节点 id -> 输出值 (输出端口 id -> 值)。没跑到的节点不在里面。 */
  readonly outputs: ReadonlyMap<string, Record<string, unknown>>;
  /** 报错的节点 id -> 错误信息。 */
  readonly errors: ReadonlyMap<string, string>;
  readonly ok: boolean;
}

/** 某节点各输入口的来源边。 */
function inEdges(graph: BlueprintGraph, nodeId: string) {
  return graph.edges.filter((e) => e.to.node === nodeId);
}

/** 参数取值: 节点上的覆盖值优先, 否则用定义默认值。 */
function paramValue(node: BlueprintNode, key: string, fallback: unknown): unknown {
  const v = node.params?.[key];
  return v === undefined ? fallback : v;
}

/**
 * 求值一张图。
 *
 * @param entry 执行流起点。不传则退化为"按拓扑序求值所有数据节点"。
 */
export async function evaluateGraph(
  reg: BlueprintRegistry,
  graph: BlueprintGraph,
  opts: { readonly entry?: string } = {}
): Promise<EvalResult> {
  const outputs = new Map<string, Record<string, unknown>>();
  const errors = new Map<string, string>();
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));

  /**
   * 求某个节点的**数据**输出。带缓存, 带环保护。
   * `stack` 用来把求值时的环报错落到具体节点上。
   */
  const computing = new Set<string>();
  const evalData = async (id: string): Promise<Record<string, unknown> | undefined> => {
    if (outputs.has(id)) return outputs.get(id);
    if (computing.has(id)) {
      const chain = [...computing, id].join(" → ");
      errors.set(id, `求值过程中出现循环依赖: ${chain}`);
      return undefined;
    }
    const node = nodeById.get(id);
    if (!node) return undefined;
    const def = reg.nodeTypes.get(node.type);
    if (!def) {
      errors.set(id, `未注册的节点类型: ${node.type}`);
      return undefined;
    }

    computing.add(id);
    try {
      const inputs: Record<string, unknown> = {};
      for (const port of def.inputs ?? []) {
        const e = inEdges(graph, id).find((x) => x.to.port === port.id);
        if (e) {
          const up = await evalData(e.from.node);
          inputs[port.id] = up?.[e.from.port];
        } else if (port.default !== undefined) {
          inputs[port.id] = port.default;
        }
      }
      const params: Record<string, unknown> = {};
      for (const p of def.params ?? []) params[p.id] = paramValue(node, p.id, p.default);

      /**
       * 子图节点: 进去跑一遍里面的图, 把结果接回来。
       *
       * 入参怎么进来: 隧道输入节点读 `params.__value` —— 它的 evaluate 就是
       * 把这值原样吐出。这样"外部 -> 隧道 -> 内部"是一条普通的边,
       * 求值器不需要知道子图这回事。
       */
      if (node.subgraph) {
        const sg = graph.subgraphs?.[node.subgraph];
        if (!sg) {
          errors.set(id, `子图不存在: ${node.subgraph}`);
          return undefined;
        }
        const innerGraph: BlueprintGraph = { nodes: sg.nodes, edges: sg.edges, subgraphs: graph.subgraphs };
        /**
         * 给每个输入隧道灌值, 并从输出隧道收值。
         *
         * 隧道的"对外端口 id"与它的 `params.name` 是**两回事**:
         * 前者是连线用的 (如 "a"/"out"), 后者是给人看的标签 (如 "结果")。
         * 这里必须按**端口 id** 对齐 —— 用 label 对齐的话, 一旦两个端口
         * 同名或用户改了标签, 值就会喂错地方, 而且不报错。
         */
        /**
         * 隧道节点的端口固定叫 "value"; 它对应哪个**对外端口**由
         * 子图定义里的隧道顺序决定 —— 第 i 个输入隧道对第 i 个 inputs[i],
         * 输出同理。这个对应关系是折叠时按同一份数组建的, 两边同序即可。
         */
        const inTunnels = sg.nodes.filter((n) => n.type === "subgraph.input");
        const outTunnels = sg.nodes.filter((n) => n.type === "subgraph.output");

        const seeded = {
          ...innerGraph,
          nodes: innerGraph.nodes.map((n) => {
            if (n.type !== "subgraph.input") return n;
            const i = inTunnels.findIndex((t) => t.id === n.id);
            const portId = (sg.inputs ?? [])[i]?.id;
            return { ...n, params: { ...(n.params ?? {}), __value: inputs[portId ?? ""] } };
          }),
        };
        /**
         * 子图**不传 entry**。
         *
         * 子图里的执行流是它自己的事 (很多子图压根没有执行流, 纯是数据变换)。
         * 外层沿 exec 走进来时, 要的是"把这片数据算出结果", 而不是
         * "在子图里再找一条执行链" —— 后者会因为隧道节点没有 execIn 而
         * 一个节点都走不到, 结果就是空输出且不报错。实测踩到过。
         */
        const r = await evaluateGraph(reg, seeded);
        const out: Record<string, unknown> = {};
        for (const [nid, vals] of r.outputs) {
          const i = outTunnels.findIndex((t) => t.id === nid);
          if (i < 0) continue;
          const portId = (sg.outputs ?? [])[i]?.id;
          if (portId) out[portId] = vals.value;
        }
        for (const [nid, msg] of r.errors) errors.set(`${id}/${nid}`, msg);
        outputs.set(id, out);
        return out;
      }

      if (!def.evaluate) {
        // 没有求值函数: 当成"把输入原样透传到同名输出", 让图不至于断掉
        const passthrough: Record<string, unknown> = {};
        for (const o of def.outputs ?? []) passthrough[o.id] = inputs[o.id];
        outputs.set(id, passthrough);
        return passthrough;
      }
      const ctx: EvalContext = { inputs, params };
      const out = await def.evaluate(ctx);
      outputs.set(id, out);
      return out;
    } catch (err) {
      errors.set(id, err instanceof Error ? err.message : String(err));
      return undefined;
    } finally {
      computing.delete(id);
    }
  };

  // ── 有执行入口: 沿 exec 边走 ────────────────────────────────────
  if (opts.entry) {
    const visited = new Set<string>();
    const stack: Array<{ id: string; via?: string }> = [{ id: opts.entry }];
    while (stack.length) {
      const cur = stack.pop()!;
      if (visited.has(cur.id)) continue; // 分支合并回同一节点时只走一次
      visited.add(cur.id);
      const def = reg.nodeTypes.get(nodeById.get(cur.id)?.type ?? "");
      await evalData(cur.id);
      if (!def) continue;
      const outs = execOutIds(def);
      for (const oid of outs) {
        const next = graph.edges.find((e) => e.from.node === cur.id && e.from.port === oid);
        if (next) stack.push({ id: next.to.node, via: oid });
      }
    }
    return { outputs, errors, ok: errors.size === 0 };
  }

  // ── 无执行入口: 按拓扑序求值全部 ────────────────────────────────
  const order = topoSort(graph);
  if (!order) {
    /**
     * 拓扑序失败时**仍然逐节点求值**, 而不是直接报错退出。
     *
     * 直接退出只能报一句"图中存在循环", 指不出是哪些节点 —— 用户拿到这条
     * 报错还得自己去找环。而逐节点求值时 `evaluating` 集合会在真正回环的
     * 那一步命中, 报出**具体是哪几个节点**互相等着对方。
     * 差别是"图里有环"和"a 和 b 互相依赖", 后者才能动手修。
     */
    for (const n of graph.nodes) await evalData(n.id);
    if (errors.size === 0) errors.set("*", "图中存在循环, 无法确定求值顺序");
    return { outputs, errors, ok: false };
  }
  for (const id of order) await evalData(id);
  return { outputs, errors, ok: errors.size === 0 };
}

/** 找出可作为执行起点的节点 (有 execIn 且没有上游 exec 边)。 */
export function findEntries(graph: BlueprintGraph): string[] {
  return graph.nodes
    .filter((n) => !graph.edges.some((e) => e.to.node === n.id && e.to.port === EXEC_IN_PORT))
    .map((n) => n.id);
}
