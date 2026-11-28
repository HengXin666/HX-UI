import { nodesInComment } from "../comment";
import { boxContains } from "../size";
import type { BlueprintEditor } from "./editor";
import { edgePathFor } from "./wires";

/**
 * Moving nodes and comments. While the pointer moves only the moved elements' transforms and the
 * touched wires' `d` are rewritten; `commitDrag` turns the final offset into ONE undo step.
 */

export interface Moving { readonly x: number; readonly y: number; readonly el: HTMLElement | null }
export interface DragSet {
  /** What the pointer holds: its position snaps to the grid, everything else keeps its offset. */
  readonly primary: Moving | undefined;
  readonly nodes: ReadonlyMap<string, Moving>;
  readonly comments: ReadonlyMap<string, Moving>;
  readonly wires: readonly { readonly id: string; readonly paths: readonly SVGPathElement[] }[];
}

export const esc = (s: string) => (typeof CSS !== "undefined" ? CSS.escape(s) : s);

/** Everything that moves: the selection, plus what moved comments contain (nodes and nested comments). */
export function collectDrag(
  ed: BlueprintEditor, root: HTMLElement, nodeIds: readonly string[], commentIds: readonly string[],
  grab: { readonly node?: string; readonly comment?: string },
): DragSet {
  const g = ed.graph;
  const nodeSet = new Set(nodeIds);
  const cmSet = new Set(commentIds);
  for (const c of g.comments ?? []) {
    if (!cmSet.has(c.id) || c.moveWithNodes === false) continue;
    nodesInComment(g, c, ed.registry).forEach((id) => nodeSet.add(id));
    for (const o of g.comments ?? []) if (o.id !== c.id && boxContains(c, o)) cmSet.add(o.id);
  }
  const nodes = new Map<string, Moving>();
  const comments = new Map<string, Moving>();
  for (const n of g.nodes) if (nodeSet.has(n.id)) nodes.set(n.id, { x: n.x, y: n.y, el: root.querySelector(`[data-node="${esc(n.id)}"]`) });
  for (const c of g.comments ?? []) if (cmSet.has(c.id)) comments.set(c.id, { x: c.x, y: c.y, el: root.querySelector(`[data-comment="${esc(c.id)}"]`) });
  const wires = g.edges.filter((e) => nodeSet.has(e.from.node) || nodeSet.has(e.to.node))
    .map((e) => ({ id: e.id, paths: [...root.querySelectorAll<SVGPathElement>(`[data-edge="${esc(e.id)}"] path`)] }));
  const primary = grab.node !== undefined ? nodes.get(grab.node) : grab.comment !== undefined ? comments.get(grab.comment) : undefined;
  return { primary, nodes, comments, wires };
}

/** Snapped offset for a raw graph-unit offset. */
export function dragDelta(ed: BlueprintEditor, d: DragSet, rx: number, ry: number): { dx: number; dy: number } {
  const snap = (v: number) => (ed.snap > 1 ? Math.round(v / ed.snap) * ed.snap : Math.round(v));
  const p = d.primary;
  return p ? { dx: snap(p.x + rx) - p.x, dy: snap(p.y + ry) - p.y } : { dx: Math.round(rx), dy: Math.round(ry) };
}

export function paintDrag(ed: BlueprintEditor, d: DragSet, dx: number, dy: number) {
  for (const m of [...d.nodes.values(), ...d.comments.values()]) if (m.el) m.el.style.transform = `translate(${m.x + dx}px, ${m.y + dy}px)`;
  if (!d.wires.length) return;
  const g = ed.graph;
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const edges = new Map(g.edges.map((e) => [e.id, e]));
  const off = new Map([...d.nodes.keys()].map((id) => [id, { x: dx, y: dy }]));
  for (const w of d.wires) {
    const e = edges.get(w.id);
    const geo = e && edgePathFor(g, byId, e, ed.registry, off);
    if (geo) w.paths.forEach((p) => p.setAttribute("d", geo.d));
  }
}

/** Write the move as one undo step. False when nothing was written (no offset, or read-only). */
export function commitDrag(ed: BlueprintEditor, d: DragSet, dx: number, dy: number): boolean {
  if (!dx && !dy) return false;
  return !!ed.apply([
    ...[...d.nodes].map(([id, m]) => ({ op: "moveNode" as const, id, to: [m.x + dx, m.y + dy] as const })),
    ...[...d.comments].map(([id, m]) => ({ op: "updateComment" as const, id, at: [m.x + dx, m.y + dy] as const })),
  ], { label: "移动" });
}
