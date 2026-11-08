"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 GlareHover 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { useDrivenValue } from "../../motion/drive/use-driven-value";
import { cn } from "../../primitives/utils";
import { TONE_CLASS, type SurfaceTone } from "./tone";
import { HALF, MS_PER_S, PERCENT, SHEEN, cosineEase, mix } from "./tokens";

export type SheenVariant = "streak" | "spot";
export type SheenMode = "hover" | "loop" | "manual";

/** 扫光时长: 剩余行程占比乘总时长, 下限 120ms. 中途反向只走回去的那一段. */
export function sweepMs(from: number, to: number, total: number): number {
  return Math.max(SHEEN.minSweepMs, total * Math.abs(to - from));
}

/** 光带在渐变轴上的中心 (%): 进度 0 在左外, 1 在右外. */
export function bandCenter(progress: number, size: number): number {
  return mix(-size, PERCENT + size, progress);
}

/** 光带渐变串. 颜色是 currentColor 按透明度混入透明, 由色调类给出. */
export function streakGradient(progress: number, angle: number, size: number, softness: number, opacity: number): string {
  const c = bandCenter(progress, size);
  const half = size * HALF;
  const core = half * (1 - softness);
  const ink = `color-mix(in oklab, currentColor ${opacity * PERCENT}%, transparent)`;
  return `linear-gradient(${angle + 90}deg, transparent ${c - half}%, ${ink} ${c - core}%, ${ink} ${c + core}%, transparent ${c + half}%)`;
}

export interface SheenCardProps {
  readonly children?: ReactNode;
  readonly tone?: SurfaceTone;
  readonly glareOpacity?: number;
  /** 光带角度 (deg). */
  readonly glareAngle?: number;
  /** 光带宽度, 占渐变轴的百分比. */
  readonly glareSize?: number;
  /** 0..1, 光带边缘柔和度. */
  readonly softness?: number;
  /** streak 扫一道; spot 跟着指针的一团. */
  readonly variant?: SheenVariant;
  /** 扫过时 1px 内描边一闪. */
  readonly rimGlint?: boolean;
  /** hover 悬停触发, loop 每 interval 秒一次, manual 只由 intro 触发. */
  readonly mode?: SheenMode;
  /** 扫完一整趟的 ms. */
  readonly transitionDuration?: number;
  readonly interval?: number;
  /** 只扫一次. */
  readonly playOnce?: boolean;
  /** 首次露出 40% 时扫一次. */
  readonly intro?: boolean;
  readonly className?: string;
}

/**
 * 扫光卡片: 悬停时一道光带斜扫过去, 离开时从当前位置倒扫回去 (只走剩下那段), 不会跳.
 * spot 变体是一团跟手的光. 状态机是一条可中断的补间, 减弱动效时不扫, 光带落在终点 (不可见).
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-pointer.md
 */
export function SheenCard({
  children,
  tone = "foreground",
  glareOpacity = SHEEN.glareOpacity,
  glareAngle = SHEEN.glareAngle,
  glareSize = SHEEN.glareSize,
  softness = SHEEN.softness,
  variant = "streak",
  rimGlint = true,
  mode = "hover",
  transitionDuration = SHEEN.transitionDuration,
  interval = SHEEN.interval,
  playOnce = false,
  intro = false,
  className,
}: SheenCardProps): JSX.Element {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement | null>(null);
  const played = useRef(false);
  const sweep = useDrivenValue(0, reduced, (v) => {
    if (v >= 1) played.current = true;
  });
  const presence = useDrivenValue(0, reduced);
  const [spot, setSpot] = useState({ x: HALF * PERCENT, y: HALF * PERCENT });

  const run = (to: number): void => {
    if (to === 1 && playOnce && played.current) return;
    const from = sweep.read();
    if (to === 1 && from >= 1) sweep.jump(0);
    const start = to === 1 && from >= 1 ? 0 : from;
    sweep.tween(to, sweepMs(start, to, transitionDuration), cosineEase);
  };

  const runRef = useRef(run);
  runRef.current = run;

  const enter = (): void => {
    presence.tween(1, SHEEN.presenceIn * MS_PER_S);
    if (mode === "hover" && variant === "streak") run(1);
  };
  const leave = (): void => {
    presence.tween(0, SHEEN.presenceOut * MS_PER_S);
    if (mode !== "hover" || variant !== "streak") return;
    if (sweep.read() < 1) run(0);
  };

  useEffect(() => {
    if (mode !== "loop" || reduced || interval <= 0) return undefined;
    const id = setInterval(() => runRef.current(1), interval * MS_PER_S);
    return () => clearInterval(id);
  }, [mode, reduced, interval]);

  useEffect(() => {
    const el = host.current;
    if (!intro || !el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        runRef.current(1);
      },
      { threshold: SHEEN.introThreshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [intro]);

  const move = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (variant !== "spot") return;
    const r = e.currentTarget.getBoundingClientRect();
    setSpot({ x: ((e.clientX - r.left) / Math.max(1, r.width)) * PERCENT, y: ((e.clientY - r.top) / Math.max(1, r.height)) * PERCENT });
  };

  const p = sweep.value;
  const ink = `color-mix(in oklab, currentColor ${glareOpacity * PERCENT}%, transparent)`;
  const image =
    variant === "spot"
      ? `radial-gradient(circle at ${spot.x}% ${spot.y}%, ${ink}, transparent ${glareSize + softness * glareSize}%)`
      : streakGradient(p, glareAngle, glareSize, softness, glareOpacity);
  const layerOpacity = variant === "spot" ? presence.value : p > 0 && p < 1 ? 1 : 0;
  const rim = rimGlint && variant === "streak" ? Math.sin(Math.PI * p) * SHEEN.rimGain : 0;

  return (
    <div
      ref={host}
      data-slot="sheen-card"
      className={cn("relative overflow-hidden rounded-lg border border-border bg-card", className)}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onPointerCancel={leave}
      onPointerMove={move}
      onFocus={enter}
      onBlur={leave}
    >
      {children}
      <span aria-hidden className={cn("pointer-events-none absolute inset-0", TONE_CLASS[tone])} style={{ backgroundImage: image, opacity: layerOpacity }} />
      {rim > 0 ? <span aria-hidden className={cn("pointer-events-none absolute inset-0 rounded-[inherit]", TONE_CLASS[tone])} style={{ boxShadow: "inset 0 0 0 1px currentColor", opacity: rim * glareOpacity }} /> : null}
    </div>
  );
}
