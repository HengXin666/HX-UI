"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 ScrollExpand 条目, 实现为 HX 自有.

import { useEffect, useRef, type CSSProperties, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../motion/frame/use-frame-loop";
import { approach } from "../../motion/spring/follow";
import { cn } from "../../primitives/utils";
import { MAX_DT_MS, MS_PER_S, PERCENT, WIDEN, clamp, mix, smoothstep } from "./tokens";

/** 某一进度下媒体框与文字层的样子. 纯函数, 可正可反. */
export function widenFrame(progress: number, o: { startWidth: number; startHeight: number; startRadius: number; endRadius: number; mediaZoom: number; overlayScrim: number }): {
  width: number;
  height: number;
  radius: number;
  zoom: number;
  scrim: number;
  title: number;
  hint: number;
  content: number;
} {
  const p = clamp(progress, 0, 1);
  const e = smoothstep(0, 1, p);
  return {
    width: mix(o.startWidth, PERCENT, e),
    height: mix(o.startHeight, PERCENT, e),
    radius: mix(o.startRadius, o.endRadius, e),
    zoom: mix(o.mediaZoom, 1, e),
    scrim: o.overlayScrim * (1 - e),
    title: 1 - smoothstep(WIDEN.titleOut[0], WIDEN.titleOut[1], p),
    hint: 1 - smoothstep(WIDEN.hintGone[0], WIDEN.hintGone[1], p),
    content: smoothstep(WIDEN.contentIn[0], WIDEN.contentIn[1], p),
  };
}

/** 滚动位置换进度: 段落顶边越过视口顶边的距离除以展开所需的滚动距离. */
export function widenProgress(sectionTop: number, viewport: number, scrollDistance: number): number {
  return clamp(-sectionTop / Math.max(1, viewport * scrollDistance), 0, 1);
}

export interface ScrollWidenProps {
  readonly src: string;
  readonly mediaType?: "image" | "video";
  readonly poster?: string;
  readonly alt?: string;
  readonly title?: ReactNode;
  readonly scrollHint?: ReactNode;
  /** 起始宽 (视口宽的百分比) 与高 (视口高的百分比). */
  readonly startWidth?: number;
  readonly startHeight?: number;
  readonly startRadius?: number;
  readonly endRadius?: number;
  /** 起始时媒体内部的放大, 展开后回到 1. */
  readonly mediaZoom?: number;
  /** 展开需要滚过几屏. */
  readonly scrollDistance?: number;
  /** 展开后再停留几屏. */
  readonly holdDistance?: number;
  /** 进度跟随滚动的时间常数 (秒). */
  readonly smoothing?: number;
  readonly overlayScrim?: number;
  readonly enabled?: boolean;
  /** 展开后叠在媒体上的内容. */
  readonly children?: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * 滚动展开: 一段吸顶的长区块, 中间的媒体框随滚动从小卡片展开到满屏, 标题淡出, 后续内容进场.
 * 进度跟随滚动一阶平滑, 往回滚倒放. 减弱动效或 enabled 为 false 时直接满屏, 文字直接显示.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-reveal.md
 */
export function ScrollWiden({
  src,
  mediaType = "image",
  poster,
  alt = "",
  title,
  scrollHint,
  startWidth = WIDEN.startWidth,
  startHeight = WIDEN.startHeight,
  startRadius = WIDEN.startRadius,
  endRadius = WIDEN.endRadius,
  mediaZoom = WIDEN.mediaZoom,
  scrollDistance = WIDEN.scrollDistance,
  holdDistance = WIDEN.holdDistance,
  smoothing = WIDEN.smoothing,
  overlayScrim = WIDEN.overlayScrim,
  enabled = true,
  children,
  className,
  style,
}: ScrollWidenProps): JSX.Element {
  const reduced = useReducedMotion();
  const still = reduced || !enabled;
  const section = useRef<HTMLElement | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  const media = useRef<HTMLElement | null>(null);
  const titleEl = useRef<HTMLDivElement | null>(null);
  const hintEl = useRef<HTMLDivElement | null>(null);
  const contentEl = useRef<HTMLDivElement | null>(null);
  const scrim = useRef<HTMLDivElement | null>(null);
  const shown = useRef(0);
  const opts = { startWidth, startHeight, startRadius, endRadius, mediaZoom, overlayScrim };

  const paint = (p: number): void => {
    const f = widenFrame(p, opts);
    if (box.current) {
      box.current.style.width = `${f.width}vw`;
      box.current.style.height = `${f.height}vh`;
      box.current.style.borderRadius = `${f.radius}px`;
    }
    if (media.current) media.current.style.transform = `scale(${f.zoom})`;
    if (scrim.current) scrim.current.style.opacity = String(f.scrim);
    if (titleEl.current) {
      titleEl.current.style.opacity = String(f.title);
      titleEl.current.style.transform = `translateY(${-(1 - f.title) * WIDEN.titleLift}px)`;
    }
    if (hintEl.current) hintEl.current.style.opacity = String(f.hint);
    if (contentEl.current) {
      contentEl.current.style.opacity = String(f.content);
      contentEl.current.style.visibility = f.content > 0 ? "visible" : "hidden";
    }
  };

  const target = (): number => {
    const el = section.current;
    if (!el || typeof window === "undefined") return 0;
    return widenProgress(el.getBoundingClientRect().top, window.innerHeight, scrollDistance);
  };

  const loop = useFrameLoop((dtMs) => {
    const goal = target();
    shown.current = approach(shown.current, goal, dtMs / MS_PER_S, smoothing);
    paint(shown.current);
    return Math.abs(shown.current - goal) > 1e-4;
  }, { maxDtMs: MAX_DT_MS });

  useEffect(() => {
    if (still) {
      shown.current = 1;
      paint(1);
      return undefined;
    }
    shown.current = target();
    paint(shown.current);
    const wake = (): void => loop.wake();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    return () => {
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
    };
  }, [still, scrollDistance]);

  const total = still ? PERCENT : (1 + scrollDistance + holdDistance) * PERCENT;
  return (
    <section ref={section} data-slot="scroll-widen" className={cn("relative w-full", className)} style={{ height: `${total}vh`, ...style }}>
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        <div ref={box} className="relative overflow-hidden bg-muted" style={{ width: `${startWidth}vw`, height: `${startHeight}vh`, borderRadius: startRadius }}>
          {mediaType === "video" ? (
            <video ref={media as never} src={src} poster={poster} autoPlay={!still} muted loop playsInline className="size-full object-cover" />
          ) : (
            <img ref={media as never} src={src} alt={alt} className="size-full object-cover" />
          )}
          <div ref={scrim} aria-hidden className="pointer-events-none absolute inset-0 bg-background" style={{ opacity: overlayScrim }} />
        </div>
        {title ? (
          <div ref={titleEl} className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-heading">
            {title}
          </div>
        ) : null}
        {scrollHint ? (
          <div ref={hintEl} className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-sm text-muted-foreground">
            {scrollHint}
          </div>
        ) : null}
        {children ? (
          <div ref={contentEl} className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0, visibility: "hidden" }}>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
