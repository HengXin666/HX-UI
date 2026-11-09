"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 DepthCarousel 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type ReactNode, type WheelEvent } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import { useDrag } from "./parts/use-drag";
import * as D from "./parts/depth-spec";
import { KIT_FOCUS, KIT_OUT, kitTone, transitionOf, wrapIndex, type KitTone } from "./tokens";

export { DEPTH_DEFAULTS, depthPose, depthRank, type DepthLook, type DepthPose } from "./parts/depth-spec";

export interface DepthCard {
  readonly content: ReactNode;
  readonly label: string;
}

export interface DepthDeckProps {
  readonly cards: readonly DepthCard[];
  readonly defaultIndex?: number;
  readonly onChange?: (index: number) => void;
  readonly cardWidth?: number;
  readonly cardHeight?: number;
  readonly depth?: number;
  readonly spread?: number;
  readonly tilt?: number;
  readonly tiltDirection?: "left" | "right";
  readonly perspective?: number;
  readonly visibleCards?: number;
  /** 每往后一张降低的透明度. */
  readonly falloff?: number;
  /** 最后一张可见牌的模糊 px. */
  readonly blur?: number;
  readonly duration?: number;
  readonly autoplay?: boolean;
  readonly autoplayDelay?: number;
  readonly loop?: boolean;
  readonly showControls?: boolean;
  readonly showIndicators?: boolean;
  readonly dotTone?: KitTone;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 纵深牌堆: 当前牌在最前, 后面几张依次右移, 后退, 转向并淡出与模糊; 翻过的牌向左退场. 位置用 CSS 过渡 (规格 power3.out 700ms), 打断时从当前值续走.
 * 按钮, 指示点, 方向键, 滚轮, 横向拖拽翻页. 自动播放在悬停与聚焦时暂停. 减弱动效时直接换位.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
export function DepthDeck({
  cards,
  defaultIndex = 0,
  onChange,
  cardWidth = D.DEPTH_DEFAULTS.cardWidth,
  cardHeight = D.DEPTH_DEFAULTS.cardHeight,
  depth = D.DEPTH_DEFAULTS.depth,
  spread = D.DEPTH_DEFAULTS.spread,
  tilt = D.DEPTH_DEFAULTS.tilt,
  tiltDirection = "right",
  perspective = D.DEPTH_DEFAULTS.perspective,
  visibleCards = D.DEPTH_DEFAULTS.visibleCards,
  falloff = D.DEPTH_DEFAULTS.falloff,
  blur = D.DEPTH_DEFAULTS.blur,
  duration = D.DEPTH_DEFAULTS.duration,
  autoplay = false,
  autoplayDelay = D.DEPTH_DEFAULTS.autoplayDelay,
  loop = true,
  showControls = true,
  showIndicators = true,
  dotTone = "foreground",
  ariaLabel = "Cards",
  className,
}: DepthDeckProps): JSX.Element {
  const reduced = useReducedMotion();
  const n = cards.length;
  const [active, setActive] = useState(Math.min(Math.max(0, defaultIndex), Math.max(0, n - 1)));
  const [held, setHeld] = useState(0);
  const lastWheel = useRef(-Infinity);
  const look: D.DepthLook = { spread, depth, tilt, tiltSign: tiltDirection === "right" ? -1 : 1, visible: Math.max(1, visibleCards), falloff, blur };

  const go = (target: number): void => {
    const next = loop ? wrapIndex(target, n) : Math.min(n - 1, Math.max(0, target));
    if (next === active || n === 0) return;
    setActive(next);
    onChange?.(next);
  };
  const goRef = useRef(go);
  goRef.current = go;
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!autoplay || reduced || held > 0 || n < 2) return undefined;
    const id = window.setInterval(() => goRef.current(!loop && activeRef.current === n - 1 ? 0 : activeRef.current + 1), autoplayDelay);
    return () => window.clearInterval(id);
  }, [autoplay, autoplayDelay, held, loop, n, reduced]);

  const drag = useDrag({ onMove: () => {}, onEnd: (vx) => go(active + (vx < 0 ? 1 : -1)) });
  const onWheel = (event: WheelEvent<HTMLElement>): void => {
    const d = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!d || event.timeStamp - lastWheel.current < duration * D.DEPTH_WHEEL_GAP) return;
    lastWheel.current = event.timeStamp;
    go(active + Math.sign(d));
  };
  const onKey = (event: KeyboardEvent<HTMLElement>): void => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    go(active + step);
  };
  const motion = (ms: number): string =>
    transitionOf(
      [
        ["transform", ms, KIT_OUT],
        ["opacity", ms, KIT_OUT],
        ["filter", ms, KIT_OUT],
      ],
      reduced,
    );

  return (
    <section
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      data-slot="depth-deck"
      className={cn("flex w-full flex-col items-center gap-4", className)}
      onMouseEnter={() => setHeld((h) => h + 1)}
      onMouseLeave={() => setHeld((h) => h - 1)}
      onFocus={() => setHeld((h) => h + 1)}
      onBlur={() => setHeld((h) => h - 1)}
    >
      <div tabIndex={0} onKeyDown={onKey} onWheel={onWheel} className={cn("relative touch-pan-y select-none", KIT_FOCUS)} style={{ width: cardWidth + spread * (look.visible - 1), height: cardHeight, perspective }} {...drag.bind}>
        {cards.map((card, i) => {
          const pose = D.depthPose(D.depthRank(i, active, n, loop), look);
          return (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={card.label}
              aria-hidden={i !== active || undefined}
              data-slot="depth-deck-card"
              className="absolute left-0 top-0 overflow-hidden rounded-2xl"
              style={{
                width: cardWidth,
                height: cardHeight,
                transform: pose.transform,
                opacity: pose.opacity,
                filter: `blur(${pose.blur}px)`,
                zIndex: pose.z,
                pointerEvents: i === active ? "auto" : "none",
                transition: motion(duration),
              }}
            >
              {card.content}
            </div>
          );
        })}
      </div>
      {showControls || showIndicators ? (
        <div className="flex items-center gap-3">
          {showControls ? (
            <button type="button" aria-label="Previous card" disabled={!loop && active === 0} onClick={() => go(active - 1)} className={cn("rounded-full px-2 disabled:opacity-[0.45]", KIT_FOCUS)}>
              ‹
            </button>
          ) : null}
          {showIndicators
            ? cards.map((card, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={card.label}
                  aria-current={i === active || undefined}
                  onClick={() => go(i)}
                  className={cn("h-1.5 rounded-full", KIT_FOCUS)}
                  style={{ width: i === active ? 20 : 6, opacity: i === active ? 1 : 0.4, backgroundColor: kitTone(dotTone), transition: transitionOf([["width", duration / 2, KIT_OUT]], reduced) }}
                />
              ))
            : null}
          {showControls ? (
            <button type="button" aria-label="Next card" disabled={!loop && active === n - 1} onClick={() => go(active + 1)} className={cn("rounded-full px-2 disabled:opacity-[0.45]", KIT_FOCUS)}>
              ›
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
