import { copySelection, deleteSelection, duplicateSelection, pasteClip } from "../clipboard";
import { alignNodes, distributeNodes, type AlignMode } from "../layout";
import { findPin } from "../ports";
import { boundsOf, nodeBox } from "../size";
import { toText, fromText } from "../text";
import type { BlueprintGraph, PinRef, SubgraphKind } from "../types";
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

const KIND_LABEL = { graph: ["折叠的图", "折叠为子图"], function: ["新函数", "折叠为函数"], macro: ["新宏", "折叠为宏"] } as const;

/**
 * Collapse the selected nodes (UE5 "Collapse Nodes / to Function / to Macro"). A function refuses
 * a selection with more than one exec wire in or out (the error comes back as the string).
 */
export function collapseSelected(ed: BlueprintEditor, kind: SubgraphKind = "graph"): string | undefined {
  const ids = ed.selection.nodes;
  if (!ids.length) return undefined;
  const [label, step] = KIND_LABEL[kind];
  const r = ed.apply([{ op: "collapse", nodes: ids, label, kind }], { label: step });
  if (r?.errors.length && kind === "function") ed.notify("函数只能有一个执行输入和一个执行输出，可以改为折叠为宏");
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

/** Arrow keys: move the selection by one grid step (Shift: one unit). Merges into one undo step. */
export function nudge(ed: BlueprintEditor, key: string, fine: boolean) {
  const s = ed.selection;
  if (!s.nodes.length && !s.comments.length) return false;
  const step = fine || ed.snap <= 1 ? 1 : ed.snap;
  const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[key] as [number, number] | undefined;
  if (!d) return false;
  const g = ed.graph;
  ed.apply([
    ...s.nodes.map((id) => ({ op: "moveNode" as const, id, by: d })),
    ...s.comments.flatMap((id) => {
      const c = g.comments?.find((x) => x.id === id);
      return c ? [{ op: "updateComment" as const, id, at: [c.x + d[0], c.y + d[1]] as const }] : [];
    }),
  ], { tag: "nudge", label: "微移" });
  return true;
}

/**
 * Alt+Arrow: select the nearest node in that direction from the active one (keyboard navigation
 * between nodes). With nothing selected, picks the node closest to the view centre.
 */
export function moveActive(ed: BlueprintEditor, key: string) {
  const g = ed.graph;
  if (!g.nodes.length) return;
  const centre = (id: string) => {
    const n = g.nodes.find((x) => x.id === id)!;
    const b = nodeBox(n, ed.registry, g);
    return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  };
  const cur = ed.selection.nodes[ed.selection.nodes.length - 1];
  let pick: string | undefined;
  if (cur === undefined) {
    const host = ed.el;
    const c = ed.toGraph((host?.clientWidth ?? 800) / 2, (host?.clientHeight ?? 600) / 2);
    pick = [...g.nodes].sort((a, b) => dist(centre(a.id), c) - dist(centre(b.id), c))[0]?.id;
  } else {
    const o = centre(cur);
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[key] ?? [0, 0];
    let best = Infinity;
    for (const n of g.nodes) {
      if (n.id === cur) continue;
      const p = centre(n.id);
      const dx = p.x - o.x, dy = p.y - o.y;
      const along = dx * dir[0]! + dy * dir[1]!;
      if (along <= 0) continue;
      const across = Math.abs(dx * dir[1]! - dy * dir[0]!);
      const score = along + across * 2;
      if (score < best) { best = score; pick = n.id; }
    }
  }
  if (pick === undefined) return;
  ed.select([pick]);
  const p = centre(pick);
  const v = ed.viewport;
  const host = ed.el;
  const sx = p.x * v.z + v.x, sy = p.y * v.z + v.y;
  if (host && (sx < 40 || sy < 40 || sx > host.clientWidth - 40 || sy > host.clientHeight - 40)) {
    ed.setViewport({ ...v, x: host.clientWidth / 2 - p.x * v.z, y: host.clientHeight / 2 - p.y * v.z });
  }
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/** Enable / disable the selected nodes (UE5 "Enabled State"). */
export function toggleDisabled(ed: BlueprintEditor, ids: readonly string[] = ed.selection.nodes) {
  const g = ed.graph;
  const nodes = g.nodes.filter((n) => ids.includes(n.id));
  if (!nodes.length) return;
  const off = !nodes.every((n) => n.disabled);
  ed.apply(nodes.map((n) => ({ op: "updateNode" as const, id: n.id, disabled: off })), { label: off ? "禁用节点" : "启用节点" });
}
