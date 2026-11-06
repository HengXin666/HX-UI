"use client";

import * as React from "react";
import { BROWSE_NUMBERS } from "../../../constants/blocks-commerce-v107";
import { MASK_FADE_DIRECTION, type MaskFadeDirection } from "../../../constants/effects";
import { RAIL_MASK } from "../../../constants/commerce";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";

export interface ScrollRail<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  /** 逻辑方向: 还能往起始侧 / 结束侧滚. */
  canPrevious: boolean;
  canNext: boolean;
  /** 两侧都有溢出时的淡出边 (物理方向, 已按 RTL 翻转); 不溢出为 undefined. */
  fade: MaskFadeDirection | undefined;
  /** 翻一页 (约 0.9 个视口宽); -1 往起始侧. */
  page: (direction: 1 | -1) => void;
}

interface Edges {
  previous: boolean;
  next: boolean;
  rtl: boolean;
}

const SAME = (a: Edges, b: Edges): boolean => a.previous === b.previous && a.next === b.next && a.rtl === b.rtl;

/**
 * 横滑轨道的滚动状态: 监听 scroll 与尺寸变化算出两端是否还能滚, 给左右按钮与边缘淡出用.
 * scrollLeft 在 RTL 下为负, 统一取绝对值; 减弱动效时翻页不做平滑滚动.
 */
export function useScrollRail<T extends HTMLElement>(): ScrollRail<T> {
  const ref = React.useRef<T>(null);
  const reduced = useReducedMotion();
  const [edges, setEdges] = React.useState<Edges>({ previous: false, next: false, rtl: false });

  const update = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === RAIL_MASK.rtlDir;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    const next: Edges = { previous: pos > BROWSE_NUMBERS.railEdge, next: pos < max - BROWSE_NUMBERS.railEdge, rtl };
    setEdges((prev) => (SAME(prev, next) ? prev : next));
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
    observer?.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [update]);

  const page = React.useCallback(
    (direction: 1 | -1) => {
      const el = ref.current;
      if (!el) return;
      const sign = edges.rtl ? -1 : 1;
      el.scrollBy({ left: direction * sign * el.clientWidth * BROWSE_NUMBERS.railPage, behavior: reduced ? "auto" : "smooth" });
    },
    [edges.rtl, reduced],
  );

  const startSide = edges.rtl ? MASK_FADE_DIRECTION.right : MASK_FADE_DIRECTION.left;
  const endSide = edges.rtl ? MASK_FADE_DIRECTION.left : MASK_FADE_DIRECTION.right;
  let fade: MaskFadeDirection | undefined;
  if (edges.previous && edges.next) fade = MASK_FADE_DIRECTION.x;
  else if (edges.previous) fade = startSide;
  else if (edges.next) fade = endSide;

  return { ref, canPrevious: edges.previous, canNext: edges.next, fade, page };
}
