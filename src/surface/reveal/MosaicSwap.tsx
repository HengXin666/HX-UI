"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 PixelTransition 条目, 实现为 HX 自有.

import { useEffect, useMemo, useRef, useState, type CSSProperties, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../motion/frame/use-frame-loop";
import { cn } from "../../primitives/utils";
import { TONE_CLASS, type SurfaceTone } from "../pointer/tone";
import { mosaicAmount, tileOrders, type MosaicAnimation, type TilePattern } from "./tile-math";
import { HALF, MAX_DT_MS, MOSAIC, MS_PER_S, PERCENT } from "./tokens";

export type MosaicShape = "square" | "circle";
export type MosaicTrigger = "hover" | "click" | "manual";

/** 进度每秒走多少: 整段是盖上加揭开两段, 各 duration 秒. 减弱动效时一步到位. */
export function mosaicRate(durationS: number, reduced: boolean): number {
  return reduced ? Number.POSITIVE_INFINITY : 1 / (2 * Math.max(MOSAIC.minDurationS, durationS));
}

/** 按 fps 把进度量化成阶梯; fps 为 0 不量化. */
export function quantize(progress: number, fps: number, durationS: number): number {
  if (fps <= 0) return progress;
  const steps = Math.max(1, Math.round(fps * 2 * durationS));
  return Math.round(progress * steps) / steps;
}

export interface MosaicSwapProps {
  readonly firstContent: ReactNode;
  readonly secondContent: ReactNode;
  /** 每边格数. */
  readonly gridSize?: number;
  /** 方块的色调. */
  readonly tone?: SurfaceTone;
  /** 盖上 (或揭开) 一段的秒数. */
  readonly animationStepDuration?: number;
  readonly pattern?: TilePattern;
  readonly randomness?: number;
  readonly pixelAnimation?: MosaicAnimation;
  readonly pixelShape?: MosaicShape;
  /** 0..1, 格间留白比例. */
  readonly gap?: number;
  /** 0 平滑, 否则按这个帧率阶梯推进. */
  readonly fps?: number;
  readonly trigger?: MosaicTrigger;
  readonly active?: boolean;
  /** 只换一次, 之后不再换回. */
  readonly once?: boolean;
  readonly onActiveChange?: (active: boolean) => void;
  readonly aspectRatio?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * 马赛克换面: 一片色块按图案逐块盖上, 过半时换内容, 再逐块揭开. 进度可正可反, 中途离开从当前进度倒回.
 * 减弱动效时直接换面, 不出色块.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-reveal.md
 */
export function MosaicSwap({
  firstContent,
  secondContent,
  gridSize = MOSAIC.gridSize,
  tone = "foreground",
  animationStepDuration = MOSAIC.stepDuration,
  pattern = "random",
  randomness = MOSAIC.randomness,
  pixelAnimation = "pop",
  pixelShape = "square",
  gap = 0,
  fps = 0,
  trigger = "hover",
  active,
  once = false,
  onActiveChange,
  aspectRatio = "100%",
  className,
  style,
}: MosaicSwapProps): JSX.Element {
  const reduced = useReducedMotion();
  const n = Math.max(1, Math.round(gridSize));
  const cells = useRef<Array<HTMLSpanElement | null>>([]);
  const state = useRef({ progress: 0, goal: 0 });
  const [own, setOwn] = useState(false);
  const [second, setSecond] = useState(false);
  const locked = useRef(false);
  const on = active ?? own;
  const orders = useMemo(() => tileOrders({ cols: n, rows: n }, pattern, randomness), [n, pattern, randomness]);

  const paint = (): void => {
    const p = quantize(state.current.progress, fps, animationStepDuration);
    for (let i = 0; i < cells.current.length; i += 1) {
      const el = cells.current[i];
      if (!el) continue;
      const k = p <= 0 || p >= 1 ? 0 : mosaicAmount(p, orders[i] ?? 0, pixelAnimation);
      el.style.opacity = String(pixelAnimation === "fade" ? k : k > 0 ? 1 : 0);
      el.style.transform = pixelAnimation === "scale" ? `scale(${k})` : "";
    }
    setSecond(p >= HALF);
  };

  const loop = useFrameLoop((dtMs) => {
    const s = state.current;
    const step = mosaicRate(animationStepDuration, reduced) * (dtMs / MS_PER_S);
    s.progress = s.goal > s.progress ? Math.min(s.goal, s.progress + step) : Math.max(s.goal, s.progress - step);
    paint();
    return s.progress !== s.goal;
  }, { maxDtMs: MAX_DT_MS });

  useEffect(() => {
    state.current.goal = on ? 1 : 0;
    if (reduced) {
      state.current.progress = state.current.goal;
      paint();
      return;
    }
    loop.wake();
  }, [on, reduced]);

  const set = (next: boolean): void => {
    if (locked.current) return;
    if (once && next) locked.current = true;
    if (active === undefined) setOwn(next);
    onActiveChange?.(next);
  };

  const size = PERCENT / n;
  return (
    <div
      data-slot="mosaic-swap"
      data-active={on || undefined}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ paddingTop: aspectRatio, ...style }}
      onPointerEnter={() => trigger === "hover" && set(true)}
      onPointerLeave={() => trigger === "hover" && set(false)}
      onClick={() => trigger === "click" && set(!on)}
    >
      <div className="absolute inset-0">{second ? secondContent : firstContent}</div>
      <div aria-hidden className={cn("pointer-events-none absolute inset-0", TONE_CLASS[tone])}>
        {Array.from({ length: n * n }, (_, i) => (
          <span
            key={i}
            ref={(el) => {
              cells.current[i] = el;
            }}
            className={cn("absolute bg-current opacity-0", pixelShape === "circle" && "rounded-full")}
            style={{ left: `${(i % n) * size}%`, top: `${Math.floor(i / n) * size}%`, width: `${size * (1 - gap)}%`, height: `${size * (1 - gap)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
