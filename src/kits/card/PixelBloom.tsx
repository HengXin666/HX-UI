"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 PixelCard 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import * as X from "./parts/pixel-field";
import { KIT_FOCUS, kitTone, transitionOf, useKitMotion, type KitTone } from "./tokens";

export { PIXEL_VARIANTS, buildField, hash01, pixelSize, stepField, stepSpot, type PixelOrigin, type PixelShape, type PixelVariant } from "./parts/pixel-field";

export type PixelTrigger = "hover" | "click" | "always";

const DEFAULT_TONES: readonly KitTone[] = ["primary", "accent", "secondary"];

export interface PixelBloomProps {
  readonly children?: ReactNode;
  readonly variant?: X.PixelVariant;
  readonly tones?: readonly KitTone[];
  readonly gap?: number;
  readonly speed?: number;
  readonly pixelSize?: number;
  readonly shape?: X.PixelShape;
  readonly origin?: X.PixelOrigin;
  readonly revealDuration?: number;
  readonly spotlight?: number;
  readonly glow?: number;
  readonly glowTone?: KitTone;
  readonly opacity?: number;
  readonly fade?: number;
  readonly trigger?: PixelTrigger;
  readonly clickPulse?: boolean;
  readonly intro?: boolean;
  readonly introDelay?: number;
  readonly noFocus?: boolean;
  readonly radius?: number;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 像素卡: 卡面铺一张像素网格 (canvas2d), 悬停 / 聚焦 (或点击切换, 或常亮) 时从 origin 起按距离错峰揭开, 每格 0.26s 长出, 收起时 0.22s 退场.
 * 揭开后像素按 speed 闪烁, 指针附近按 spotlight 放大; 按下时聚光脉冲一下. 边框外发光 glow 随揭开出现.
 * intro 时挂上 (过 introDelay ms) 先揭开再收起一次. 减弱动效时像素直接全显或全隐, 不闪烁.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
export function PixelBloom({
  children,
  variant = "default",
  tones = DEFAULT_TONES,
  gap,
  speed,
  pixelSize = 2,
  shape = "square",
  origin = "center",
  revealDuration = 600,
  spotlight = 0.5,
  glow = 0.5,
  glowTone = "primary",
  opacity = 1,
  fade = 0,
  trigger = "hover",
  clickPulse = true,
  intro = true,
  introDelay = 0,
  noFocus = false,
  radius = 24,
  ariaLabel,
  className,
}: PixelBloomProps): JSX.Element {
  const still = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(trigger === "always");
  const preset = X.PIXEL_VARIANTS[variant];
  const step = gap ?? preset.gap;
  const twinkle = still ? 0 : (speed ?? preset.speed);
  const s = useRef({ field: null as X.PixelField | null, w: 0, h: 0, clock: 0, time: 0, on: false, spot: 0, spotWant: 0, sx: 0, sy: 0, colors: [] as string[] });

  const motion = useKitMotion(
    () => {
      const st = s.current;
      const ctx = canvas.current?.getContext?.("2d");
      if (!ctx || !st.field) return;
      X.drawField(ctx, st.field, { colors: st.colors, pixelSize, shape, speed: twinkle, spotlight, spotPower: st.spot, spotX: st.sx, spotY: st.sy, opacity, fade, timeS: st.time, width: st.w, height: st.h });
    },
    still,
    (dtMs) => {
      const st = s.current;
      if (!st.field) return false;
      const dt = Math.min(0.05, dtMs / 1000);
      st.clock += dt;
      st.time += dt;
      if (still) st.field.level.fill(st.on ? 1 : 0);
      const busy = still ? false : X.stepField(st.field, st.on, st.clock, dt);
      st.spot = still ? 0 : X.stepSpot(st.spot, st.spotWant, dt);
      if (st.spotWant > 1 && st.spot > 1.2) st.spotWant = 1;
      const lit = st.field.level.some((v) => v > 0);
      return busy || st.spot !== st.spotWant || (lit && twinkle > 0);
    },
  );

  useEffect(() => {
    const node = root.current;
    const cv = canvas.current;
    if (!node || !cv) return undefined;
    const layout = (): void => {
      const st = s.current;
      st.w = node.clientWidth;
      st.h = node.clientHeight;
      const dpr = Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, 2);
      cv.width = Math.round(st.w * dpr);
      cv.height = Math.round(st.h * dpr);
      cv.getContext?.("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      const css = getComputedStyle(node);
      st.colors = tones.map((t) => css.getPropertyValue(`--${t}`).trim() || "currentColor");
      const prev = st.field;
      st.field = X.buildField(st.w, st.h, step, origin, revealDuration);
      if (prev && prev.level.length === st.field.level.length) st.field.level.set(prev.level);
      motion.wake();
    };
    layout();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(layout);
    ro.observe(node);
    return () => ro.disconnect();
  }, [step, origin, revealDuration, tones, motion]);

  useEffect(() => {
    s.current.on = on;
    s.current.clock = 0;
    motion.wake();
  }, [on, motion]);

  useEffect(() => {
    if (!intro || trigger === "always" || still || prefersReducedMotion()) return undefined;
    const start = setTimeout(() => setOn(true), Math.max(0, introDelay));
    const stop = setTimeout(() => setOn(false), Math.max(0, introDelay) + revealDuration + X.PIXEL_APPEAR_S * 1000);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
    };
  }, [intro, introDelay, revealDuration, trigger, still]);

  const hover = (next: boolean): void => {
    if (trigger === "hover") setOn(next);
  };
  const glowFade = transitionOf([["box-shadow", 260, "ease"]], still);

  return (
    <div
      ref={root}
      data-slot="pixel-bloom"
      data-active={on ? "true" : "false"}
      role={trigger === "click" ? "button" : "group"}
      aria-pressed={trigger === "click" ? on : undefined}
      aria-label={ariaLabel}
      tabIndex={noFocus ? undefined : 0}
      onPointerEnter={() => hover(true)}
      onPointerLeave={() => {
        hover(false);
        s.current.spotWant = 0;
        motion.wake();
      }}
      onPointerMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        Object.assign(s.current, { sx: event.clientX - box.left, sy: event.clientY - box.top, spotWant: Math.max(s.current.spotWant, 1) });
        motion.wake();
      }}
      onPointerDown={() => {
        if (clickPulse && !still) s.current.spotWant = 2;
        if (trigger === "click") setOn((v) => !v);
        motion.wake();
      }}
      onKeyDown={(event) => {
        if (trigger !== "click" || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        setOn((v) => !v);
      }}
      onFocus={() => hover(true)}
      onBlur={() => hover(false)}
      className={cn("relative isolate grid place-items-center overflow-hidden border border-border bg-card text-card-foreground", KIT_FOCUS, className)}
      style={{ borderRadius: radius, transition: glowFade, boxShadow: on && glow > 0 ? `0 0 ${(32 * glow).toFixed(0)}px color-mix(in oklab, ${kitTone(glowTone)} ${(glow * 60).toFixed(0)}%, transparent)` : "none" }}
    >
      <canvas ref={canvas} aria-hidden data-slot="pixel-bloom-canvas" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      {children}
    </div>
  );
}
