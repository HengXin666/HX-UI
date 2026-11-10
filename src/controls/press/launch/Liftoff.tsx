"use client";
// 行为规格参照 docs/research/catalog/micro.md 的 FlyingButton 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type CSSProperties, type JSX, type MouseEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { DOUBLE, MS_PER_SECOND, PERCENT, PRESS_EASE_OUT, clamp } from "../tokens";
import { useDrivenValue } from "../../../motion/drive/use-driven-value";
import { FOCUS_RING } from "../../../craft/tokens";

/** 升降与倾斜共用的弹簧: 刚度 380, 阻尼 10, 质量 1 (规格原值, 已是引擎参数). */
export const LIFT_SPRING = { stiffness: 380, damping: 10, mass: 1 } as const;
/** 推进器舱高度 px. */
export const LIFT_POD_H = 5;
/** 推进器最多 4 个. */
export const LIFT_MAX_JETS = 4;
/** 倾斜上限, 弧度. */
export const LIFT_TILT_MAX = 0.55;
/** 点击翻转一周的时长, 秒. */
export const LIFT_FLIP_S = 0.42;
/** 火焰最长 px 与悬停微晃: 规格的晃动来自着色器噪声, 这里换成小幅往复, 数值由本库定. */
export const LIFT_FLAME_PX = 28;
export const LIFT_WOBBLE = { px: 2, ms: 700 } as const;
export const LIFT_DEFAULTS = { altitude: 170, hoverTime: 2.4, jets: 2, wobble: 1 } as const;

export type LiftTrigger = "hover" | "press";
export type LiftSize = "small" | "medium" | "large";
const HOVER: LiftTrigger = "hover";
const SIZE_CLASS: Record<LiftSize, string> = { small: "h-8 px-3 text-xs", medium: "h-10 px-4 text-sm", large: "h-12 px-5 text-base" };

export interface LiftoffProps {
  readonly children?: ReactNode;
  readonly onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly size?: LiftSize;
  readonly radius?: number;
  /** 升空高度 px. */
  readonly altitude?: number;
  /** 升空后悬停多久自动降落, 秒. */
  readonly hoverTime?: number;
  readonly jets?: number;
  readonly thrusters?: boolean;
  readonly trigger?: LiftTrigger;
  readonly wobble?: number;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/** 指针横向位置到倾斜角: 中心为 0, 边缘为 LIFT_TILT_MAX. */
export function liftTilt(pointerX: number, left: number, width: number): number {
  if (width <= 0) return 0;
  const offset = (pointerX - left - width / DOUBLE) / (width / DOUBLE);
  return clamp(offset, -1, 1) * LIFT_TILT_MAX;
}

/** 推进器在按钮宽度上的均布位置 (百分比). */
export function jetSlots(count: number): number[] {
  const n = clamp(Math.round(count), 0, LIFT_MAX_JETS);
  return Array.from({ length: n }, (_, i) => ((i + 1) / (n + 1)) * PERCENT);
}

/**
 * 起飞按钮. 悬停 (或按下) 时以弹簧升到 altitude, 悬停 hoverTime 秒后降落, 指针左右决定倾斜.
 * 减弱动效时不升空, 不倾斜, 不翻转, 只保留点击.
 */
export function Liftoff({
  children = "Take off",
  onClick,
  size = "medium",
  radius,
  altitude = LIFT_DEFAULTS.altitude,
  hoverTime = LIFT_DEFAULTS.hoverTime,
  jets = LIFT_DEFAULTS.jets,
  thrusters = true,
  trigger = HOVER,
  wobble = LIFT_DEFAULTS.wobble,
  className,
  style,
}: LiftoffProps): JSX.Element {
  const reduced = useReducedMotion();
  const y = useDrivenValue(0, reduced);
  const tilt = useDrivenValue(0, reduced);
  const [airborne, setAirborne] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const body = useRef<HTMLButtonElement>(null);
  const bob = useRef<HTMLSpanElement>(null);

  const land = (): void => {
    clearTimeout(timer.current);
    setAirborne(false);
    y.spring(0, LIFT_SPRING);
    tilt.spring(0, LIFT_SPRING);
  };

  const rise = (): void => {
    if (reduced) return;
    clearTimeout(timer.current);
    setAirborne(true);
    y.spring(-altitude, LIFT_SPRING);
    timer.current = setTimeout(land, hoverTime * MS_PER_SECOND);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!airborne || reduced || wobble <= 0) return undefined;
    const motion = bob.current?.animate?.([{ transform: "translateY(0px)" }, { transform: `translateY(${-LIFT_WOBBLE.px * wobble}px)` }], {
      duration: LIFT_WOBBLE.ms,
      direction: "alternate",
      iterations: Infinity,
      easing: "ease-in-out",
    });
    motion?.finished?.catch(() => undefined);
    return () => motion?.cancel();
  }, [airborne, reduced, wobble]);

  const lift = altitude > 0 ? clamp(-y.value / altitude, 0, 1) : 0;
  const thrust = clamp(lift + Math.max(0, -y.velocity()) / (altitude * DOUBLE || 1), 0, 1);

  return (
    <span data-slot="liftoff" className={cn("relative inline-block", className)} style={style}>
      <span className="inline-block" style={{ transform: `translateY(${y.value}px) rotate(${tilt.value}rad)` }}>
        <span ref={bob} className="relative inline-block">
          <button
            ref={body}
            type="button"
            data-airborne={airborne || undefined}
            className={cn("relative inline-flex select-none items-center justify-center rounded-lg border border-border bg-primary font-medium text-primary-foreground", FOCUS_RING, SIZE_CLASS[size])}
            style={{ borderRadius: radius }}
            onPointerEnter={trigger === HOVER ? rise : undefined}
            onPointerLeave={trigger === HOVER ? land : undefined}
            onFocus={trigger === HOVER ? rise : undefined}
            onBlur={land}
            onPointerMove={(event) => {
              if (!airborne || reduced) return;
              const rect = event.currentTarget.getBoundingClientRect();
              tilt.spring(liftTilt(event.clientX, rect.left, rect.width), LIFT_SPRING);
            }}
            onClick={(event) => {
              onClick?.(event);
              if (trigger !== HOVER) rise();
              if (!reduced) body.current?.animate?.([{ transform: "rotateX(0turn)" }, { transform: "rotateX(1turn)" }], { duration: LIFT_FLIP_S * MS_PER_SECOND, easing: PRESS_EASE_OUT });
            }}
          >
            {children}
          </button>
          {thrusters
            ? jetSlots(jets).map((at) => (
                <span key={at} aria-hidden className="pointer-events-none absolute top-full flex -translate-x-1/2 flex-col items-center" style={{ left: `${at}%` }}>
                  <span className="w-2 rounded-b-sm bg-muted-foreground" style={{ height: LIFT_POD_H }} />
                  <span className="w-1.5 origin-top rounded-b-full bg-linear-to-b from-warning to-transparent" style={{ height: LIFT_FLAME_PX, transform: `scaleY(${reduced ? 0 : thrust})` }} />
                </span>
              ))
            : null}
        </span>
      </span>
    </span>
  );
}
