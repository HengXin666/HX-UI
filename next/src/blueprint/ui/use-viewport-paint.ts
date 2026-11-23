import { useEffect, type RefObject } from "react";
import type { BlueprintEditor, Viewport } from "./editor";

/**
 * Pan / zoom never re-render React: every viewport change writes the world transform, the grid
 * background, the `--bp-z` variable (comment titles scale with it) and the level of detail
 * (`data-lod` = full | low | box, consumed by blueprint.css) straight to the DOM.
 */
export function useViewportPaint(
  ed: BlueprintEditor, rootRef: RefObject<HTMLElement | null>, worldRef: RefObject<HTMLElement | null>,
  lod: { readonly low: number; readonly box: number },
) {
  useEffect(() => {
    const root = rootRef.current;
    const world = worldRef.current;
    if (!root || !world) return;
    const paint = (v: Viewport) => {
      world.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.z})`;
      const a = 128 * v.z, b = 16 * v.z;
      // minor grid lines disappear when they would be closer than ~7px
      root.style.backgroundSize = v.z < 0.45 ? `${a}px ${a}px, ${a}px ${a}px, 0 0, 0 0` : `${a}px ${a}px, ${a}px ${a}px, ${b}px ${b}px, ${b}px ${b}px`;
      root.style.backgroundPosition = `${v.x}px ${v.y}px`;
      root.style.setProperty("--bp-z", String(v.z));
      const next = v.z < lod.box ? "box" : v.z < lod.low ? "low" : "full";
      if (root.dataset.lod !== next) root.dataset.lod = next;
    };
    paint(ed.viewport);
    return ed.onViewport(paint);
  }, [ed, rootRef, worldRef, lod.low, lod.box]);
}
