import { useEffect, useRef, type RefObject } from "react";
import { boxContains, boxesOverlap, nodeBox } from "../size";
import type { MenuOrigin } from "./action-menu";
import { breakPinLinks } from "./commands";
import { collectDrag, commitDrag, dragDelta, esc, paintDrag, type DragSet } from "./drag-move";
import type { BlueprintEditor, SelectMode } from "./editor";
import { hoverTarget, linkOps, livePaths, parsePinAttr, startLink, verdictText, type LinkDrag, type LinkHover } from "./link-drag";
import type { MenuTarget } from "./menu-items";
import { useViewportPaint } from "./use-viewport-paint";

/**
 * Pointer state machine of the canvas: pan, zoom, marquee, node / comment drag, comment resize,
 * wire drag, pinch. Everything per-frame is written straight to the DOM (transforms, path `d`,
 * overlay boxes); the document changes once, on release, as one undo step.
 */

export interface CanvasUI {
  openActions(sx: number, sy: number, from?: MenuOrigin): void;
  openContext(target: MenuTarget, sx: number, sy: number): void;
  closeMenus(): void;
  rename(target: { kind: "node" | "comment"; id: string }): void;
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

export function useCanvas(ed: BlueprintEditor, refs: CanvasRefs, ui: CanvasUI, lod: { low: number; box: number }) {
  const uiRef = useRef(ui);
  uiRef.current = ui;
  const space = useRef(false);

  useViewportPaint(ed, refs.root, refs.world, lod);

  useEffect(() => {
    const root = refs.root.current;
    if (!root) return;
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

    const onWheel = (e: WheelEvent) => {
      if ((e.target as Element).closest("[data-bp-overlay]")) return;
      e.preventDefault();
      const { sx, sy } = local(e);
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      ed.zoomAt(sx, sy, Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)));
    };

    const onDbl = (e: MouseEvent) => {
      // pointer capture retargets click / dblclick to the root, so look at what is under the cursor
      const t = document.elementFromPoint(e.clientX, e.clientY) ?? (e.target as Element);
      if (!root.contains(t)) return;
      if (t.closest("[data-bp-overlay], [data-nodrag]")) return;
      const { sx, sy } = local(e);
      const edge = t.closest<HTMLElement>("[data-edge]")?.dataset.edge;
      if (edge && !ed.readOnly) {
        const p = ed.toGraph(sx, sy);
        const r = ed.apply([{ op: "addReroute", edge, at: [Math.round(p.x - 8), Math.round(p.y - 8)] }], { label: "插入转接点" });
        const id = r?.created["#0"];
        if (id) ed.select([id]);
        return;
      }
      const nodeId = t.closest<HTMLElement>("[data-node]")?.dataset.node;
      const node = nodeId ? ed.graph.nodes.find((n) => n.id === nodeId) : undefined;
      if (node?.subgraph !== undefined) return void ed.enter(node.subgraph);
      if (node && t.closest(".bp-head")) return void uiRef.current.rename({ kind: "node", id: node.id });
      const cm = t.closest("[data-part]") ? t.closest<HTMLElement>("[data-comment]")?.dataset.comment : undefined;
      if (cm) uiRef.current.rename({ kind: "comment", id: cm });
    };

    const onCtx = (e: Event) => {
      if (!(e.target as Element).closest("input, textarea, select")) e.preventDefault();
    };

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("dblclick", onDbl);
    root.addEventListener("contextmenu", onCtx);
    return () => {
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("dblclick", onDbl);
      root.removeEventListener("contextmenu", onCtx);
    };
  }, [ed, refs.root, refs.live, refs.marquee, refs.tip]);

  return { space };
}
