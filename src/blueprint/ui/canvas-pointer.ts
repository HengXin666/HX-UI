// hx:server-safe 框架无关的指针手势状态机; document 只在事件回调里用.
import type { RefObject } from "react";
import { boxContains, boxesOverlap, nodeBox } from "../size";
import type { MenuOrigin } from "./action-menu";
import { breakPinLinks } from "./commands";
import { collectDrag, commitDrag, dragDelta, esc, paintDrag, type DragSet } from "./drag-move";
import type { BlueprintEditor, SelectMode } from "./editor";
import { hoverTarget, linkOps, livePaths, parsePinAttr, startLink, verdictText, type LinkDrag, type LinkHover } from "./link-drag";
import type { MenuTarget } from "./menu-items";
import type { RenameTarget } from "./rename-field";

/**
 * Pointer state machine of the canvas: pan, marquee, node / comment drag, comment resize, wire
 * drag, pinch. Everything per-frame is written straight to the DOM (transforms, path `d`, overlay
 * boxes); the document changes once, on release, as one undo step. `cancel()` (Esc) abandons the
 * gesture in progress and puts everything back.
 */

export interface CanvasUI {
  openActions(sx: number, sy: number, from?: MenuOrigin): void;
  openContext(target: MenuTarget, sx: number, sy: number): void;
  closeMenus(): void;
  rename(target: RenameTarget): void;
}
export interface CanvasRefs {
  readonly root: RefObject<HTMLDivElement | null>;
  readonly world: RefObject<HTMLDivElement | null>;
  readonly marquee: RefObject<HTMLDivElement | null>;
  readonly tip: RefObject<HTMLDivElement | null>;
  readonly live: RefObject<SVGSVGElement | null>;
}

type Gesture =
  | { t: "pan"; px: number; py: number; button: number; moved: boolean; target: MenuTarget | undefined }
  | { t: "marquee"; sx: number; sy: number; mode: SelectMode; moved: boolean }
  | ({ t: "drag"; sx: number; sy: number; moved: boolean; click?: string | undefined } & DragSet)
  | { t: "resize"; id: string; sx: number; sy: number; w: number; h: number; el: HTMLElement; moved: boolean }
  | { t: "link"; drag: LinkDrag; hover: LinkHover | undefined; overNode: boolean; moved: boolean; sx: number; sy: number }
  | { t: "pinch"; d: number; mx: number; my: number };

const MOVE = 3;

export interface PointerHandlers {
  readonly onDown: (e: PointerEvent) => void;
  readonly onMove: (e: PointerEvent) => void;
  readonly onUp: (e: PointerEvent) => void;
  /** Abandon the gesture in progress (Esc). True when there was one. */
  readonly cancel: () => boolean;
  readonly local: (e: { clientX: number; clientY: number }) => { sx: number; sy: number };
}

export function createPointer(
  ed: BlueprintEditor, root: HTMLElement, refs: CanvasRefs, ui: { readonly current: CanvasUI }, space: { readonly current: boolean },
): PointerHandlers {
  const uiRef = ui;
  let g: Gesture | undefined;
  const touches = new Map<number, { x: number; y: number }>();
  const local = (e: { clientX: number; clientY: number }) => {
    const r = root.getBoundingClientRect();
    return { sx: e.clientX - r.left, sy: e.clientY - r.top };
  };
  const snapV = (v: number) => (ed.snap > 1 ? Math.round(v / ed.snap) * ed.snap : Math.round(v));
  const tip = (text: string | undefined, ok: boolean | undefined, sx = 0, sy = 0) => {
    const el = refs.tip.current;
    if (!el) return;
    if (text === undefined) return void (el.style.display = "none");
    el.style.display = "block";
    el.style.transform = `translate(${sx + 16}px, ${sy + 18}px)`;
    el.dataset.ok = ok === undefined ? "" : String(ok);
    el.innerHTML = "";
    if (ok !== undefined) {
      const mark = document.createElement("span");
      mark.className = "bp-tip-mark";
      mark.textContent = ok ? "✓" : "✗";
      el.append(mark);
    }
    el.append(text);
  };
  const targetAt = (el: Element, sx: number, sy: number): MenuTarget | undefined => {
    const pinAttr = el.closest<HTMLElement>("[data-pin]")?.dataset.pin;
    const pinNode = pinAttr ? el.closest<HTMLElement>("[data-node]")?.dataset.node : undefined;
    if (pinAttr && pinNode) {
      const { dir, pin } = parsePinAttr(pinAttr);
      return { kind: "pin", node: pinNode, dir, pin };
    }
    const edge = el.closest<HTMLElement>("[data-edge]")?.dataset.edge;
    if (edge) return { kind: "edge", id: edge, at: ed.toGraph(sx, sy) };
    const node = el.closest<HTMLElement>("[data-node]")?.dataset.node;
    if (node) return { kind: "node", id: node };
    const cm = el.closest<HTMLElement>("[data-part]") && el.closest<HTMLElement>("[data-comment]")?.dataset.comment;
    return cm ? { kind: "comment", id: cm } : undefined;
  };

  const paintLink = (l: Extract<Gesture, { t: "link" }>, sx: number, sy: number) => {
    const svg = refs.live.current;
    if (!svg) return;
    const paths = livePaths(ed, l.drag, ed.toGraph(sx, sy), l.hover);
    while (svg.childNodes.length < paths.length) svg.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "path"));
    paths.forEach((p, i) => {
      const el = svg.childNodes[i] as SVGPathElement;
      el.setAttribute("class", "bp-live");
      el.setAttribute("d", p.d);
      el.style.setProperty("--bp-wire", p.color);
      if (l.hover && !l.hover.ok) el.setAttribute("data-bad", "");
      else el.removeAttribute("data-bad");
    });
    const v = verdictText(ed, l.hover, l.overNode);
    tip(v.text, v.ok, sx, sy);
  };
  const endLink = () => {
    const svg = refs.live.current;
    if (svg) svg.innerHTML = "";
    tip(undefined, undefined);
    root.querySelectorAll<SVGGElement>("[data-moving]").forEach((x) => x.removeAttribute("data-moving"));
  };

  const onDown = (e: PointerEvent) => {
    const t = e.target as Element;
    if (t.closest("[data-bp-overlay]")) return;
    uiRef.current.closeMenus();
    if (t.closest("[data-nodrag]")) return;
    root.focus({ preventScroll: true });
    const { sx, sy } = local(e);
    ed.pointer = ed.toGraph(sx, sy);
    if (e.pointerType === "touch") {
      touches.set(e.pointerId, { x: sx, y: sy });
      if (touches.size === 2) {
        const [a, b] = [...touches.values()] as [{ x: number; y: number }, { x: number; y: number }];
        g = { t: "pinch", d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
        return;
      }
    }
    try { root.setPointerCapture(e.pointerId); } catch { /* synthetic or already released pointer */ }
    const pan = e.button === 1 || e.button === 2 || (e.button === 0 && space.current);
    if (pan) {
      g = { t: "pan", px: sx, py: sy, button: e.button, moved: false, target: e.button === 2 ? targetAt(t, sx, sy) : undefined };
      return;
    }
    if (e.button !== 0) return;
    const mod = e.ctrlKey || e.metaKey;
    const pinCell = t.closest<HTMLElement>("[data-pin]");
    const nodeEl = t.closest<HTMLElement>("[data-node]");
    if (pinCell && nodeEl && !ed.readOnly) {
      const { dir, pin } = parsePinAttr(pinCell.dataset.pin!);
      const ref = { node: nodeEl.dataset.node!, pin };
      if (e.altKey) return void breakPinLinks(ed, ref);
      const drag = startLink(ed, ref, dir, mod);
      if (drag) {
        drag.removing.forEach((id) => root.querySelector(`[data-edge="${esc(id)}"]`)?.setAttribute("data-moving", ""));
        g = { t: "link", drag, hover: undefined, overNode: false, moved: false, sx, sy };
        return;
      }
    }
    const part = t.closest<HTMLElement>("[data-part]")?.dataset.part;
    const commentId = part ? t.closest<HTMLElement>("[data-comment]")?.dataset.comment : undefined;
    if (commentId && part === "size" && !ed.readOnly) {
      const c = ed.graph.comments?.find((x) => x.id === commentId);
      const el = root.querySelector<HTMLElement>(`[data-comment="${esc(commentId)}"]`);
      if (c && el) g = { t: "resize", id: c.id, sx, sy, w: c.w, h: c.h, el, moved: false };
      return;
    }
    const sel = ed.selection;
    if (commentId) {
      const was = sel.comments.includes(commentId);
      if (e.shiftKey) ed.select({ comments: [commentId] }, "add");
      else if (mod) ed.select({ comments: [commentId] }, "toggle");
      else if (!was) ed.select({ comments: [commentId] });
      const now = ed.selection;
      if (!ed.readOnly && now.comments.includes(commentId)) g = { t: "drag", sx, sy, moved: false, ...collectDrag(ed, root, now.nodes, now.comments, { comment: commentId }) };
      return;
    }
    if (nodeEl) {
      const id = nodeEl.dataset.node!;
      const was = sel.nodes.includes(id);
      if (e.shiftKey) ed.select([id], "add");
      else if (mod) ed.select([id], "toggle");
      else if (!was) ed.select([id]);
      const now = ed.selection;
      if (!ed.readOnly && now.nodes.includes(id)) g = { t: "drag", sx, sy, moved: false, click: was && !e.shiftKey && !mod ? id : undefined, ...collectDrag(ed, root, now.nodes, now.comments, { node: id }) };
      return;
    }
    const edge = t.closest<HTMLElement>("[data-edge]")?.dataset.edge;
    if (edge) return void ed.select({ edges: [edge] }, e.shiftKey ? "add" : mod ? "toggle" : "replace");
    // UE5: hold B / S / D (see placeKeys) and click empty space to drop that node there
    if (ed.placing && !ed.readOnly && ed.registry.node(ed.placing)) {
      const p = ed.toGraph(sx, sy);
      const r = ed.apply([{ op: "addNode", type: ed.placing, at: [snapV(p.x - 12), snapV(p.y - 15)] }], { label: `添加 ${ed.registry.node(ed.placing)!.title}` });
      const id = r?.created["#0"];
      if (id && !r.errors.length) ed.select([id]);
      return;
    }
    if (e.pointerType === "touch") {
      g = { t: "pan", px: sx, py: sy, button: 0, moved: false, target: undefined };
      return;
    }
    g = { t: "marquee", sx, sy, mode: e.shiftKey ? "add" : mod ? "remove" : "replace", moved: false };
  };

  const onMove = (e: PointerEvent) => {
    const { sx, sy } = local(e);
    if (!g || g.t !== "pinch") ed.pointer = ed.toGraph(sx, sy);
    if (e.pointerType === "touch" && touches.has(e.pointerId)) touches.set(e.pointerId, { x: sx, y: sy });
    if (!g) return;
    switch (g.t) {
      case "pinch": {
        if (touches.size < 2) return;
        const [a, b] = [...touches.values()] as [{ x: number; y: number }, { x: number; y: number }];
        const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        ed.panBy(mx - g.mx, my - g.my);
        if (g.d > 0) ed.zoomAt(mx, my, d / g.d);
        Object.assign(g, { d, mx, my });
        return;
      }
      case "pan": {
        if (!g.moved && Math.hypot(sx - g.px, sy - g.py) < MOVE) return;
        if (!g.moved) root.dataset.tool = "pan";
        g.moved = true;
        ed.panBy(sx - g.px, sy - g.py);
        g.px = sx;
        g.py = sy;
        return;
      }
      case "marquee": {
        if (!g.moved && Math.hypot(sx - g.sx, sy - g.sy) < MOVE) return;
        g.moved = true;
        const el = refs.marquee.current;
        if (el) Object.assign(el.style, { display: "block", transform: `translate(${Math.min(sx, g.sx)}px, ${Math.min(sy, g.sy)}px)`, width: `${Math.abs(sx - g.sx)}px`, height: `${Math.abs(sy - g.sy)}px` });
        return;
      }
      case "drag": {
        if (!g.moved && Math.hypot(sx - g.sx, sy - g.sy) < MOVE) return;
        g.moved = true;
        const { dx, dy } = dragDelta(ed, g, (sx - g.sx) / ed.viewport.z, (sy - g.sy) / ed.viewport.z);
        paintDrag(ed, g, dx, dy);
        return;
      }
      case "resize": {
        g.moved = true;
        const z = ed.viewport.z;
        g.el.style.width = `${Math.max(80, snapV(g.w + (sx - g.sx) / z))}px`;
        g.el.style.height = `${Math.max(60, snapV(g.h + (sy - g.sy) / z))}px`;
        return;
      }
      case "link": {
        if (!g.moved && Math.hypot(sx - g.sx, sy - g.sy) < MOVE) return;
        g.moved = true;
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const nodeEl = under && root.contains(under) ? under.closest<HTMLElement>("[data-node]") : null;
        const pinAttr = under?.closest<HTMLElement>("[data-pin]")?.dataset.pin;
        g.overNode = !!nodeEl;
        g.hover = nodeEl ? hoverTarget(ed, g.drag, nodeEl.dataset.node!, pinAttr) : undefined;
        paintLink(g, sx, sy);
        return;
      }
    }
  };

  const onUp = (e: PointerEvent) => {
    touches.delete(e.pointerId);
    const cur = g;
    if (cur?.t === "pinch") {
      if (touches.size < 2) g = undefined;
      return;
    }
    g = undefined;
    delete root.dataset.tool;
    if (!cur) return;
    const { sx, sy } = local(e);
    switch (cur.t) {
      case "pan":
        if (cur.button === 2 && !cur.moved) {
          const t = cur.target;
          if (!t) uiRef.current.openActions(sx, sy);
          else {
            if (t.kind === "node" && !ed.selection.nodes.includes(t.id)) ed.select([t.id]);
            if (t.kind === "comment" && !ed.selection.comments.includes(t.id)) ed.select({ comments: [t.id] });
            uiRef.current.openContext(t, sx, sy);
          }
        }
        return;
      case "marquee": {
        if (refs.marquee.current) refs.marquee.current.style.display = "none";
        if (!cur.moved) {
          if (cur.mode === "replace") ed.clearSelection();
          return;
        }
        const a = ed.toGraph(Math.min(sx, cur.sx), Math.min(sy, cur.sy));
        const b = ed.toGraph(Math.max(sx, cur.sx), Math.max(sy, cur.sy));
        const box = { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
        const gr = ed.graph;
        ed.select({
          nodes: gr.nodes.filter((n) => boxesOverlap(box, nodeBox(n, ed.registry, gr))).map((n) => n.id),
          comments: (gr.comments ?? []).filter((c) => boxContains(box, c)).map((c) => c.id),
        }, cur.mode);
        return;
      }
      case "drag": {
        if (!cur.moved) {
          if (cur.click) ed.select([cur.click]);
          return;
        }
        const { dx, dy } = dragDelta(ed, cur, (sx - cur.sx) / ed.viewport.z, (sy - cur.sy) / ed.viewport.z);
        if (!commitDrag(ed, cur, dx, dy)) paintDrag(ed, cur, 0, 0);
        return;
      }
      case "resize": {
        const w = parseFloat(cur.el.style.width), h = parseFloat(cur.el.style.height);
        if (!cur.moved || !ed.apply([{ op: "updateComment", id: cur.id, size: [w, h] }], { label: "调整注释大小" })) {
          Object.assign(cur.el.style, { width: `${cur.w}px`, height: `${cur.h}px` });
        }
        return;
      }
      case "link": {
        endLink();
        if (!cur.moved) return;
        if (cur.hover?.ok) ed.apply(linkOps(cur.drag, cur.hover.ref), { label: "连线" });
        else if (!cur.overNode && !cur.drag.removing.length && cur.drag.origins[0]) uiRef.current.openActions(sx, sy, cur.drag.origins[0]);
        return;
      }
    }
  };

  const cancel = (): boolean => {
    const cur = g;
    if (!cur || cur.t === "pinch") return false;
    g = undefined;
    delete root.dataset.tool;
    switch (cur.t) {
      case "link": endLink(); break;
      case "marquee": if (refs.marquee.current) refs.marquee.current.style.display = "none"; break;
      case "drag": paintDrag(ed, cur, 0, 0); break;
      case "resize": Object.assign(cur.el.style, { width: `${cur.w}px`, height: `${cur.h}px` }); break;
      case "pan": break;
    }
    return true;
  };

  return { onDown, onMove, onUp, cancel, local };
}
