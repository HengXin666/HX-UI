"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 Carousel 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cssCurve } from "../../motion/curves";
import { cn } from "../../primitives/utils";
import { useDrag } from "./parts/use-drag";
import * as C from "./parts/carousel-spec";
import { KIT_FOCUS, MS_PER_S, kitTone, transitionOf, useKitMotion, wrapIndex, type KitTone } from "./tokens";

export { CAROUSEL_SPRING, releaseTarget, slideOffset } from "./parts/carousel-spec";

export interface CarouselSlide {
  readonly content: ReactNode;
  /** 给读屏的幻灯名. */
  readonly label: string;
}

export interface SpringCarouselProps {
  readonly slides: readonly CarouselSlide[];
  readonly defaultIndex?: number;
  readonly onIndexChange?: (index: number) => void;
  readonly loop?: boolean;
  readonly autoplay?: boolean;
  readonly autoplayDelay?: number;
  readonly draggable?: boolean;
  readonly showControls?: boolean;
  readonly showIndicators?: boolean;
  readonly dotTone?: KitTone;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 弹簧轮播: 位置由一路弹簧 (150 / 24) 驱动, 拖拽直接带着走, 松手按位移或速度翻一页并把甩出速度交给弹簧.
 * 循环时每张按环上最近位置摆放. 自动播放在悬停, 聚焦, 拖拽与页面隐藏时暂停. 方向键翻页. 减弱动效时直接跳页.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
export function SpringCarousel({
  slides,
  defaultIndex = 0,
  onIndexChange,
  loop = true,
  autoplay = false,
  autoplayDelay = C.CAROUSEL_AUTOPLAY_MS,
  draggable = true,
  showControls = true,
  showIndicators = true,
  dotTone = "foreground",
  ariaLabel = "Carousel",
  className,
}: SpringCarouselProps): JSX.Element {
  const reduced = useReducedMotion();
  const n = slides.length;
  const root = useRef<HTMLDivElement>(null);
  const nodes = useRef<Array<HTMLDivElement | null>>([]);
  const [page, setPage] = useState(defaultIndex);
  const [held, setHeld] = useState(0);
  const start = useRef(page);

  const motion = useKitMotion((m) => {
    const x = m.get("x", defaultIndex);
    nodes.current.forEach((node, i) => {
      if (node) node.style.transform = `translateX(${C.slideOffset(i, x, n, loop) * 100}%)`;
    });
  }, reduced);

  const go = (target: number, velocity?: number): void => {
    const next = loop ? target : Math.min(n - 1, Math.max(0, target));
    motion.spring("x", next, C.CAROUSEL_SPRING, velocity);
    const shown = wrapIndex(next, n);
    setPage(next);
    if (shown !== wrapIndex(page, n)) onIndexChange?.(shown);
  };

  const width = (): number => root.current?.offsetWidth ?? 0;
  const drag = useDrag(
    {
      onStart: () => {
        start.current = page;
        setHeld((h) => h + 1);
      },
      onMove: (dx) => {
        const w = width();
        if (w > 0) motion.jump("x", start.current - dx / w);
      },
      onEnd: (vx) => {
        setHeld((h) => h - 1);
        const w = width();
        const x = motion.get("x", start.current);
        const target = C.releaseTarget(start.current, (start.current - x) * w, vx, w);
        go(target, w > 0 ? (-vx * MS_PER_S) / w : 0);
      },
    },
    draggable && n > 1,
  );

  useEffect(() => {
    motion.jump("x", defaultIndex);
    // 只在挂上时摆位
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageRef = useRef(page);
  pageRef.current = page;
  const goRef = useRef(go);
  goRef.current = go;
  useEffect(() => {
    if (!autoplay || reduced || held > 0 || n < 2) return undefined;
    const tick = (): void => {
      if (document.visibilityState === "hidden") return;
      const at = pageRef.current;
      goRef.current(!loop && wrapIndex(at, n) === n - 1 ? 0 : at + 1);
    };
    const id = window.setInterval(tick, autoplayDelay);
    return () => window.clearInterval(id);
  }, [autoplay, autoplayDelay, held, loop, n, reduced]);

  const onKey = (event: KeyboardEvent<HTMLElement>): void => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    go(page + step);
  };
  const shown = wrapIndex(page, n);
  const pause = { onMouseEnter: () => setHeld((h) => h + 1), onMouseLeave: () => setHeld((h) => h - 1) };

  return (
    <section aria-roledescription="carousel" aria-label={ariaLabel} data-slot="spring-carousel" className={cn("flex w-full flex-col gap-3", className)} {...pause}>
      <div
        ref={root}
        tabIndex={0}
        onKeyDown={onKey}
        onFocus={() => setHeld((h) => h + 1)}
        onBlur={() => setHeld((h) => h - 1)}
        className={cn("relative aspect-video w-full touch-pan-y select-none overflow-hidden rounded-xl", KIT_FOCUS)}
        {...drag.bind}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            ref={(node) => {
              nodes.current[i] = node;
            }}
            role="group"
            aria-roledescription="slide"
            aria-label={slide.label}
            aria-hidden={i !== shown || undefined}
            data-slot="spring-carousel-slide"
            className="absolute inset-0 will-change-transform"
            style={{ transform: `translateX(${C.slideOffset(i, defaultIndex, n, loop) * 100}%)` }}
          >
            {slide.content}
          </div>
        ))}
      </div>
      {showControls || showIndicators ? (
        <div className="flex items-center justify-center gap-3">
          {showControls ? (
            <button type="button" aria-label="Previous slide" disabled={!loop && shown === 0} onClick={() => go(page - 1)} className={cn("rounded-full px-2 text-sm disabled:opacity-[0.45]", KIT_FOCUS)}>
              ‹
            </button>
          ) : null}
          {showIndicators
            ? slides.map((slide, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={slide.label}
                  aria-current={i === shown || undefined}
                  data-slot="spring-carousel-dot"
                  onClick={() => go(page + (loop ? C.slideOffset(i, page, n, true) : i - page))}
                  className={cn("h-2 rounded-full", KIT_FOCUS)}
                  style={{
                    width: i === shown ? 24 : 8,
                    opacity: i === shown ? 1 : 0.4,
                    backgroundColor: kitTone(dotTone),
                    transition: transitionOf([["width", C.CAROUSEL_DOT_MS, cssCurve("lift")], ["opacity", C.CAROUSEL_DOT_MS, cssCurve("lift")]], reduced),
                  }}
                />
              ))
            : null}
          {showControls ? (
            <button type="button" aria-label="Next slide" disabled={!loop && shown === n - 1} onClick={() => go(page + 1)} className={cn("rounded-full px-2 text-sm disabled:opacity-[0.45]", KIT_FOCUS)}>
              ›
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
