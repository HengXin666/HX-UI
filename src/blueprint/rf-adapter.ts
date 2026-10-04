import type { Edge, Node } from "@xyflow/react";
import type {
  BlueprintGraph, BlueprintEdge, BlueprintRegistry,
  BlueprintComment, DataTypeId, PortDef, ParamDef,
} from "./types";
import { EXEC_IN_PORT, execOutIds } from "./connect";
import { EXEC } from "./types";
import { nodeKindOf } from "./node-style";

/**
 * 我们的 BlueprintGraph <-> React Flow 的 nodes/edges 适配层。
 *
 * ## 为什么要有这一层
 *
 * 两套数据模型的**形状与语义都不同**, 不能直接互用:
 *
 *   | 我们                        | React Flow                  |
 *   |---                          |---                          |
 *   | 端口是**命名**的 (id)        | Handle 是**位置**上的 (id)   |
 *   | 一条边两端是 {node, port}    | {source, sourceHandle, target, targetHandle} |
 *   | 边有 kind: exec/data        | 靠 style 区分               |
 *   | 类型相容由 registry 判       | 由 isValidConnection 回调判 |
 *   | 注释是一等公民               | 无 (用自定义节点模拟)        |
 *
 * 直接把 BlueprintGraph 塞给 React Flow 会丢掉"端口名"这个最关键的信息
 * (线会连到错误的脚上)。所以两边各保留自己的模型, 这里做**双向转换**。
 *
 * ## 一条硬约定
 *
 * **我们的是真相。** React Flow 的 nodes/edges 只是渲染态。任何改动都
 * 先落到 BlueprintGraph, 再由本层换算成 React Flow 的形状。
 * 反过来做 (让 React Flow 持有真相) 会让"校验/求值/序列化"全部要读它的
 * 内部结构, 而那个结构不含类型信息 —— 那条路走不通。
 */

/** React Flow 节点的 data 载荷。刻意只放渲染需要的东西。 */
export interface RfNodeData extends Record<string, unknown> {
  readonly bpId: string;
  readonly type: string;
  readonly title: string;
  /** 节点类别 (决定标题栏配色)。 */
  readonly kind: string;
  /**
   * 渲染端口行要用的定义。实例级 ports 优先于静态定义 (子图隧道靠它)。
   *
   * 颜色**预先算好**塞进来 (portColor), 而不是让节点组件去拿 registry:
   * registry 含函数 (assignable), 塞进 React Flow 的 data 会让它变成
   * 不可序列化的东西, 而且每帧换引用会触发无谓重渲染。
   */
  readonly inputs: readonly RfPort[];
  readonly outputs: readonly RfPort[];
  /** 参数定义 (渲染控件)。 */
  readonly params: readonly ParamDef[];
  /** 参数当前值。 */
  readonly values: Readonly<Record<string, unknown>>;
  readonly collapsed: boolean;
  /** 输入口 -> 是否已有连线 (决定引脚画实心还是空心)。 */
  readonly filled: Readonly<Record<string, boolean>>;
  /** 输入口 -> 是否有错。 */
  readonly portErrors: Readonly<Record<string, boolean>>;
  /** 引用子图 (可双击进入)。 */
  readonly subgraph?: string;
  readonly width?: number;
  /** 改参数 -> 交给外层落到 BlueprintGraph。 */
  readonly onParamChange?: (key: string, value: unknown) => void;
}

/** 渲染用端口: 定义 + 预先算好的颜色类名。 */
export interface RfPort {
  readonly id: string;
  readonly label?: string;
  readonly type: string;
  /** 引脚圆点颜色类名 (bg-*)。 */
  readonly color?: string;
  readonly exec?: boolean;
}

export type RfNode = Node<RfNodeData>;
export type RfEdge = Edge;

/** 端口 -> React Flow 的 handle id。加前缀避免与数据端口撞名。 */
export function handleId(portId: string, dir: "in" | "out"): string {
  return `${dir === "in" ? "i" : "o"}:${portId}`;
}

/** handle id -> 端口名。 */
export function portOfHandle(h?: string | null): string | null {
  if (!h) return null;
  const i = h.indexOf(":");
  return i === -1 ? h : h.slice(i + 1);
}

/**
 * 我们的图 -> React Flow 的 nodes/edges。
 *
 * @param connectedByNode 外部算好的"每个节点各输入口是否已连" —— 算它要遍历
 *   全部边, 而调用方通常已经算过一次了, 这里不重复算。
 */
export function toReactFlow(
  registry: BlueprintRegistry,
  graph: BlueprintGraph,
  opts?: {
    readonly connectedByNode?: Readonly<Record<string, Readonly<Record<string, boolean>>>>;
    readonly errorsByNode?: Readonly<Record<string, Readonly<Record<string, boolean>>>>;
    readonly onParamChange?: (nodeId: string, key: string, value: unknown) => void;
  }
): { nodes: RfNode[]; edges: RfEdge[] } {
  const connected = opts?.connectedByNode ?? computeConnected(graph);
  const errs = opts?.errorsByNode ?? {};

  const nodes: RfNode[] = graph.nodes.map((n) => {
    const def = registry.nodeTypes.get(n.type);
    return {
      id: n.id,
      type: "bp",
      position: { x: n.x, y: n.y },
      data: {
        bpId: n.id,
        type: n.type,
        title: n.title ?? def?.label ?? n.type,
        kind: nodeKindOf(def, n),
        // 实例级 ports 优先 —— 子图隧道的端口是每个实例不同的
        inputs: (n.ports?.inputs ?? def?.inputs ?? []).map((p) => toRfPort(registry, p)),
        outputs: [
          ...execOutIds(def).map((id) => ({ id, type: EXEC, exec: true as const })),
          ...(n.ports?.outputs ?? def?.outputs ?? []).map((p) => toRfPort(registry, p)),
        ],
        params: def?.params ?? [],
        values: n.params ?? {},
        collapsed: n.collapsed ?? def?.collapsed ?? false,
        filled: connected[n.id] ?? {},
        portErrors: errs[n.id] ?? {},
        ...(n.subgraph ? { subgraph: n.subgraph } : {}),
        ...(n.width ? { width: n.width } : {}),
        onParamChange: opts?.onParamChange
          ? (k: string, v: unknown) => opts.onParamChange?.(n.id, k, v)
          : undefined,
      },
      ...(n.width ? { width: n.width } : {}),
      // 折叠态: React Flow 自己不认识 collapsed, 我们用 data 表达
      hidden: false,
    };
  });

  const edges: RfEdge[] = graph.edges.map((e) => {
    const exec = e.kind === "exec" || isExecEnd(registry, graph, e);
    return {
      id: e.id,
      source: e.from.node,
      sourceHandle: handleId(e.from.port, "out"),
      target: e.to.node,
      targetHandle: handleId(e.to.port, "in"),
      type: exec ? "bpExec" : "bpData",
      // 类型色带过去, 让 edge 组件直接取, 不必反查 registry
      data: { exec, ...(exec ? {} : { tint: tintOf(registry, graph, e) }) },
    };
  });

  return { nodes, edges };
}

/** React Flow 的边 -> 我们的边。新增连线时用。 */
export function edgeFromRf(c: {
  readonly source: string;
  readonly sourceHandle?: string | null;
  readonly target: string;
  readonly targetHandle?: string | null;
}, id: string): BlueprintEdge | null {
  const fromPort = portOfHandle(c.sourceHandle);
  const toPort = portOfHandle(c.targetHandle);
  if (!fromPort || !toPort) return null;
  return {
    id,
    from: { node: c.source, port: fromPort },
    to: { node: c.target, port: toPort },
  };
}

/** 每个节点各输入口是否已连。 */
export function computeConnected(
  graph: BlueprintGraph
): Record<string, Record<string, boolean>> {
  const out: Record<string, Record<string, boolean>> = {};
  for (const n of graph.nodes) out[n.id] = {};
  for (const e of graph.edges) {
    if (!out[e.to.node]) out[e.to.node] = {};
    out[e.to.node][e.to.port] = true;
  }
  return out;
}

/** 这条边是不是执行流。 */
function isExecEnd(reg: BlueprintRegistry, g: BlueprintGraph, e: BlueprintEdge): boolean {
  if (e.kind === "exec") return true;
  if (e.kind === "data") return false;
  // 没写 kind: 反查端口类型
  const outN = g.nodes.find((n) => n.id === e.from.node);
  const def = outN ? reg.nodeTypes.get(outN.type) : undefined;
  if (!def) return false;
  if (e.from.port === EXEC_IN_PORT) return true;
  return execOutIds(def).includes(e.from.port);
}

/** 数据边的类型色 (来自起点端口)。 */
function tintOf(reg: BlueprintRegistry, g: BlueprintGraph, e: BlueprintEdge): string | undefined {
  const outN = g.nodes.find((n) => n.id === e.from.node);
  const def = outN ? reg.nodeTypes.get(outN.type) : undefined;
  const port = def?.outputs?.find((p) => p.id === e.from.port);
  const t: DataTypeId | undefined = port?.type;
  return t ? reg.typeStroke(t) : undefined;
}

/**
 * 注释 -> React Flow 节点。
 *
 * React Flow 没有"注释"概念, 用**自定义节点 + 负 z-index** 模拟:
 * 它是画布上第一个被渲染的东西, 视觉上在节点下面, 但不参与连线
 * (没有 Handle, 所以连不上)。拖动时由我们自己把里面的节点一起带走 ——
 * 那是 UE5 的 DefaultCommentNodeMoveMode 行为。
 */
/**
 * 注释 -> React Flow 节点。
 *
 * React Flow 没有"注释"概念, 用**自定义节点 + 低 z-index** 模拟:
 * 它在节点之前渲染, 视觉上位于节点之下, 但不参与连线 (没有 Handle,
 * 所以连不上)。拖动由 React Flow 处理, "带走里面的节点"由我们自己在
 * use-graph-changes 里补 —— 那是 UE5 的 DefaultCommentNodeMoveMode。
 *
 * ⚠️ 必须**带完整的 comment 对象**过去, 不能塞进通用 data:
 *    注释要有 title / body / tone, 而通用节点 data 里没有这些字段。
 *    上一版就是塞通用 data, 结果只画出一个空标题栏。
 */
export function commentToNode(c: BlueprintComment): RfNode {
  return {
    id: `cmt:${c.id}`,
    type: "bpComment",
    position: { x: c.x, y: c.y },
    selectable: true,
    draggable: true,
    connectable: false,
    data: { comment: c } as unknown as RfNodeData,
    style: { width: c.w, height: c.h, zIndex: 0 },
  };
}

export function isCommentNode(id: string): boolean {
  return id.startsWith("cmt:");
}

export function commentIdOf(id: string): string {
  return id.startsWith("cmt:") ? id.slice(4) : id;
}

/** 端口定义 -> 渲染用端口 (顺手把颜色算好)。 */
function toRfPort(reg: BlueprintRegistry, p: PortDef): RfPort {
  return {
    id: p.id,
    ...(p.label ? { label: p.label } : {}),
    type: p.type,
    ...(reg.typeColor(p.type) ? { color: reg.typeColor(p.type) } : {}),
  };
}
