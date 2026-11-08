"use client";
// 行为规格参照 docs/research/catalog/micro.md 的 HoldButton 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { DOUBLE, FADE_MS, LINEAR_EASE, PERCENT, PLAIN_EASE, PRESS_EASE_OUT, PRESS_FEEDBACK_MS, transitionOf } from "../tokens";
import { useMotionValue } from "../use-motion-value";

/** 按下到松开短于它算轻点, 走 onTap 而不是回退. */
export const HOLD_TAP_MS = 250;
/** 指针离开按钮边缘超过它才算移出, 手指轻微滑动不打断. */
export const HOLD_HIT_PAD = 10;
/** 完成脉冲的时长. */
export const HOLD_PULSE_MS = 600;
export const HOLD_DEFAULTS = {
  holdTime: 2000,
  releaseTime: 200,
  pressScale: 0.97,
  waveAmplitude: 6,
  resetAfter: 1200,
  radius: 14,
} as const;
const WAVE_CYCLES = 3;
const WAVE_SAMPLES = 24;

export type HoldTone = "primary" | "danger" | "success";
export type HoldDirection = "right" | "left" | "up" | "down";
export type HoldSize = "sm" | "md" | "lg";

const TONE_FILL: Record<HoldTone, string> = { primary: "bg-primary", danger: "bg-danger", success: "bg-success" };
const TONE_TEXT: Record<HoldTone, string> = { primary: "text-primary", danger: "text-danger", success: "text-success" };
const FORWARD: HoldDirection = "right";
const TURN = Math.PI * DOUBLE;
const SIZE_CLASS: Record<HoldSize, string> = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-5 text-base" };
const CLIP_SIDE: Record<HoldDirection, (gap: number) => string> = {
  right: (gap) => `inset(0 ${gap}% 0 0)`,
  left: (gap) => `inset(0 0 0 ${gap}%)`,
  up: (gap) => `inset(${gap}% 0 0 0)`,
  down: (gap) => `inset(0 0 ${gap}% 0)`,
};

export interface HoldConfirmProps {
  readonly children?: ReactNode;
  readonly doneLabel?: ReactNode;
  readonly icon?: ReactNode;
  readonly doneIcon?: ReactNode;
  /** 填充色调, 只取语义 token. */
  readonly tone?: HoldTone;
  readonly size?: HoldSize;
  readonly radius?: number;
  readonly fillDirection?: HoldDirection;
  readonly holdTime?: number;
  readonly releaseTime?: number;
  readonly pressScale?: number;
  readonly wave?: boolean;
  readonly waveAmplitude?: number;
  readonly glow?: boolean;
  readonly resetAfter?: number;
  readonly disabled?: boolean;
  readonly onHold?: () => void;
  readonly onTap?: () => void;
  readonly className?: string;
}

/** 填充边缘的正弦波, 相位随进度推进, 不另开循环. */
export function wavePath(amplitude: number, phase: number): string {
  const points: string[] = [];
  for (let i = 0; i <= WAVE_SAMPLES; i += 1) {
    const y = (i / WAVE_SAMPLES) * PERCENT;
    const x = amplitude + amplitude * Math.sin((i / WAVE_SAMPLES) * TURN * WAVE_CYCLES + phase);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M0,0 L${points.join(" L")} L0,${PERCENT} Z`;
}

/**
 * 按住确认. 按住期间进度线性填满, 中途松开按已填比例回退 (可中断, 从当前进度出发);
 * 短于 HOLD_TAP_MS 的轻点走 onTap. 失焦, 页面隐藏, 指针移出 HOLD_HIT_PAD 外都算松开.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-press.md
 */
export function HoldConfirm({
  children = "Hold to delete",
  doneLabel = "Deleted",
  icon = null,
  doneIcon = null,
  tone = "danger",
  size = "md",
  radius = HOLD_DEFAULTS.radius,
  fillDirection = FORWARD,
  holdTime = HOLD_DEFAULTS.holdTime,
  releaseTime = HOLD_DEFAULTS.releaseTime,
  pressScale = HOLD_DEFAULTS.pressScale,
  wave = true,
  waveAmplitude = HOLD_DEFAULTS.waveAmplitude,
  glow = true,
  resetAfter = HOLD_DEFAULTS.resetAfter,
  disabled = false,
  onHold,
  onTap,
  className,
}: HoldConfirmProps): JSX.Element {
  const reduced = useReducedMotion();
  const [held, setHeld] = useState(false);
  const [done, setDone] = useState(false);
  const startedAt = useRef(0);
  const holding = useRef(false);
  const pulse = useRef<HTMLSpanElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const progress = useMotionValue(0, false, (value) => {
    if (value < 1 || !holding.current) return;
    holding.current = false;
    setHeld(false);
    setDone(true);
    onHold?.();
    if (glow && !reduced) pulse.current?.animate?.([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.08)" }], { duration: HOLD_PULSE_MS, easing: PRESS_EASE_OUT, fill: "forwards" });
    resetTimer.current = setTimeout(() => {
      setDone(false);
      progress.jump(0);
    }, resetAfter);
  });

  const begin = (): void => {
    if (disabled || done || holding.current) return;
    holding.current = true;
    startedAt.current = performance.now();
    setHeld(true);
    progress.tween(1, holdTime * (1 - progress.read()));
  };

  const release = (): void => {
    if (!holding.current) return;
    holding.current = false;
    setHeld(false);
    if (performance.now() - startedAt.current < HOLD_TAP_MS) onTap?.();
    const left = progress.read();
    if (reduced) progress.jump(0);
    else progress.tween(0, releaseTime * left);
  };

  useEffect(() => {
    const hidden = (): void => {
      if (document.visibilityState === "hidden") release();
    };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  });

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const outside = (event: PointerEvent<HTMLButtonElement>): boolean => {
    const rect = event.currentTarget.getBoundingClientRect();
    return (
      event.clientX < rect.left - HOLD_HIT_PAD ||
      event.clientX > rect.right + HOLD_HIT_PAD ||
      event.clientY < rect.top - HOLD_HIT_PAD ||
      event.clientY > rect.bottom + HOLD_HIT_PAD
    );
  };

  const keyHold = (event: KeyboardEvent<HTMLButtonElement>, down: boolean): void => {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (down && !event.repeat) begin();
    if (!down) release();
  };

  const p = done ? 1 : progress.value;
  const gap = (1 - p) * PERCENT;
  const forward = fillDirection === FORWARD;
  const horizontal = forward || fillDirection === "left";
  const waveWidth = waveAmplitude * DOUBLE;
  const shell: CSSProperties = {
    borderRadius: radius,
    transform: held && !reduced ? `scale(${pressScale})` : undefined,
    transition: transitionOf([["transform", PRESS_FEEDBACK_MS, PRESS_EASE_OUT], ["background-color", PRESS_FEEDBACK_MS, PLAIN_EASE]], reduced),
  };
  const label = (
    <span className="relative inline-flex items-center gap-2" style={{ transition: transitionOf([["opacity", FADE_MS, PLAIN_EASE], ["filter", FADE_MS, PLAIN_EASE]], reduced) }}>
      {done ? doneIcon : icon}
      {done ? doneLabel : children}
    </span>
  );

  return (
    <button
      type="button"
      data-slot="hold-confirm"
      data-state={done ? "done" : held ? "holding" : "idle"}
      disabled={disabled}
      aria-busy={held || undefined}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        begin();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerMove={(event) => {
        if (holding.current && outside(event)) release();
      }}
      onBlur={release}
      onKeyDown={(event) => keyHold(event, true)}
      onKeyUp={(event) => keyHold(event, false)}
      onClick={(event) => event.preventDefault()}
      className={cn(
        "relative inline-flex touch-none select-none items-center justify-center overflow-hidden border border-border bg-muted font-medium text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        SIZE_CLASS[size],
        className,
      )}
      style={shell}
    >
      {label}
      <span aria-hidden className={cn("absolute inset-0 flex items-center justify-center text-primary-foreground", TONE_FILL[tone])} style={{ clipPath: CLIP_SIDE[fillDirection](gap) }}>
        {label}
      </span>
      {wave && !reduced && horizontal && p > 0 && p < 1 ? (
        <svg aria-hidden className="pointer-events-none absolute inset-y-0 h-full" style={{ left: forward ? `${p * PERCENT}%` : `calc(${gap}% - ${waveWidth}px)`, width: waveWidth, transform: forward ? undefined : "scaleX(-1)" }} viewBox={`0 0 ${waveWidth} ${PERCENT}`} preserveAspectRatio="none">
          <path className={cn("fill-current", TONE_TEXT[tone])} d={wavePath(waveAmplitude, p * TURN * WAVE_CYCLES)} />
        </svg>
      ) : null}
      {glow ? <span ref={pulse} aria-hidden className={cn("pointer-events-none absolute inset-0 opacity-0", TONE_FILL[tone])} style={{ borderRadius: radius, transition: transitionOf([["opacity", FADE_MS, LINEAR_EASE]], reduced) }} /> : null}
      <span className="sr-only" aria-live="polite">
        {done ? doneLabel : ""}
      </span>
    </button>
  );
}
