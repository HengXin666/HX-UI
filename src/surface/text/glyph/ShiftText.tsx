"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 GlitchText 条目, 实现为 HX 自有.

import { useRef, type ElementType, type JSX } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { cn } from "../../../primitives/utils";
import { hash01 } from "../kernel/curve";
import { DOUBLE, HALF, MS_PER_S, PERCENT, SR_ONLY, TEXT_FRAME } from "../kernel/tokens";
import { SHIFT_DEFAULTS, SHIFT_RATE_HZ, SHIFT_SLICES } from "./tokens";

export interface ShiftTextProps {
  readonly text: string;
  /** 换切片的快慢, 1 为每秒 24 次. */
  readonly speed?: number;
  /** 两层彩色错位副本. */
  readonly enableShadows?: boolean;
  /** 最大横向错位 (像素). */
  readonly offset?: number;
  /** 0 到 1, 乘到错位与切片高度上. */
  readonly intensity?: number;
  /** 副本的斜切 (度). */
  readonly skew?: number;
  /** 正文偶尔闪暗. */
  readonly flicker?: boolean;
  /** slices 副本按水平条错位; shadow 副本整体错位. */
  readonly mode?: "slices" | "shadow";
  /** always 一直; hover 悬停时; click 点击后一阵. */
  readonly trigger?: "always" | "hover" | "click";
  /** click 一次持续多久 (秒). */
  readonly burstDuration?: number;
  /** 两层副本的类 (语义 token). */
  readonly shadowClassNames?: readonly [string, string];
  readonly as?: ElementType;
  readonly className?: string;
}

export interface ShiftSlice {
  readonly top: number;
  readonly bottom: number;
  readonly dx: number;
}

/** 第 tick 拍第 layer 层副本的切片: 上下裁切百分比与横向错位. 同一拍永远同一形状. */
export function shiftSlice(tick: number, layer: number, mode: "slices" | "shadow", offset: number, intensity: number): ShiftSlice {
  const dx = (hash01(tick, layer + 1) - HALF) * DOUBLE * offset * intensity;
  if (mode === "shadow") return { top: 0, bottom: 0, dx };
  const band = PERCENT / SHIFT_SLICES;
  const row = Math.floor(hash01(tick + layer, SHIFT_SLICES) * SHIFT_SLICES);
  const height = band * (HALF + intensity * hash01(layer, tick));
  return { top: row * band, bottom: Math.max(0, PERCENT - row * band - height), dx };
}

/**
 * 错位字: 正文之上叠两层 token 色副本, 每拍换一组水平切片与错位. 一直, 悬停或点击一阵.
 * 每帧只写副本的 clip-path 与 transform, 不重渲染. 减弱动效时只显示正文.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-glyph.md
 */
export function ShiftText({
  text,
  speed = SHIFT_DEFAULTS.speed,
  enableShadows = true,
  offset = SHIFT_DEFAULTS.offset,
  intensity = SHIFT_DEFAULTS.intensity,
  skew = 0,
  flicker = false,
  mode = "slices",
  trigger = "always",
  burstDuration = SHIFT_DEFAULTS.burstDuration,
  shadowClassNames = ["text-danger", "text-primary"],
  as: Tag = "span",
  className,
}: ShiftTextProps): JSX.Element {
  const reduced = useReducedMotion();
  const base = useRef<HTMLSpanElement>(null);
  const copies = useRef<(HTMLSpanElement | null)[]>([]);
  const clock = useRef(0);
  const burst = useRef(0);
  const hovered = useRef(false);

  const loop = useFrameLoop((dt) => {
    clock.current += dt;
    burst.current = Math.max(0, burst.current - dt);
    const on = trigger === "always" || (trigger === "hover" && hovered.current) || burst.current > 0;
    const tick = Math.floor((clock.current / MS_PER_S) * SHIFT_RATE_HZ * speed);
    copies.current.forEach((el, layer) => {
      if (!el) return;
      const s = shiftSlice(tick, layer, mode, offset, intensity);
      el.style.opacity = on ? "1" : "0";
      el.style.clipPath = `inset(${s.top}% 0 ${s.bottom}% 0)`;
      el.style.transform = `translateX(${s.dx}px) skewX(${skew * (layer === 0 ? 1 : -1)}deg)`;
    });
    if (base.current) base.current.style.opacity = flicker && on && hash01(tick, SHIFT_SLICES) > 1 - intensity * HALF ? String(HALF) : "1";
    return on;
  }, { ...TEXT_FRAME, active: !reduced && trigger === "always" });

  if (reduced) return <Tag data-slot="shift-text" className={className}>{text}</Tag>;

  const start = (): void => {
    hovered.current = true;
    loop.wake();
  };
  return (
    <Tag
      data-slot="shift-text"
      className={cn("relative inline-block", className)}
      onPointerEnter={trigger === "hover" ? start : undefined}
      onPointerLeave={() => { hovered.current = false; }}
      onClick={trigger === "click" ? () => { burst.current = burstDuration * MS_PER_S; loop.wake(); } : undefined}
    >
      <span className={SR_ONLY}>{text}</span>
      <span ref={base} aria-hidden="true">{text}</span>
      {enableShadows
        ? shadowClassNames.map((tone, layer) => (
            <span key={layer} ref={(el) => { copies.current[layer] = el; }} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 select-none", tone)} style={{ opacity: 0 }}>
              {text}
            </span>
          ))
        : null}
    </Tag>
  );
}
