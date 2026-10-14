import type { BlueprintComment, BlueprintGraph, BlueprintNode, BlueprintRegistry } from "./types";
import { nodeHeight, nodeWidth } from "./geometry";

/**
 * 区间注释。
 *
 * ## 它不是节点
 *
 * 不连线、不参与求值、不影响校验  它只是画布上**一个带标题的矩形**。
 * 把它做成节点会引出一堆没有答案的问题 (它有输出吗? 进拓扑序吗? 能连吗?),
 * 而它的真实用途只是"给一片节点加个说明框"。
 *
 * ## 唯一的行为约定: 拖动注释, 完全落在里面的节点跟着走
 *
 * 为什么是"完全落在里面"而不是"相交": 相交会让一次拖动带走半个图
 * (注释框通常画得比内容大一圈, 相交判定几乎必然命中相邻节点)。
 * 完全包含是一个保守但可预测的判据  用户能一眼看出哪些会被带走。
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

/**
 * 注释与节点的关系  供 UI 做交互反馈。
 *
 * 为什么需要: "框住了没有"必须**看得见**。UE5 里注释框住的节点会有明确的
 * 视觉关联; 没有反馈的话用户不知道拖动会带走哪些, 于是要么不敢拖,
 * 要么拖完发现带错了。
 */
export interface CommentRelation {
  /** 完全落在框里 (拖动会带走)。 */
  readonly inside: readonly string[];
  /** 与框相交但没被完全包住 (拖动**不会**带走)。 */
  readonly partial: readonly string[];
}

export function commentRelation(
  reg: BlueprintRegistry,
  graph: BlueprintGraph,
  commentId: string
): CommentRelation {
  const c = graph.comments?.find((x) => x.id === commentId);
  if (!c) return { inside: [], partial: [] };
  const inside: string[] = [];
  const partial: string[] = [];
  for (const n of graph.nodes) {
    if (commentContains(reg, n, c)) {
      inside.push(n.id);
      continue;
    }
    const w = nodeWidth(reg, n);
    const h = nodeHeight(reg, n);
    const hit =
      n.x < c.x + c.w && n.x + w > c.x && n.y < c.y + c.h && n.y + h > c.y;
    if (hit) partial.push(n.id);
  }
  return { inside, partial };
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
 * 移动注释: 注释自己走到目标位置, 里面被完全包住的节点跟着走同样的位移。
 *
 * 参数是**绝对目标坐标**, 不是增量。
 *
 * 为什么改成绝对量: 原来接受 { dx, dy } 增量, 调用方在拖拽过程中每帧
 * 调用, 而每一帧都在"当前位置"上再加一次**累积**位移  指数级放大,
 * 表现就是位移被反复累加。接受绝对坐标后, 无论调用多少次,
 * 结果都只取决于最后一次的目标位置, 天然幂等。
 */
export function moveCommentWithNodes(
  reg: BlueprintRegistry,
  graph: BlueprintGraph,
  commentId: string,
  at: { readonly x: number; readonly y: number }
): BlueprintGraph {
  const target = graph.comments?.find((c) => c.id === commentId);
  if (!target) return graph;
  const dx = at.x - target.x;
  const dy = at.y - target.y;
  if (dx === 0 && dy === 0) return graph;

  // 先按"移动前"的位置判定谁在框里  判定必须基于拖动开始时的包含关系
  const carried = new Set(nodesInComment(reg, graph, commentId).map((n) => n.id));
  return {
    ...graph,
    nodes: graph.nodes.map((n) => (carried.has(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n)),
    comments: (graph.comments ?? []).map((c) => (c.id === commentId ? { ...c, x: at.x, y: at.y } : c)),
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
