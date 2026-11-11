"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 AnimatedList 条目, 实现为 HX 自有.

import { useEffect, useId, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cssCurve } from "../../motion/curves";
import { cn } from "../../primitives/utils";
import * as L from "./parts/list-spec";
import { KIT_FOCUS, KIT_OUT_LONG, kitTone, transitionOf, useKitMotion, type KitTone } from "../tokens";

export { LIST_DEFAULTS, edgeFades, listPose, listStep, revealDelay, type ListAnimation } from "./parts/list-spec";

export interface PopListProps {
  readonly items: readonly ReactNode[];
  readonly onItemSelect?: (index: number) => void;
  readonly renderItem?: (item: ReactNode, index: number, selected: boolean) => ReactNode;
  readonly initialSelectedIndex?: number;
  readonly selectOnHover?: boolean;
  readonly enableArrowNavigation?: boolean;
  readonly loop?: boolean;
  readonly animation?: L.ListAnimation;
  /** 只入场一次, 滚出视口不再收回. */
  readonly animateOnce?: boolean;
  /** 同批入场的错峰秒数. */
  readonly stagger?: number;
  readonly showGradients?: boolean;
  readonly fadeSize?: number;
  readonly displayScrollbar?: boolean;
  readonly frame?: boolean;
  readonly accentTone?: KitTone;
  readonly radius?: number;
  readonly gap?: number;
  readonly width?: number;
  readonly maxHeight?: number;
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly itemClassName?: string;
}

/**
 * 动画列表: 项滚进视口时按批错峰入场 (位移 620ms 回弹, 透明度 300ms, 模糊 200ms; 每项 50ms), 选中底板以弹簧跟随;
 * 悬停可选中, 方向键与 Home / End 移动, Enter 确认. 上下边缘按距离渐隐. 减弱动效时全部直接在位, 底板跳到位.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
export function PopList({
  items,
  onItemSelect,
  renderItem,
  initialSelectedIndex = -1,
  selectOnHover = true,
  enableArrowNavigation = true,
  loop = false,
  animation = "pop",
  animateOnce = false,
  stagger = L.LIST_DEFAULTS.stagger,
  showGradients = true,
  fadeSize = L.LIST_DEFAULTS.fadeSize,
  displayScrollbar = true,
  frame = true,
  accentTone = "accent",
  radius = L.LIST_DEFAULTS.radius,
  gap = L.LIST_DEFAULTS.gap,
  width = L.LIST_DEFAULTS.width,
  maxHeight = L.LIST_DEFAULTS.maxHeight,
  ariaLabel = "List",
  className,
  itemClassName,
}: PopListProps): JSX.Element {
  const reduced = useReducedMotion();
  const id = useId();
  const n = items.length;
  const scroller = useRef<HTMLDivElement>(null);
  const nodes = useRef<Array<HTMLDivElement | null>>([]);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(initialSelectedIndex);

  const motion = useKitMotion((m) => {
    const bar = scroller.current?.querySelector<HTMLElement>("[data-slot='pop-list-indicator']");
    if (!bar) return;
    bar.style.transform = `translateY(${m.get("y")}px)`;
    bar.style.height = `${m.get("h")}px`;
    bar.style.opacity = selected >= 0 ? "1" : "0";
  }, reduced);

  // 选中底板跟随
  useEffect(() => {
    const node = nodes.current[selected];
    if (!node) return motion.paint();
    const first = motion.get("h") === 0;
    if (first) {
      motion.jump("y", node.offsetTop);
      motion.jump("h", node.offsetHeight);
    } else {
      motion.spring("y", node.offsetTop, L.LIST_INDICATOR_SPRING);
      motion.spring("h", node.offsetHeight, L.LIST_INDICATOR_SPRING);
    }
    return undefined;
  }, [selected, motion]);

  // 入场: 进视口的一批按顺序错峰
  useEffect(() => {
    const all = nodes.current.slice(0, n);
    const place = (node: HTMLElement, shown: boolean, order: number): void => {
      const pose = L.listPose(reduced ? "none" : animation, shown);
      const delay = shown ? L.revealDelay(order, stagger) : 0;
      node.style.transitionDelay = delay ? `${delay}s, ${delay}s, 0s` : "";
      node.style.transform = pose.transform;
      node.style.opacity = String(pose.opacity);
      node.style.filter = pose.filter;
    };
    if (reduced || animation === "none" || typeof IntersectionObserver === "undefined") {
      all.forEach((node) => node && place(node, true, 0));
      return undefined;
    }
    all.forEach((node) => node && place(node, false, 0));
    const seen = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        let order = 0;
        entries
          .slice()
          .sort((a, b) => Number((a.target as HTMLElement).dataset.index) - Number((b.target as HTMLElement).dataset.index))
          .forEach((entry) => {
            const node = entry.target as HTMLElement;
            if (entry.isIntersecting && !seen.has(node)) {
              seen.add(node);
              place(node, true, order++);
            } else if (!entry.isIntersecting && seen.has(node) && !animateOnce) {
              seen.delete(node);
              place(node, false, 0);
            }
          });
      },
      { root: scroller.current },
    );
    all.forEach((node) => node && io.observe(node));
    return () => io.disconnect();
  }, [n, animation, animateOnce, stagger, reduced]);

  const updateEdges = (): void => {
    const el = scroller.current;
    if (!el) return;
    const [a, b] = L.edgeFades(el.scrollTop, el.scrollHeight, el.clientHeight, fadeSize);
    if (top.current) top.current.style.opacity = String(a);
    if (bottom.current) bottom.current.style.opacity = String(b);
  };
  useEffect(updateEdges);

  const choose = (i: number): void => {
    setSelected(i);
    onItemSelect?.(i);
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!enableArrowNavigation) return;
    const keys: Record<string, () => number> = {
      ArrowDown: () => L.listStep(selected, 1, n, loop),
      ArrowUp: () => L.listStep(selected, -1, n, loop),
      Home: () => (n ? 0 : -1),
      End: () => n - 1,
    };
    if (event.key === "Enter" && selected >= 0) {
      event.preventDefault();
      onItemSelect?.(selected);
      return;
    }
    const pick = keys[event.key];
    if (!pick) return;
    event.preventDefault();
    const next = pick();
    setSelected(next);
    nodes.current[next]?.scrollIntoView?.({ block: "nearest" });
  };
  const itemTransition = transitionOf(
    [
      ["transform", L.LIST_MOVE_MS, cssCurve("backOutSoft")],
      ["opacity", L.LIST_FADE_MS, KIT_OUT_LONG],
      ["filter", L.LIST_FILTER_MS, "ease"],
    ],
    reduced,
  );
  const edge = (side: "top" | "bottom"): JSX.Element => (
    <div
      ref={side === "top" ? top : bottom}
      aria-hidden
      data-slot={`pop-list-fade-${side}`}
      className={cn("pointer-events-none absolute inset-x-0 z-10", side === "top" ? "top-0" : "bottom-0")}
      style={{
        height: fadeSize,
        opacity: 0,
        background: `linear-gradient(to ${side === "top" ? "bottom" : "top"}, var(--background), transparent)`,
        transition: transitionOf([["opacity", L.LIST_EDGE_MS, "ease"]], reduced),
      }}
    />
  );

  return (
    <div data-slot="pop-list" className={cn("relative", frame && "border border-border bg-card p-1.5", className)} style={{ width, borderRadius: radius }}>
      {showGradients ? edge("top") : null}
      <div
        ref={scroller}
        role="listbox"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-activedescendant={selected >= 0 ? `${id}-${selected}` : undefined}
        onKeyDown={onKey}
        onScroll={updateEdges}
        className={cn("relative flex flex-col overflow-y-auto", !displayScrollbar && "[scrollbar-width:none]", KIT_FOCUS)}
        style={{ maxHeight, gap, borderRadius: radius }}
      >
        <div aria-hidden data-slot="pop-list-indicator" className="pointer-events-none absolute inset-x-0 top-0" style={{ background: kitTone(accentTone), borderRadius: radius - 4, opacity: 0 }} />
        {items.map((item, i) => (
          <div
            key={i}
            id={`${id}-${i}`}
            ref={(node) => {
              nodes.current[i] = node;
            }}
            role="option"
            aria-selected={i === selected}
            data-index={i}
            data-slot="pop-list-item"
            onMouseEnter={selectOnHover ? () => setSelected(i) : undefined}
            onClick={() => choose(i)}
            className={cn("relative cursor-pointer px-3.5 py-2.5", itemClassName)}
            style={{ borderRadius: radius - 4, transition: itemTransition }}
          >
            {renderItem ? renderItem(item, i, i === selected) : item}
          </div>
        ))}
      </div>
      {showGradients ? edge("bottom") : null}
    </div>
  );
}
