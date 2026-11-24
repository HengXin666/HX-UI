import type { IdGen } from "./ids";
import type { Registry } from "./registry";
import { boundsOf, boxContains, boxesOverlap, nodeBox, type Box } from "./size";
import type { BlueprintComment, BlueprintGraph } from "./types";

/**
 * Comment boxes (UE5 Comment). Pure functions over the graph. A comment "contains" a node when the
 * node's whole box lies inside it, using the same metrics as layout (size.ts).
 */

export const COMMENT_MIN = { w: 80, h: 60 } as const;
/** Extra room above the nodes for the comment title bar. */
export const COMMENT_TITLE_H = 22;

export function nodesInComment(graph: BlueprintGraph, comment: Box, registry: Registry): string[] {
  return graph.nodes.filter((n) => boxContains(comment, nodeBox(n, registry, graph))).map((n) => n.id);
}

/** Nodes fully inside vs merely touching the comment (for UI hints). */
export function commentRelation(graph: BlueprintGraph, comment: Box, registry: Registry): { inside: string[]; partial: string[] } {
  const inside: string[] = [];
  const partial: string[] = [];
  for (const n of graph.nodes) {
    const b = nodeBox(n, registry, graph);
    if (boxContains(comment, b)) inside.push(n.id);
    else if (boxesOverlap(comment, b)) partial.push(n.id);
  }
  return { inside, partial };
}

/** Box around some nodes with padding and a title bar. */
export function boxAround(graph: BlueprintGraph, nodeIds: readonly string[], registry: Registry, padding = 24): Box | undefined {
  const picked = graph.nodes.filter((n) => nodeIds.includes(n.id));
  if (!picked.length) return undefined;
  const b = boundsOf(picked.map((n) => nodeBox(n, registry, graph)));
  return { x: b.x - padding, y: b.y - padding - COMMENT_TITLE_H, w: b.w + padding * 2, h: b.h + padding * 2 + COMMENT_TITLE_H };
}

export function addComment(
  graph: BlueprintGraph, c: Omit<BlueprintComment, "id"> & { readonly id?: string }, ids: IdGen,
): { graph: BlueprintGraph; id: string } {
  const id = c.id ?? ids("c");
  const comment: BlueprintComment = { ...c, id, w: Math.max(COMMENT_MIN.w, c.w), h: Math.max(COMMENT_MIN.h, c.h) };
  // z-order: a comment that wraps existing comments goes behind them (outer boxes stay underneath)
  const list = graph.comments ?? [];
  const first = list.findIndex((o) => boxContains(comment, o));
  const comments = first < 0 ? [...list, comment] : [...list.slice(0, first), comment, ...list.slice(first)];
  return { graph: { ...graph, comments }, id };
}

export function updateComment(graph: BlueprintGraph, id: string, patch: Partial<Omit<BlueprintComment, "id">>): BlueprintGraph {
  return {
    ...graph,
    comments: (graph.comments ?? []).map((c) => (c.id === id
      ? { ...c, ...patch, w: Math.max(COMMENT_MIN.w, patch.w ?? c.w), h: Math.max(COMMENT_MIN.h, patch.h ?? c.h) }
      : c)),
  };
}

export function removeComments(graph: BlueprintGraph, ids: readonly string[]): BlueprintGraph {
  const rest = (graph.comments ?? []).filter((c) => !ids.includes(c.id));
  const { comments: _old, ...g } = graph;
  void _old;
  return rest.length ? { ...g, comments: rest } : g;
}

/**
 * Move a comment. Nodes fully inside travel with it unless `moveWithNodes === false` on the comment
 * or `carry: false` is passed.
 */
export function moveComment(
  graph: BlueprintGraph, id: string, to: { readonly x: number; readonly y: number }, registry: Registry,
  opts: { readonly carry?: boolean } = {},
): BlueprintGraph {
  const c = graph.comments?.find((x) => x.id === id);
  if (!c) return graph;
  const dx = to.x - c.x;
  const dy = to.y - c.y;
  if (!dx && !dy) return graph;
  const carry = opts.carry ?? c.moveWithNodes ?? true;
  const carried = new Set(carry ? nodesInComment(graph, c, registry) : []);
  return {
    ...graph,
    nodes: graph.nodes.map((n) => (carried.has(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n)),
    comments: (graph.comments ?? []).map((x) => (x.id === id ? { ...x, x: to.x, y: to.y } : x)),
  };
}
