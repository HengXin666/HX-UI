import { useEffect, useRef } from "react";
import { VAR_GET, VAR_SET } from "../registry";
import { createPointer, type CanvasRefs, type CanvasUI } from "./canvas-pointer";
import type { BlueprintEditor } from "./editor";
import { useViewportPaint } from "./use-viewport-paint";

export type { CanvasRefs, CanvasUI } from "./canvas-pointer";

/** MIME type of a variable dragged from the variables panel (payload: the variable id). */
export const VARIABLE_MIME = "application/x-hx-blueprint-variable";

/**
 * Canvas input wiring: the pointer state machine (canvas-pointer.ts), wheel zoom, double-click,
 * the browser context menu, and variables dropped from the variables panel.
 *
 * Wheel: `ed.wheel === "zoom"` always zooms at the cursor. "ctrl" (default) zooms with Ctrl / Cmd
 * (and trackpad pinch, which reports ctrlKey), or with a plain wheel once the editor has focus;
 * otherwise the page scrolls and a one-line hint says how to zoom.
 */
export function useCanvas(ed: BlueprintEditor, refs: CanvasRefs, ui: CanvasUI, lod: { low: number; box: number }) {
  const uiRef = useRef(ui);
  uiRef.current = ui;
  const space = useRef(false);
  const cancel = useRef<() => boolean>(() => false);

  useViewportPaint(ed, refs.root, refs.world, lod);

  useEffect(() => {
    const root = refs.root.current;
    if (!root) return;
    const pointer = createPointer(ed, root, refs, uiRef, space);
    const { onDown, onMove, onUp, local } = pointer;
    cancel.current = pointer.cancel;
    let hinted = 0;

    const onWheel = (e: WheelEvent) => {
      if ((e.target as Element).closest("[data-bp-overlay]")) return;
      const focused = root.contains(document.activeElement);
      if (ed.wheel === "ctrl" && !e.ctrlKey && !e.metaKey && !focused) {
        if (performance.now() - hinted > 1500) {
          hinted = performance.now();
          ed.notify(/Mac|iPhone|iPad/.test(navigator.platform) ? "按住 ⌘ 滚动来缩放，或先点一下编辑器" : "按住 Ctrl 滚动来缩放，或先点一下编辑器", 1600);
        }
        return;
      }
      e.preventDefault();
      const { sx, sy } = local(e);
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      ed.zoomAt(sx, sy, Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)));
    };

    const onDragOver = (e: DragEvent) => {
      if (ed.readOnly || !e.dataTransfer?.types.includes(VARIABLE_MIME)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    };
    const onDrop = (e: DragEvent) => {
      const id = e.dataTransfer?.getData(VARIABLE_MIME);
      if (!id || ed.readOnly) return;
      e.preventDefault();
      const { sx, sy } = local(e);
      const p = ed.toGraph(sx, sy);
      const snap = (v: number) => (ed.snap > 1 ? Math.round(v / ed.snap) * ed.snap : Math.round(v));
      // UE5: plain drop = Get, Alt-drop = Set
      const set = e.altKey;
      const r = ed.apply([{ op: "addNode", type: set ? VAR_SET : VAR_GET, variable: id, at: [snap(p.x), snap(p.y)] }], { label: set ? "添加设置变量" : "添加获取变量" });
      const nid = r?.created["#0"];
      if (nid && !r.errors.length) ed.select([nid]);
      root.focus({ preventScroll: true });
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
      if (node && t.closest(".bp-note")) return void uiRef.current.rename({ kind: "note", id: node.id });
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
    root.addEventListener("dragover", onDragOver);
    root.addEventListener("drop", onDrop);
    return () => {
      root.removeEventListener("dragover", onDragOver);
      root.removeEventListener("drop", onDrop);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("dblclick", onDbl);
      root.removeEventListener("contextmenu", onCtx);
    };
  }, [ed, refs.root, refs.live, refs.marquee, refs.tip]);

  return { space, cancel };
}
