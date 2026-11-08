"use client";
// 行为规格参照 docs/research/catalog/micro.md 的 SlideCommit 条目, 实现为 HX 自有.

import { ChevronRightIcon, LoaderCircleIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type JSX, type ReactNode } from "react";
import { ease } from "../../../craft/ease";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { springFromDuration, springFromStiffness } from "../../../motion/spring/fit";
import { FADE_MS, MS_PER_SECOND, PERCENT, PLAIN_EASE, PRESS_EASE_OUT, clamp, shakeFrames, transitionOf } from "../tokens";
import { useDrivenValue } from "../../../motion/drive/use-driven-value";

/** 拇指与轨道内壁的间距. */
export const SWIPE_PAD = 4;
/** 拖动越快拇指越扁, 最多扁 8%. */
export const SWIPE_SQUASH_MAX = 0.08;
/** 速度 (px/s) 除以它再除以 100 得到压扁比例. */
export const SWIPE_SQUASH_DIV = 110;
/** 到端提交时拇指放大的比例. */
export const SWIPE_SWELL = 1.03;
/** 等待态至少停留这么久, 快速返回也不闪. */
export const SWIPE_MIN_PENDING = 300;
export const SWIPE_MASS = 0.9;
/** speed 到 stiffness 的系数: 规格只给了 speed=50, 换算由本库定, 默认得到 400. */
export const SWIPE_SPEED_STIFFNESS = 8;
/** 归位锚点弹簧 0.3s, bounce 0. */
export const SWIPE_ANCHOR = springFromDuration(0.3, 0);
/** 回弹 bounce 的上限. */
export const SWIPE_RETURN_BOUNCE_MAX = 0.5;
export const SWIPE_TIMING = {
  reduceReturnMs: 200,
  shownMs: 200,
  shownDelayMs: 120,
  spinMs: 120,
  landingMs: 460,
  landingAt: 0.62,
  landingDelayMs: 100,
  shakeMs: 450,
  breatheMs: 1400,
  shakePx: 6,
} as const;
export const SWIPE_DEFAULTS = { width: 280, height: 56, radius: 28, speed: 50, returnBounce: 0.38, landingDip: 0.026, holdMs: 1500 } as const;

export type SwipeState = "idle" | "drag" | "pending" | "done" | "error";
const IDLE: SwipeState = "idle";
const PENDING: SwipeState = "pending";
const DRAG: SwipeState = "drag";
const DONE: SwipeState = "done";
const ERROR: SwipeState = "error";

export interface SwipeConfirmProps {
  readonly label?: ReactNode;
  readonly doneLabel?: ReactNode;
  readonly errorLabel?: ReactNode;
  /** 到端时调用. 返回 Promise 时进入等待态, reject 走错误. */
  readonly onConfirm?: () => unknown;
  readonly onDone?: () => void;
  readonly onError?: (error: unknown) => void;
  readonly width?: number;
  readonly height?: number;
  readonly radius?: number;
  readonly speed?: number;
  readonly returnBounce?: number;
  readonly landingDip?: number;
  readonly holdMs?: number;
  readonly disabled?: boolean;
  readonly icon?: ReactNode;
  readonly className?: string;
}

/** 提交弹簧 (临界) 与归位弹簧 (按 returnBounce 减阻尼). */
export function swipeSprings(speed: number, returnBounce: number) {
  const k = speed * SWIPE_SPEED_STIFFNESS;
  return {
    commit: springFromStiffness(k, 0, { mass: SWIPE_MASS }),
    home: springFromStiffness(k, returnBounce, { mass: SWIPE_MASS, bounceRange: [0, SWIPE_RETURN_BOUNCE_MAX] }),
  };
}

/** 拖动速度到横向压扁比例. */
export function swipeSquash(velocityPxS: number): number {
  return Math.min(SWIPE_SQUASH_MAX, Math.abs(velocityPxS) / SWIPE_SQUASH_DIV / PERCENT);
}

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 滑动确认. 拖到端点提交, 中途松手按回弹弹簧归位, 速度保留.
 * 键盘: 拇指是按钮, Enter 或 Space 直接提交, 不要求拖动.
 */
export function SwipeConfirm({
  label = "Slide to pay",
  doneLabel = "Paid",
  errorLabel = "Payment failed",
  onConfirm,
  onDone,
  onError,
  width = SWIPE_DEFAULTS.width,
  height = SWIPE_DEFAULTS.height,
  radius = SWIPE_DEFAULTS.radius,
  speed = SWIPE_DEFAULTS.speed,
  returnBounce = SWIPE_DEFAULTS.returnBounce,
  landingDip = SWIPE_DEFAULTS.landingDip,
  holdMs = SWIPE_DEFAULTS.holdMs,
  disabled = false,
  icon,
  className,
}: SwipeConfirmProps): JSX.Element {
  const reduced = useReducedMotion();
  const [state, setState] = useState<SwipeState>(IDLE);
  const [squash, setSquash] = useState(0);
  const thumb = height - SWIPE_PAD * 2;
  const travel = Math.max(0, width - thumb - SWIPE_PAD * 2);
  const springs = swipeSprings(speed, returnBounce);
  const x = useDrivenValue(0, reduced);
  const drag = useRef<{ startX: number; from: number; lastX: number; lastT: number; v: number } | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLButtonElement>(null);
  const alive = useRef(true);
  const labelId = useId();
  useEffect(() => () => {
    alive.current = false;
  }, []);

  const home = (): void => {
    if (reduced) x.tween(0, SWIPE_TIMING.reduceReturnMs, (t) => ease("out", t));
    else x.spring(0, SWIPE_ANCHOR);
  };

  const commit = async (): Promise<void> => {
    setState(PENDING);
    x.spring(travel, springs.commit);
    if (!reduced) {
      track.current?.animate?.([{ transform: "scale(1)" }, { transform: `scale(${1 - landingDip})`, offset: SWIPE_TIMING.landingAt }, { transform: "scale(1)" }], {
        duration: SWIPE_TIMING.landingMs,
        delay: SWIPE_TIMING.landingDelayMs,
        easing: PRESS_EASE_OUT,
      });
    }
    const started = performance.now();
    try {
      await onConfirm?.();
      await wait(Math.max(0, SWIPE_MIN_PENDING - (performance.now() - started)));
      if (!alive.current) return;
      setState(DONE);
      await wait(holdMs);
      if (!alive.current) return;
      onDone?.();
    } catch (error) {
      await wait(Math.max(0, SWIPE_MIN_PENDING - (performance.now() - started)));
      if (!alive.current) return;
      setState(ERROR);
      if (!reduced) track.current?.animate?.(shakeFrames(SWIPE_TIMING.shakePx), { duration: SWIPE_TIMING.shakeMs, easing: PRESS_EASE_OUT, composite: "add" });
      await wait(holdMs);
      if (!alive.current) return;
      onError?.(error);
    }
    setState(IDLE);
    home();
  };

  const busy = state !== IDLE && state !== DRAG;
  const pos = x.value;
  const progress = travel > 0 ? pos / travel : 0;
  const tone = state === DONE ? "bg-success text-primary-foreground" : state === ERROR ? "bg-danger text-primary-foreground" : "bg-muted text-muted-foreground";
  const fade = transitionOf([["opacity", SWIPE_TIMING.shownMs, PLAIN_EASE, SWIPE_TIMING.shownDelayMs], ["filter", FADE_MS, PLAIN_EASE]], reduced);
  const status = state === DONE ? doneLabel : state === ERROR ? errorLabel : label;

  return (
    <div
      ref={track}
      data-slot="swipe-confirm"
      data-state={state}
      className={cn("relative select-none overflow-hidden border border-border", tone, disabled && "opacity-50", className)}
      style={{ width, height, borderRadius: radius, transition: transitionOf([["background-color", FADE_MS, PLAIN_EASE], ["color", FADE_MS, PLAIN_EASE]], reduced) }}
    >
      <span id={labelId} aria-live="polite" className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium" style={{ opacity: state === IDLE || state === DRAG ? 1 - progress : 1, transition: fade, paddingLeft: thumb }}>
        {status}
      </span>
      <button
        ref={knob}
        type="button"
        aria-labelledby={labelId}
        disabled={disabled || busy}
        data-slot="swipe-confirm-thumb"
        className="absolute flex touch-none items-center justify-center bg-foreground text-background outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed"
        style={{
          left: SWIPE_PAD,
          top: SWIPE_PAD,
          width: thumb,
          height: thumb,
          borderRadius: radius - SWIPE_PAD,
          transform: `translateX(${pos}px) scale(${(state === PENDING ? SWIPE_SWELL : 1) * (1 - squash)}, ${state === PENDING ? SWIPE_SWELL : 1})`,
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          if (state === IDLE) void commit();
        }}
        onPointerDown={(event) => {
          if (event.button !== 0 || state !== IDLE) return;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          drag.current = { startX: event.clientX, from: x.read(), lastX: event.clientX, lastT: performance.now(), v: 0 };
          x.jump(x.read());
          setState(DRAG);
        }}
        onPointerMove={(event) => {
          const d = drag.current;
          if (!d) return;
          const now = performance.now();
          const dt = now - d.lastT;
          if (dt > 0) d.v = ((event.clientX - d.lastX) / dt) * MS_PER_SECOND;
          d.lastX = event.clientX;
          d.lastT = now;
          x.jump(clamp(d.from + event.clientX - d.startX, 0, travel));
          if (!reduced) setSquash(swipeSquash(d.v));
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          setSquash(0);
          if (!d) return;
          if (x.read() >= travel - SWIPE_PAD) {
            void commit();
            return;
          }
          setState(IDLE);
          if (reduced) home();
          else x.spring(0, springs.home, d.v);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setSquash(0);
          setState(IDLE);
          home();
        }}
      >
        {state === PENDING ? (
          <LoaderCircleIcon aria-hidden className={cn("size-5", !reduced && "animate-pulse")} style={{ animationDuration: `${SWIPE_TIMING.breatheMs}ms`, transition: transitionOf([["opacity", SWIPE_TIMING.spinMs, PLAIN_EASE]], reduced) }} />
        ) : (
          (icon ?? <ChevronRightIcon aria-hidden className="size-5" />)
        )}
      </button>
    </div>
  );
}
