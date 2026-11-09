"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 MorphSlider 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格在 WebGL 着色器里用噪声位移做溶解, 波纹, 切片与漩涡转场, 外加色差 (aberration) 与暗角.
// 内核没有片元通道, 这里四种转场换成 Web Animations 上的 filter / clip-path / transform 关键帧, 无噪声位移与色差.

import { useEffect, useLayoutEffect, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cssCurve } from "../../motion/curves";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import * as M from "./parts/blend-spec";
import { KIT_FOCUS, kitTone, transitionOf, wrapIndex, type KitTone } from "./tokens";

export { BLEND_DEFAULTS, blendFrames, type BlendTransition } from "./parts/blend-spec";

export interface BlendItem {
  readonly image: string;
  readonly label: string;
  readonly title?: ReactNode;
  readonly caption?: ReactNode;
}

export interface BlendSliderProps {
  readonly items: readonly BlendItem[];
  readonly startIndex?: number;
  readonly onChange?: (index: number) => void;
  readonly transition?: M.BlendTransition;
  /** 转场 ms. */
  readonly duration?: number;
  readonly autoplay?: boolean;
  readonly autoplayDelay?: number;
  readonly loop?: boolean;
  readonly showCaptions?: boolean;
  readonly showControls?: boolean;
  readonly showIndicators?: boolean;
  readonly dotTone?: KitTone;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 变形幻灯: 新一幅叠在旧一幅上按所选转场 (熔化, 波纹, 横切, 漩涡) 进场, 1.1s power2.inOut; 标题以 0.66 倍时长 outExpo 升起.
 * 中途再翻页时旧转场直接落定再起新转场. 按钮, 指示点, 方向键, 横扫翻页; 自动播放在悬停聚焦时暂停.
 * 减弱动效时转场只淡入且不超过 0.4s (规格同).
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
export function BlendSlider({
  items,
  startIndex = 0,
  onChange,
  transition = "melt",
  duration = M.BLEND_DEFAULTS.duration,
  autoplay = false,
  autoplayDelay = M.BLEND_DEFAULTS.autoplayDelay,
  loop = true,
  showCaptions = true,
  showControls = true,
  showIndicators = true,
  dotTone = "foreground",
  ariaLabel = "Slides",
  className,
}: BlendSliderProps): JSX.Element {
  const reduced = useReducedMotion();
  const n = items.length;
  const [view, setView] = useState({ index: startIndex, prev: -1, dir: 1 as 1 | -1 });
  const [held, setHeld] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const running = useRef<Animation[]>([]);

  const go = (target: number, dir: 1 | -1): void => {
    const next = loop ? wrapIndex(target, n) : Math.min(n - 1, Math.max(0, target));
    if (next === view.index || n === 0) return;
    running.current.forEach((a) => a.finish());
    setView({ index: next, prev: view.index, dir });
    onChange?.(next);
  };
  const goRef = useRef(go);
  goRef.current = go;

  useLayoutEffect(() => {
    if (view.prev < 0) return;
    const calm = reduced || prefersReducedMotion();
    const ms = calm ? Math.min(duration, M.BLEND_REDUCED_MS) : duration;
    const done = (): void => setView((v) => (v.prev < 0 ? v : { ...v, prev: -1 }));
    const node = top.current;
    if (!node || typeof node.animate !== "function") {
      done();
      return;
    }
    const main = node.animate(calm ? M.BLEND_FADE : M.blendFrames(transition, view.dir), { duration: ms, easing: cssCurve("inOutCubic"), fill: "both" });
    const list = [main];
    if (caption.current && !calm) {
      list.push(
        caption.current.animate(
          [
            { opacity: 0, transform: `translateY(${M.BLEND_CAPTION_RISE_PX}px)` },
            { opacity: 1, transform: "translateY(0px)" },
          ],
          { duration: ms * M.BLEND_CAPTION_RATIO, easing: cssCurve("outExpo"), fill: "both" },
        ),
      );
    }
    running.current = list;
    main.addEventListener("finish", done);
    return () => main.removeEventListener("finish", done);
  }, [view, duration, reduced, transition]);

  useEffect(() => {
    if (!autoplay || reduced || held > 0 || n < 2) return undefined;
    const id = window.setInterval(() => goRef.current(view.index + 1, 1), autoplayDelay);
    return () => window.clearInterval(id);
  }, [autoplay, autoplayDelay, held, n, reduced, view.index]);

  const swipe = useRef(0);
  const onKey = (event: KeyboardEvent<HTMLElement>): void => {
    const step = ({ ArrowRight: 1, ArrowLeft: -1 } as const)[event.key as "ArrowRight" | "ArrowLeft"];
    if (!step) return;
    event.preventDefault();
    go(view.index + step, step);
  };
  const item = items[view.index];
  const under = view.prev >= 0 ? items[view.prev] : undefined;
  const dotMs = duration * M.BLEND_DOT_RATIO;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      data-slot="blend-slider"
      className={cn("flex w-full flex-col gap-3", className)}
      onMouseEnter={() => setHeld((h) => h + 1)}
      onMouseLeave={() => setHeld((h) => h - 1)}
      onFocus={() => setHeld((h) => h + 1)}
      onBlur={() => setHeld((h) => h - 1)}
    >
      <div
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={(event) => {
          swipe.current = event.clientX;
        }}
        onPointerUp={(event) => {
          const dx = event.clientX - swipe.current;
          if (Math.abs(dx) > M.BLEND_SWIPE_PX) go(view.index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        }}
        className={cn("relative aspect-video w-full touch-pan-y select-none overflow-hidden rounded-2xl", KIT_FOCUS)}
      >
        {under ? <img src={under.image} alt="" draggable={false} data-slot="blend-slider-under" className="absolute inset-0 size-full object-cover" /> : null}
        {item ? (
          <div ref={top} key={view.index} role="group" aria-roledescription="slide" aria-label={item.label} data-slot="blend-slider-top" className="absolute inset-0">
            <img src={item.image} alt="" draggable={false} className="size-full object-cover" />
          </div>
        ) : null}
        {showCaptions && item && (item.title || item.caption) ? (
          <div ref={caption} key={`c${view.index}`} data-slot="blend-slider-caption" className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-background/80 to-transparent p-5">
            {item.title ? <span className="text-xl font-semibold">{item.title}</span> : null}
            {item.caption ? <span className="text-sm opacity-80">{item.caption}</span> : null}
          </div>
        ) : null}
      </div>
      {showControls || showIndicators ? (
        <div className="flex items-center justify-center gap-3">
          {showControls ? (
            <button type="button" aria-label="Previous slide" disabled={!loop && view.index === 0} onClick={() => go(view.index - 1, -1)} className={cn("rounded-full px-2 disabled:opacity-[0.45]", KIT_FOCUS)}>
              ‹
            </button>
          ) : null}
          {showIndicators
            ? items.map((it, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={it.label}
                  aria-current={i === view.index || undefined}
                  onClick={() => go(i, i > view.index ? 1 : -1)}
                  className={cn("h-1.5 rounded-full", KIT_FOCUS)}
                  style={{ width: i === view.index ? 22 : 6, opacity: i === view.index ? 1 : 0.4, backgroundColor: kitTone(dotTone), transition: transitionOf([["width", dotMs, cssCurve("outExpo")]], reduced) }}
                />
              ))
            : null}
          {showControls ? (
            <button type="button" aria-label="Next slide" disabled={!loop && view.index === n - 1} onClick={() => go(view.index + 1, 1)} className={cn("rounded-full px-2 disabled:opacity-[0.45]", KIT_FOCUS)}>
              ›
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
