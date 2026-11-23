import { copySelection, deleteSelection, duplicateSelection, pasteClip } from "../clipboard";
import { alignNodes, distributeNodes, type AlignMode } from "../layout";
import { findPin } from "../ports";
import { boundsOf, nodeBox } from "../size";
import { toText, fromText } from "../text";
import type { BlueprintGraph, PinRef } from "../types";
import type { BlueprintEditor } from "./editor";
import { pinPos } from "./geometry";

/**
 * Editing commands shared by keyboard shortcuts, context menus and the public hook.
 * Each one is a single undo step and works on the level being edited.
 */

const hasSelection = (ed: BlueprintEditor) => ed.selection.nodes.length + ed.selection.comments.length > 0;

/** Text form of the selection (UE5 "copy as text"). Undefined when nothing is selected. */
export function copyText(ed: BlueprintEditor): string | undefined {
  if (!hasSelection(ed)) return undefined;
  const s = ed.selection;
  return toText(copySelection(ed.graph, { nodes: s.nodes, comments: s.comments }, ed.registry));
}

/** Paste clipboard text at the pointer (or offset from the originals). Returns false for foreign text. */
export function pasteText(ed: BlueprintEditor, text: string): boolean {
  const parsed = fromText(text);
  if (!parsed.ok || !parsed.graph || ed.readOnly) return false;
  const clip = parsed.graph;
  const boxes = [...clip.nodes.map((n) => nodeBox(n, ed.registry, clip)), ...(clip.comments ?? [])];
  if (!boxes.length) return false;
  const b = boundsOf(boxes);
  const at = ed.pointer;
  const offset = at ? { x: Math.round(at.x - b.x), y: Math.round(at.y - b.y) } : { x: 24, y: 24 };
  let pasted: { nodes: readonly string[]; comments: readonly string[] } = { nodes: [], comments: [] };
  ed.update((g, ids) => {
    const r = pasteClip(g, clip, ids, { offset });
    pasted = r;
    return r.graph;
  }, { label: "粘贴" });
  ed.select({ nodes: pasted.nodes, comments: pasted.comments });
  return true;
}

export function duplicate(ed: BlueprintEditor) {
  if (!hasSelection(ed)) return;
  const s = ed.selection;
  let made: { nodes: readonly string[]; comments: readonly string[] } = { nodes: [], comments: [] };
  ed.update((g, ids) => {
    const r = duplicateSelection(g, { nodes: s.nodes, comments: s.comments }, ed.registry, ids);
    made = r;
    return r.graph;
  }, { label: "复制节点" });
  ed.select({ nodes: made.nodes, comments: made.comments });
}

/** Delete selected nodes, comments and wires. */
export function deleteSelected(ed: BlueprintEditor) {
  const s = ed.selection;
  if (!s.nodes.length && !s.comments.length && !s.edges.length) return;
  ed.update((g) => {
    const cut = deleteSelection(g, { nodes: s.nodes, comments: s.comments });
    return s.edges.length ? { ...cut, edges: cut.edges.filter((e) => !s.edges.includes(e.id)) } : cut;
  }, { label: "删除" });
  ed.clearSelection();
}

export function alignSelected(ed: BlueprintEditor, mode: AlignMode) {
  const ids = ed.selection.nodes;
  if (ids.length < 2) return;
  ed.update((g) => alignNodes(g, ids, mode, ed.registry), { label: "对齐" });
}

export function distributeSelected(ed: BlueprintEditor, axis: "x" | "y") {
  const ids = ed.selection.nodes;
  if (ids.length < 3) return;
  ed.update((g) => distributeNodes(g, ids, axis, ed.registry), { label: "均分" });
}

/**
 * Q: straighten connections. Each selected node moves vertically so that one of its wires to an
 * unselected node becomes horizontal (exec wires first, inputs before outputs). A selected wire
 * straightens by moving its target node.
 */
export function straighten(ed: BlueprintEditor) {
  const g = ed.graph;
  const s = ed.selection;
  const moving = new Set(s.nodes);
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const moves = new Map<string, number>();
  const dyFor = (e: (typeof g.edges)[number], mover: "from" | "to") => {
    const a = byId.get(e.from.node);
    const b = byId.get(e.to.node);
    if (!a || !b) return undefined;
    const pa = pinPos(a, "out", e.from.pin, ed.registry, g);
    const pb = pinPos(b, "in", e.to.pin, ed.registry, g);
    if (!pa || !pb) return undefined;
    return mover === "to" ? pa.y - pb.y : pb.y - pa.y;
  };
  const execFirst = (list: typeof g.edges) =>
    [...list].sort((x, y) => Number(kindOf(ed, g, y.from) === "exec") - Number(kindOf(ed, g, x.from) === "exec"));
  for (const id of s.nodes) {
    const ins = execFirst(g.edges.filter((e) => e.to.node === id && !moving.has(e.from.node)));
    const outs = execFirst(g.edges.filter((e) => e.from.node === id && !moving.has(e.to.node)));
    const dy = ins[0] ? dyFor(ins[0], "to") : outs[0] ? dyFor(outs[0], "from") : undefined;
    if (dy) moves.set(id, dy);
  }
  for (const eid of s.edges) {
    const e = g.edges.find((x) => x.id === eid);
    const dy = e && dyFor(e, "to");
    if (e && dy && !moves.has(e.to.node)) moves.set(e.to.node, dy);
  }
  if (!moves.size) return;
  ed.apply([...moves].map(([id, dy]) => ({ op: "moveNode" as const, id, by: [0, Math.round(dy)] as const })), { label: "拉直连线" });
}

function kindOf(ed: BlueprintEditor, g: BlueprintGraph, ref: PinRef): "exec" | "data" {
  const t = pinType(ed, g, ref, "out");
  return t && ed.registry.isExec(t) ? "exec" : "data";
}

/** Type of a pin on the level being edited. */
export function pinType(ed: BlueprintEditor, g: BlueprintGraph, ref: PinRef, dir: "in" | "out"): string | undefined {
  const n = g.nodes.find((x) => x.id === ref.node);
  if (!n) return undefined;
  return findPin(n, ref.pin, dir, ed.registry, g)?.type;
}

/** Collapse the selected nodes into a collapsed graph (UE5 "Collapse Nodes"). */
export function collapseSelected(ed: BlueprintEditor): string | undefined {
  const ids = ed.selection.nodes;
  if (!ids.length) return undefined;
  const r = ed.apply([{ op: "collapse", nodes: ids, label: "折叠的图" }], { label: "折叠为子图" });
  const node = r && !r.errors.length ? r.created["#0"] : undefined;
  if (node) ed.select([node]);
  return node;
}

export function expandNode(ed: BlueprintEditor, id: string) {
  const before = new Set(ed.graph.nodes.map((n) => n.id));
  const r = ed.apply([{ op: "expand", node: id }], { label: "展开子图" });
  if (r && !r.errors.length) ed.select(ed.graph.nodes.filter((n) => !before.has(n.id)).map((n) => n.id));
}

/** C: wrap the selection in a comment, or drop an empty one at the pointer. Returns its id. */
export function commentSelected(ed: BlueprintEditor): string | undefined {
  const ids = ed.selection.nodes;
  const at = ed.pointer ?? ed.toGraph(80, 80);
  const r = ed.apply([ids.length
    ? { op: "addComment", around: ids, title: "注释" }
    : { op: "addComment", at: [Math.round(at.x), Math.round(at.y)], size: [320, 180], title: "注释" }], { label: "添加注释" });
  const id = r && !r.errors.length ? r.created["#0"] : undefined;
  if (id) ed.select({ comments: [id] });
  return id;
}

/** Alt+click a pin: break every wire on it. */
export function breakPinLinks(ed: BlueprintEditor, pin: PinRef) {
  const has = ed.graph.edges.some((e) => (e.from.node === pin.node && e.from.pin === pin.pin) || (e.to.node === pin.node && e.to.pin === pin.pin));
  if (has) ed.apply([{ op: "disconnect", pin }], { label: "断开连线" });
}

export function breakNodeLinks(ed: BlueprintEditor, ids: readonly string[]) {
  const edges = ed.graph.edges.filter((e) => ids.includes(e.from.node) || ids.includes(e.to.node));
  if (edges.length) ed.apply(edges.map((e) => ({ op: "disconnect" as const, edge: e.id })), { label: "断开全部连线" });
}
