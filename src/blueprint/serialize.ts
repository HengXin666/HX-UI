import type { BlueprintGraph, BlueprintRegistry } from "./types";

/**
 * 序列化。
 *
 * 格式刻意保持"就是一个 JSON": 不加密、不加版本号以外的元数据。
 * 蓝图是**用户资产**, 要能进 git diff、能被人手改、能被后端直接读。
 *
 * 校验放在读取侧 (`parseGraph`) 而不是写入侧  写入侧校验会让"存一份半成品"
 * 变成不可能, 而自动保存就是需要能存半成品。
 */

export const FORMAT_VERSION = 1;

export interface SerializedGraph {
  readonly version: number;
  readonly nodes: readonly BlueprintGraph["nodes"][number][];
  readonly edges: readonly BlueprintGraph["edges"][number][];
}

export function serializeGraph(graph: BlueprintGraph): SerializedGraph {
  return { version: FORMAT_VERSION, nodes: graph.nodes, edges: graph.edges };
}

/** 反序列化。纯形状校验  类型合法性交给 validateGraph (它需要 registry)。 */
export function parseGraph(raw: unknown): BlueprintGraph | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.nodes) || !Array.isArray(o.edges)) return null;

  const nodes = o.nodes.flatMap((n) => {
    if (typeof n !== "object" || n === null) return [];
    const x = n as Record<string, unknown>;
    if (typeof x.id !== "string" || typeof x.type !== "string") return [];
    return [
      {
        id: x.id,
        type: x.type,
        x: num(x.x, 0),
        y: num(x.y, 0),
        ...(typeof x.title === "string" ? { title: x.title } : {}),
        ...(typeof x.params === "object" && x.params !== null ? { params: x.params as Record<string, unknown> } : {}),
        ...(typeof x.collapsed === "boolean" ? { collapsed: x.collapsed } : {}),
        // 实例级端口与子图引用: 丢了它们, 子图节点就退回成静态定义的形状
        ...(typeof x.ports === "object" && x.ports !== null ? { ports: x.ports as never } : {}),
        ...(typeof x.subgraph === "string" ? { subgraph: x.subgraph } : {}),
        ...(typeof x.width === "number" ? { width: x.width } : {}),
      },
    ];
  });

  const ids = new Set(nodes.map((n) => n.id));
  const edges = o.edges.flatMap((e) => {
    if (typeof e !== "object" || e === null) return [];
    const x = e as Record<string, unknown>;
    const from = x.from as Record<string, unknown> | undefined;
    const to = x.to as Record<string, unknown> | undefined;
    if (!from || !to) return [];
    if (typeof from.node !== "string" || typeof from.port !== "string") return [];
    if (typeof to.node !== "string" || typeof to.port !== "string") return [];
    // 指向不存在节点的边直接丢  留着它只会让每个下游函数都要防一手
    if (!ids.has(from.node) || !ids.has(to.node)) return [];
    return [
      {
        id: typeof x.id === "string" ? x.id : `e_${from.node}_${from.port}_${to.node}_${to.port}`,
        from: { node: from.node, port: from.port },
        to: { node: to.node, port: to.port },
        kind: x.kind === "exec" ? ("exec" as const) : ("data" as const),
      },
    ];
  });

  // 子图与注释只做"形状确认", 深层合法性交给 validateGraph 递归校验 
  // 读取侧不该因为一个字段类型不对就把整张图判死, 那样用户连修的机会都没有
  const subgraphs =
    typeof o.subgraphs === "object" && o.subgraphs !== null ? (o.subgraphs as Record<string, unknown>) : undefined;
  const comments = Array.isArray(o.comments) ? (o.comments as unknown[]) : undefined;

  return {
    nodes,
    edges,
    ...(subgraphs ? { subgraphs: subgraphs as never } : {}),
    ...(comments ? { comments: comments as never } : {}),
  };
}

function num(v: unknown, d: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : d;
}

/**
 * 导出成伪代码。
 *
 * 为什么值得有: 蓝图最终要落到某个执行环境里 (后端 / 构建脚本 / 低代码运行时)。
 * 给一个"能读的生成物"比给 JSON 更容易让人确认图连对了。
 */
export function toPseudoCode(reg: BlueprintRegistry, graph: BlueprintGraph): string {
  const lines: string[] = [];
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  for (const n of graph.nodes) {
    const def = reg.nodeTypes.get(n.type);
    const args = (def?.inputs ?? [])
      .map((p) => {
        const e = graph.edges.find((x) => x.to.node === n.id && x.to.port === p.id);
        if (e) return `${p.id} = ${byId.get(e.from.node)?.title ?? e.from.node}.${e.from.port}`;
        if (p.default !== undefined) return `${p.id} = ${JSON.stringify(p.default)}`;
        return null;
      })
      .filter(Boolean)
      .join(", ");
    const params = Object.entries(n.params ?? {})
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(", ");
    const label = n.title ?? def?.label ?? n.type;
    lines.push(`${n.id}: ${label}(${args}${params ? (args ? ", " : "") + params : ""})`);
  }
  return lines.join("\n");
}
