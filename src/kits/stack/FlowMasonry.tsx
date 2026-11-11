"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 Masonry 条目, 实现为 HX 自有.

import { useEffect, useLayoutEffect, useRef, useState, type JSX } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cssCurve } from "../../motion/curves";
import { LinkOrButton } from "../../controls/nav/parts/link-or-button";
import { cn } from "../../primitives/utils";
import * as M from "./parts/masonry-spec";
import { KIT_FOCUS, MS_PER_S, transitionOf, useKitMotion } from "../tokens";

export { MASONRY_DEFAULTS, autoColumns, fromOffset, masonryLayout, revealEase, type MasonryCell, type MasonryFrom } from "./parts/masonry-spec";

export interface MasonryItem {
  readonly id: string;
  readonly image: string;
  readonly alt: string;
  /** 高 / 宽. */
  readonly ratio: number;
  readonly href?: string;
}

export interface FlowMasonryProps {
  readonly items: readonly MasonryItem[];
  /** 固定列数; 不给时按容器宽自动. */
  readonly columns?: number;
  readonly gap?: number;
  /** 换位弹簧周期 s, 也是每张揭开的时长. */
  readonly duration?: number;
  readonly stagger?: number;
  readonly animateFrom?: M.MasonryFrom;
  readonly blurToFocus?: boolean;
  readonly scaleOnHover?: boolean;
  readonly hoverScale?: number;
  readonly onItemClick?: (item: MasonryItem) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 瀑布流: 卡片依次放进最矮的一列, 列数随容器宽变化; 容器宽或项变化时各卡以弹簧 (omega 2pi / duration) 换位.
 * 进入视口时逐张错峰 stagger 从 animateFrom 方向飞入, 透明度与模糊按三次缓出揭开. 悬停缩放 0.25s. 减弱动效时直接在位, 无揭开与换位动画.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
export function FlowMasonry({
  items,
  columns,
  gap = M.MASONRY_DEFAULTS.gap,
  duration = M.MASONRY_DEFAULTS.duration,
  stagger = M.MASONRY_DEFAULTS.stagger,
  animateFrom = "bottom",
  blurToFocus = true,
  scaleOnHover = true,
  hoverScale = M.MASONRY_DEFAULTS.hoverScale,
  onItemClick,
  ariaLabel = "Gallery",
  className,
}: FlowMasonryProps): JSX.Element {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const nodes = useRef<Array<HTMLElement | null>>([]);
  const [width, setWidth] = useState(0);
  const [started, setStarted] = useState(false);
  const reveal = useRef<number[]>([]);
  const begun = useRef<number | null>(null);
  const cols = columns ?? M.autoColumns(width);
  const layout = M.masonryLayout(items.map((item) => item.ratio), cols, width, gap);

  const motion = useKitMotion(
    (m) => {
      nodes.current.forEach((node, i) => {
        if (!node) return;
        const eased = M.revealEase(reveal.current[i] ?? 0);
        node.style.transform = `translate3d(${m.get(`x${i}`)}px, ${m.get(`y${i}`)}px, 0)`;
        node.style.opacity = String(eased);
        node.style.filter = blurToFocus && eased < 1 ? `blur(${((1 - eased) * M.MASONRY_BLUR_PX).toFixed(2)}px)` : "";
      });
    },
    reduced,
    (dtMs, now) => {
      if (!started) return false;
      let busy = false;
      items.forEach((_, i) => {
        const p = reveal.current[i] ?? 0;
        if (p >= 1) return;
        const begin = (begun.current ?? now) + i * stagger * MS_PER_S;
        if (now < begin) {
          busy = true;
          return;
        }
        reveal.current[i] = Math.min(1, p + dtMs / (Math.max(0.05, duration) * MS_PER_S));
        busy = true;
      });
      return busy;
    },
  );
  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    setWidth(node.clientWidth);
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => setWidth(node.clientWidth));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const node = root.current;
    if (reduced || !node || typeof IntersectionObserver === "undefined") {
      setStarted(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => entry?.isIntersecting && setStarted(true));
    io.observe(node);
    return () => io.disconnect();
  }, [reduced]);

  // 落位: 首次从起点偏移飞入, 之后带速度换位
  const placed = useRef(new Set<string>());
  useEffect(() => {
    if (width <= 0) return;
    const spec = M.masonrySpring(duration);
    if (started && begun.current === null) begun.current = performance.now();
    layout.cells.forEach((cell, i) => {
      const key = items[i]?.id ?? String(i);
      if (reduced) reveal.current[i] = 1;
      if (!placed.current.has(key)) {
        if (!started && !reduced) return;
        placed.current.add(key);
        const [ox, oy] = reduced ? [0, 0] : M.fromOffset(animateFrom, i);
        motion.jump(`x${i}`, cell.x + ox);
        motion.jump(`y${i}`, cell.y + oy);
      }
      motion.spring(`x${i}`, cell.x, spec, undefined, reduced ? 0 : i * stagger * MS_PER_S);
      motion.spring(`y${i}`, cell.y, spec, undefined, reduced ? 0 : i * stagger * MS_PER_S);
    });
    motion.wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, cols, gap, items, started, reduced]);

  const hover = transitionOf(
    [
      ["transform", M.MASONRY_HOVER_MS, cssCurve("settle")],
      ["box-shadow", M.MASONRY_MOVE_MS, cssCurve("settle")],
      ["opacity", M.MASONRY_FADE_MS, "ease"],
    ],
    reduced,
  );

  return (
    <div ref={root} role="list" aria-label={ariaLabel} data-slot="flow-masonry" className={cn("relative w-full", className)} style={{ height: layout.height }}>
      {items.map((item, i) => {
        const cell = layout.cells[i];
        return (
          <div
            key={item.id}
            role="listitem"
            ref={(node) => {
              nodes.current[i] = node;
            }}
            data-slot="flow-masonry-item"
            className="absolute left-0 top-0 will-change-transform"
            style={{ width: cell?.w ?? 0, height: cell?.h ?? 0, opacity: 0 }}
          >
            <LinkOrButton
              href={item.href}
              aria-label={item.alt}
              onClick={() => onItemClick?.(item)}
              className={cn("group block h-full w-full overflow-hidden rounded-xl border-0 p-0 bg-muted shadow-md hover:shadow-xl", scaleOnHover && "hover:[transform:scale(var(--hover-scale))]", KIT_FOCUS)}
              style={{ transition: hover, ["--hover-scale" as string]: hoverScale }}
            >
              <img src={item.image} alt="" loading="lazy" draggable={false} className="block h-full w-full object-cover" />
            </LinkOrButton>
          </div>
        );
      })}
    </div>
  );
}
