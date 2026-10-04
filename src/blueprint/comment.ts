import type { BlueprintComment, BlueprintGraph, BlueprintNode, BlueprintRegistry } from "./types";
import { nodeHeight, nodeWidth } from "./geometry";

/**
 * 区间注释。
 *
 * ## 它不是节点
 *
 * 不连线、不参与求值、不影响校验 —— 它只是画布上**一个带标题的矩形**。
 * 把它做成节点会引出一堆没有答案的问题 (它有输出吗? 进拓扑序吗? 能连吗?),
 * 而它的真实用途只是"给一片节点加个说明框"。
 *
 * ## 唯一的行为约定: 拖动注释, 完全落在里面的节点跟着走
 *
 * 为什么是"完全落在里面"而不是"相交": 相交会让一次拖动带走半个图
 * (注释框通常画得比内容大一圈, 相交判定几乎必然命中相邻节点)。
 * 完全包含是一个保守但可预测的判据 —— 用户能一眼看出哪些会被带走。
 */

/** 注释是否完全包住一个节点。 */
export function commentContains(
  reg: BlueprintRegistry,
  node: BlueprintNode,
  c: Pick<BlueprintComment, "x" | "y" | "w" | "h">
): boolean {
  const w = nodeWidth(reg, node);
  const h = nodeHeight(reg, node);
  return node.x >= c.x && node.y >= c.y && node.x + w <= c.x + c.w && node.y + h <= c.y + c.h;
}

/** 落在注释里的节点。 */
export function nodesInComment(
  reg: BlueprintRegistry,
  graph: BlueprintGraph,
  commentId: string
): BlueprintNode[] {
  const c = graph.comments?.find((x) => x.id === commentId);
  if (!c) return [];
  return graph.nodes.filter((n) => commentContains(reg, n, c));
}

/**
 * 拖动注释: 注释自己移动, 里面被完全包住的节点跟着移动。
 *
 * 返回新图。一次提交 —— 逐个节点提交会让受控模式下只留下最后一个的位移。
 */
export function moveCommentWithNodes(
  reg: BlueprintRegistry,
  graph: BlueprintGraph,
  commentId: string,
  delta: { readonly dx: number; readonly dy: number }
): BlueprintGraph {
  const carried = new Set(nodesInComment(reg, graph, commentId).map((n) => n.id));
  return {
    ...graph,
    nodes: graph.nodes.map((n) => (carried.has(n.id) ? { ...n, x: n.x + delta.dx, y: n.y + delta.dy } : n)),
    comments: (graph.comments ?? []).map((c) =>
      c.id === commentId ? { ...c, x: c.x + delta.dx, y: c.y + delta.dy } : c
    ),
  };
}

/** 改注释的尺寸 (右下角拖把手)。 */
export function resizeComment(
  graph: BlueprintGraph,
  commentId: string,
  box: { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
): BlueprintGraph {
  return {
    ...graph,
    comments: (graph.comments ?? []).map((c) =>
      c.id === commentId
        ? { ...c, x: box.x, y: box.y, w: Math.max(80, box.w), h: Math.max(60, box.h) }
        : c
    ),
  };
}

export function addComment(
  graph: BlueprintGraph,
  c: Omit<BlueprintComment, "id"> & { readonly id?: string }
): { readonly graph: BlueprintGraph; readonly id: string } {
  const id = c.id ?? `cm${Date.now().toString(36).slice(-5)}`;
  return {
    id,
    graph: {
      ...graph,
      comments: [...(graph.comments ?? []), { ...c, id, w: c.w ?? 240, h: c.h ?? 140 }],
    },
  };
}

export function removeComment(graph: BlueprintGraph, id: string): BlueprintGraph {
  return { ...graph, comments: (graph.comments ?? []).filter((c) => c.id !== id) };
}

export function updateComment(
  graph: BlueprintGraph,
  id: string,
  patch: Partial<Omit<BlueprintComment, "id">>
): BlueprintGraph {
  return {
    ...graph,
    comments: (graph.comments ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)),
  };
}

/**
 * 从选中的节点生成一个注释框 (刚好包住它们)。
 *
 * 这是最常用的入口: 框选一批节点 -> "加注释" -> 得到刚好包住它们的框,
 * 而不是让用户手动拖一个矩形再去对位置。
 */
export function commentAround(
  reg: BlueprintRegistry,
  graph: BlueprintGraph,
  ids: readonly string[],
  opts: { readonly title?: string; readonly padding?: number; readonly id?: string } = {}
): { readonly graph: BlueprintGraph; readonly id: string } {
  const pad = opts.padding ?? 24;
  const picked = graph.nodes.filter((n) => ids.includes(n.id));
  if (picked.length === 0) return addComment(graph, { x: 0, y: 0, w: 240, h: 140, ...(opts.title ? { title: opts.title } : {}), ...(opts.id ? { id: opts.id } : {}) });

  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const n of picked) {
    x0 = Math.min(x0, n.x);
    y0 = Math.min(y0, n.y);
    x1 = Math.max(x1, n.x + nodeWidth(reg, n));
    y1 = Math.max(y1, n.y + nodeHeight(reg, n));
  }
  return addComment(graph, {
    x: x0 - pad,
    y: y0 - pad - 18, // 上方多留一截给标题条
    w: x1 - x0 + pad * 2,
    h: y1 - y0 + pad * 2 + 18,
    ...(opts.title ? { title: opts.title } : {}),
    ...(opts.id ? { id: opts.id } : {}),
  });
}
