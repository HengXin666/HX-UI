import type {
  BlueprintEdge,
  BlueprintGraph,
  BlueprintNode,
  BlueprintRegistry,
  GraphValidation,
  NodeValidation,
  PortDef,
  ValidationIssue,
} from "./types";
import { EXEC_IN_PORT, execOutIds, resolvePort, nodeShape } from "./connect";

/**
 * 图校验。
 *
 * ## 分层 (这是整套设计的要点)
 *
 * L1 结构  节点类型注册了吗 / 端口存在吗 / 边指向的节点在吗
 * L2 局部  这条线的类型对不对 / 必填输入有没有连
 * L3 全局  有没有环
 * L4 业务  节点自带的 validate 钩子
 *
 * 只有 L1 通过了才跑 L2  拿一个未知端口去做类型比较没有意义,
 * 而且会产出两条互相矛盾的报错。L3 必须最后跑: 环上的每个节点都"局部正确",
 * 只有把整张图连起来看才出问题。
 *
 * ## 关于环
 *
 * 环不是"某一行代码错了", 它是**一组边**的属性。所以环的报错挂在边上
 * (`byEdge`), 而不是节点上  挂节点会让人以为删掉那个节点就好,
 * 实际得删环上任意一条边。
 */

/** 入边索引: 输入端口 -> 边列表。全图只建一次, 各处复用。 */
function indexIncoming(graph: BlueprintGraph): Map<string, BlueprintEdge[]> {
  const m = new Map<string, BlueprintEdge[]>();
  for (const e of graph.edges) {
    const key = `${e.to.node}:${e.to.port}`;
    const list = m.get(key);
    if (list) list.push(e);
    else m.set(key, [e]);
  }
  return m;
}

/** 端口形貌统一走 nodeShape  子图节点与实例 ports 才能被正确识别。 */
function outPorts(reg: BlueprintRegistry, graph: BlueprintGraph, node: BlueprintNode): PortDef[] {
  return [...nodeShape(reg, graph, node.id).outputs];
}

function inPorts(reg: BlueprintRegistry, graph: BlueprintGraph, node: BlueprintNode): PortDef[] {
  return [...nodeShape(reg, graph, node.id).inputs];
}

/**
 * 全图校验。
 *
 * @param reg 注册中心
 * @param graph 待校验的图
 * @param opts.requireEntry 有执行入口的图是否必须有一个"起点" (无入边执行流的节点)
 */
export function validateGraph(
  reg: BlueprintRegistry,
  graph: BlueprintGraph,
  opts: { readonly requireEntry?: boolean; readonly _visited?: Set<string> } = {}
): GraphValidation {
  /** 已校验过的子图 id。递归时透传, 防止子图互相引用导致无限递归。 */
  const visited = opts._visited ?? new Set<string>();
  const issues: ValidationIssue[] = [];
  const byNode = new Map<string, NodeValidation>();
  const byEdge = new Map<string, ValidationIssue[]>();
  const incoming = indexIncoming(graph);
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));

  const push = (issue: ValidationIssue) => {
    issues.push(issue);
    for (const id of issue.nodeIds ?? []) {
      const cur = byNode.get(id);
      const next: NodeValidation = cur
        ? { ...cur, issues: [...cur.issues, issue], ok: cur.ok && issue.level !== "error" }
        : {
            nodeId: id,
            portErrors: {},
            issues: [issue],
            ok: issue.level !== "error",
          };
      byNode.set(id, next);
    }
    for (const id of issue.edgeIds ?? []) {
      byEdge.set(id, [...(byEdge.get(id) ?? []), issue]);
    }
  };

  // ── L1 结构 ──────────────────────────────────────────────────────
  for (const node of graph.nodes) {
    if (!reg.nodeTypes.has(node.type)) {
      push({
        code: "unknown-node-type",
        level: "error",
        message: `未注册的节点类型: ${node.type}`,
        nodeIds: [node.id],
      });
    } else {
      byNode.set(node.id, { nodeId: node.id, portErrors: {}, issues: [], ok: true });
    }
  }

  const liveEdges: BlueprintEdge[] = [];
  for (const e of graph.edges) {
    const srcOk = !!resolvePort(reg, graph, e.from, "out");
    const dstOk = !!resolvePort(reg, graph, e.to, "in");
    if (!nodeById.has(e.from.node) || !nodeById.has(e.to.node)) {
      push({ code: "dangling-ref", level: "error", message: `连线指向不存在的节点`, edgeIds: [e.id] });
      continue;
    }
    if (!srcOk || !dstOk) {
      push({
        code: "unknown-port",
        level: "error",
        message: `端口不存在: ${srcOk ? "" : e.from.port} ${dstOk ? "" : e.to.port}`.trim(),
        edgeIds: [e.id],
        nodeIds: [srcOk ? e.to.node : e.from.node],
      });
      continue;
    }
    liveEdges.push(e);
  }

  // ── L2 局部: 类型 + 必填 + 占位 ──────────────────────────────────
  const seenPair = new Set<string>();
  for (const e of liveEdges) {
    const src = resolvePort(reg, graph, e.from, "out");
    const dst = resolvePort(reg, graph, e.to, "in");
    if (!src || !dst) continue;

    const pair = `${e.from.node}:${e.from.port}>${e.to.node}:${e.to.port}`;
    if (seenPair.has(pair)) {
      push({ code: "duplicate-edge", level: "error", message: "重复连线", edgeIds: [e.id] });
      continue;
    }
    seenPair.add(pair);

    if (src.isExec !== dst.isExec) {
      push({ code: "type-mismatch", level: "error", message: "执行流与数据流不能互连", edgeIds: [e.id] });
      continue;
    }
    if (!reg.assignable(src.port.type, dst.port.type)) {
      push({
        code: "type-mismatch",
        level: "error",
        message: `类型不匹配: ${src.port.type} → ${dst.port.type}`,
        edgeIds: [e.id],
        nodeIds: [e.to.node],
      });
      continue;
    }

    const key = `${e.to.node}:${e.to.port}`;
    const list = incoming.get(key) ?? [];
    if (!dst.port.multi && list.length > 1) {
      push({
        code: "input-occupied",
        level: "error",
        message: `输入口 ${e.to.port} 接了 ${list.length} 条线`,
        edgeIds: list.map((x) => x.id),
        nodeIds: [e.to.node],
      });
    }
  }

  // 必填输入 + 节点红点
  for (const node of graph.nodes) {
    if (!reg.nodeTypes.has(node.type)) continue;
    const portErrors: Record<string, ValidationIssue> = {};
    for (const p of inPorts(reg, graph, node)) {
      const has = (incoming.get(`${node.id}:${p.id}`) ?? []).length > 0;
      // 子图输入隧道的值来自**外部调用点**, 内部没连不算错
      const isTunnelIn = node.type === "subgraph.input";
      if (!has && p.default === undefined && !isTunnelIn) {
        const issue: ValidationIssue = {
          code: "missing-input",
          level: "error",
          message: `缺少输入: ${p.label ?? p.id}`,
          nodeIds: [node.id],
        };
        portErrors[p.id] = issue;
        push(issue);
      }
    }
    const cur = byNode.get(node.id);
    if (cur) byNode.set(node.id, { ...cur, portErrors, ok: cur.ok && Object.keys(portErrors).length === 0 });
  }

  // ── L3 全局: 环 ──────────────────────────────────────────────────
  /**
   * 环检测只看**执行流边**。
   *
   * 数据边不参与: 它是"取值"不是"控制流"。把数据边算进来会误判 
   * 例如一条横跨两段的取值边, 而那两段之间又有执行流回路,
   * 于是那条数据边被圈进执行环, 整个环被判成"数据环"而报错。
   * 实际上数据在图上从来没有回环, 是控制流在回环。
   *
   * 那数据依赖的环就不管了吗? 管  求值器里有独立的环保护
   * (`evaluating` 集合), 它报的是"求值过程中出现循环依赖", 且落在具体节点上,
   * 比在这里静态报更准。这里的职责是"图能不能连", 不是"值能不能算出来"。
   */
  const execEdges = liveEdges.filter((e) => e.kind === "exec");

  /**
   * 只有**数据流**上的环才是错误。
   *
   * 执行流上的回路是 agent loop 这类东西的正常形态  "做完再来一轮"
   * 就是一条回到起点的边。把执行回路报成错误, 会让所有带循环的图
   * 永远红着, 于是人们只能关掉这条规则, 那时真正的数据环也没人管了。
   *
   * 所以判据是: 环里只要有一条**数据边**就报错; 纯执行回路放行。
   * 数据环是真错误, 因为求值无法确定顺序  上游依赖下游的值。
   */
  for (const cycle of findCycles(graph, execEdges)) {
    const edgesOnCycle = cycleEdges(execEdges, cycle);
    const hasData = edgesOnCycle.some((e) => e.kind !== "exec");
    if (hasData) {
      push({
        code: "cycle",
        level: "error",
        message: `数据依赖存在循环: ${cycle.join(" → ")}`,
        edgeIds: edgesOnCycle.map((e) => e.id),
        nodeIds: cycle,
      });
    } else {
      push({
        code: "cycle",
        level: "warning",
        message: `执行流回路: ${cycle.join(" → ")} (循环是刻意的, 不是错误)`,
        edgeIds: edgesOnCycle.map((e) => e.id),
        nodeIds: cycle,
      });
    }
  }

  // ── L4 业务钩子 ──────────────────────────────────────────────────
  const validatorMap = (reg as { validators?: Map<string, (c: unknown) => readonly ValidationIssue[]> }).validators;
  if (validatorMap) {
    for (const node of graph.nodes) {
      const def = reg.nodeTypes.get(node.type);
      const fn = def && validatorMap.get(node.type);
      if (!def || !fn) continue;
      const inDegree: Record<string, number> = {};
      for (const p of inPorts(reg, graph, node)) inDegree[p.id] = (incoming.get(`${node.id}:${p.id}`) ?? []).length;
      const out = fn({ node, def, params: node.params ?? {}, inDegree });
      for (const i of out) push({ ...i, nodeIds: i.nodeIds ?? [node.id] });
    }
  }

  // ── 子图: 逐张递归校验 ──────────────────────────────────────────
  // 子图内部的报错要带上"哪张子图"的前缀, 否则用户看到一条报错却不知道
  // 该进哪一层去修  那是最折磨人的一类诊断。
  for (const [sgId, sg] of Object.entries(graph.subgraphs ?? {})) {
    /**
     * 递归必须带"已访问"集合。
     *
     * 第一版把整张 subgraphs 表原样传下去, 于是每张子图都会再校验一遍
     * **全部**子图 (包括它自己)  一层嵌套就是无限递归, 直接爆栈。
     * 子图之间的引用不是树而是任意图 (一个子图可以被多个子图调用),
     * 所以这里必须按 id 去重, 而不是靠"深度递减"。
     */
    if (visited.has(sgId)) continue;
    visited.add(sgId);
    const inner = validateGraph(
      reg,
      { nodes: sg.nodes, edges: sg.edges, subgraphs: graph.subgraphs },
      { ...opts, _visited: visited }
    );
    for (const i of inner.issues) {
      push({
        ...i,
        message: `[${sg.label ?? sgId}] ${i.message}`,
        nodeIds: i.nodeIds?.map((id) => `${sgId}/${id}`),
      });
    }
  }

  // 执行图至少要有个起点, 否则连不出来一条可执行的链
  if (opts.requireEntry) {
    const execNodes = graph.nodes.filter((n) => reg.nodeTypes.get(n.type)?.execIn);
    if (execNodes.length > 0) {
      const hasEntry = execNodes.some(
        (n) => !liveEdges.some((e) => e.to.node === n.id && e.to.port === EXEC_IN_PORT)
      );
      if (!hasEntry) {
        push({
          code: "no-entry",
          level: "error",
          message: "执行图缺少起点 (每个执行节点都有上游, 没有入口)",
        });
      }
    }
  }

  return {
    ok: issues.every((i) => i.level !== "error"),
    issues,
    byNode,
    byEdge,
  };
}

/** 环上那些边 (用于把红线画在边上)。 */
/**
 * 构成这个环的那些边。
 *
 * 判据是"首尾相接", 不是"两端都落在环节点集合里"  后者会把环上节点之间
 * 的**其它**边也圈进来, 于是纯执行回路会被误判成数据环。
 */
function cycleEdges(edges: readonly BlueprintEdge[], cycle: readonly string[]): BlueprintEdge[] {
  const out: BlueprintEdge[] = [];
  for (let i = 0; i < cycle.length; i++) {
    const from = cycle[i];
    const to = cycle[(i + 1) % cycle.length];
    for (const e of edges) {
      if (e.from.node === from && e.to.node === to) out.push(e);
    }
  }
  return out;
}

/**
 * 找出所有环 (DFS + 着色)。
 *
 * 返回的是环上的节点 id 列表。节点数很多时环可能很多, 这里只做完整枚举 
 * 蓝图规模通常在百级, 不值得为它写 Tarjan 那种强连通分量分解
 * (而且 SCC 会把"两个环共用一个节点"合并成一片, 报出来反而不如逐个清楚)。
 */
export function findCycles(graph: BlueprintGraph, edges?: readonly BlueprintEdge[]): string[][] {
  const es = edges ?? graph.edges;
  const adj = new Map<string, string[]>();
  for (const e of es) {
    if (e.from.node === e.to.node) continue; // 自环已单独报
    const list = adj.get(e.from.node);
    if (list) list.push(e.to.node);
    else adj.set(e.from.node, [e.to.node]);
  }

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  const stack: string[] = [];
  const cycles: string[][] = [];
  const seen = new Set<string>();

  const visit = (u: string) => {
    color.set(u, GRAY);
    stack.push(u);
    for (const v of adj.get(u) ?? []) {
      const c = color.get(v) ?? WHITE;
      if (c === GRAY) {
        // 回边: 从 v 在栈上的位置到栈顶就是一个环
        const start = stack.indexOf(v);
        const cyc = stack.slice(start);
        const key = [...cyc].sort().join("|");
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(cyc);
        }
      } else if (c === WHITE) {
        visit(v);
      }
    }
    stack.pop();
    color.set(u, BLACK);
  };

  for (const n of graph.nodes) if ((color.get(n.id) ?? WHITE) === WHITE) visit(n.id);
  return cycles;
}

/**
 * 拓扑排序 (Kahn)。有环时返回 null  调用方拿它当"能不能执行"的判据。
 */
export function topoSort(graph: BlueprintGraph, edges?: readonly BlueprintEdge[]): string[] | null {
  const es = edges ?? graph.edges;
  const indeg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const n of graph.nodes) indeg.set(n.id, 0);
  for (const e of es) {
    if (e.from.node === e.to.node) continue;
    indeg.set(e.to.node, (indeg.get(e.to.node) ?? 0) + 1);
    const list = adj.get(e.from.node);
    if (list) list.push(e.to.node);
    else adj.set(e.from.node, [e.to.node]);
  }
  const queue = graph.nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0).map((n) => n.id);
  const out: string[] = [];
  while (queue.length) {
    const u = queue.shift()!;
    out.push(u);
    for (const v of adj.get(u) ?? []) {
      const d = (indeg.get(v) ?? 0) - 1;
      indeg.set(v, d);
      if (d === 0) queue.push(v);
    }
  }
  return out.length === graph.nodes.length ? out : null;
}

/** 某节点的上游节点 (递归)。用于"改了这个节点, 哪些要重算"。 */
export function upstreamOf(graph: BlueprintGraph, nodeId: string): Set<string> {
  const rev = new Map<string, string[]>();
  for (const e of graph.edges) {
    const list = rev.get(e.to.node);
    if (list) list.push(e.from.node);
    else rev.set(e.to.node, [e.from.node]);
  }
  const out = new Set<string>();
  const stack = [nodeId];
  while (stack.length) {
    const u = stack.pop()!;
    for (const p of rev.get(u) ?? []) {
      if (out.has(p)) continue;
      out.add(p);
      stack.push(p);
    }
  }
  return out;
}

/**
 * 端口形貌汇总, 序列化与调试用。
 * 需要传 graph  子图节点的外形由子图定义决定, 光有 node 算不出来。
 */
export function allPorts(
  reg: BlueprintRegistry,
  graph: BlueprintGraph,
  node: BlueprintNode
): { inputs: PortDef[]; outputs: PortDef[]; execIn: boolean; execOuts: string[] } {
  const shape = nodeShape(reg, graph, node.id);
  return {
    inputs: inPorts(reg, graph, node),
    outputs: outPorts(reg, graph, node),
    execIn: shape.execIn,
    execOuts: execOutIds(shape),
  };
}
