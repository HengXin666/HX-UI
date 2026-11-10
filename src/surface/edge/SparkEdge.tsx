"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 ElectricBorder 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../motion/frame/use-frame-loop";
import { approach } from "../../motion/spring/follow";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import { TONE_CLASS, type SurfaceTone } from "../pointer/tone";
import { roundRectLength, roundRectPoint } from "./parts/comet";
import { budgetRatio, jag, pointerEnergy, revealShown, surgeEnergy, valueNoise } from "./parts/spark";
import { SPARK_EDGE as E } from "./tokens";

export interface SparkEdgeProps {
  readonly children?: ReactNode;
  /** 电弧色调 (语义 token). */
  readonly tone?: SurfaceTone;
  readonly speed?: number;
  /** 抖动的杂乱度 0 到 1 (高频层占比). */
  readonly chaos?: number;
  /** 偏离边框的幅度倍数. */
  readonly spread?: number;
  readonly thickness?: number;
  /** 并行的电弧股数. */
  readonly strands?: number;
  readonly glow?: number;
  readonly intensity?: number;
  /** 从浪涌处向外跳的支弧数, 上限 4. */
  readonly arcs?: number;
  readonly flicker?: number;
  readonly borderRadius?: number;
  /** 电弧离开边框的外移 px. */
  readonly offset?: number;
  /** 通电; false 时渐熄. */
  readonly active?: boolean;
  /** 通电时沿周长扫开. */
  readonly intro?: boolean;
  /** 指针靠近时局部放电. */
  readonly interactive?: boolean;
  readonly cursorRadius?: number;
  readonly className?: string;
}

/**
 * 电弧描边: 几股抖动的电弧沿圆角边框流动, 浪涌光团沿边行进, 指针靠近处局部放电, 支弧从浪涌处外跳.
 * 画布外扩 64px, aria-hidden 且不接指针 (指针在外框上读); 内容照常可读可交互. 离开视口或页面隐藏时停帧.
 * 减弱动效: 静止的一帧电弧, 不扫开不闪烁.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-edge.md
 */
export function SparkEdge({
  children,
  tone = "primary",
  speed = E.speed,
  chaos = E.chaos,
  spread = E.spread,
  thickness = E.thickness,
  strands = E.strands,
  glow = E.glow,
  intensity = E.intensity,
  arcs = E.arcs,
  flicker = E.flicker,
  borderRadius = E.borderRadius,
  offset = 0,
  active = true,
  intro = true,
  interactive = true,
  cursorRadius = E.cursorRadius,
  className,
}: SparkEdgeProps): JSX.Element {
  const reduced = useReducedMotion();
  const still = reduced || prefersReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(true);
  const s = useRef({ t: 0, power: active ? (intro ? 0 : 1) : 0, reveal: intro && !still ? 0 : 1, hx: -1e4, hy: -1e4, vx: 0, vy: 0, px: -1e4, py: -1e4, ink: "", w: 0, h: 0, dpr: 1 });
  const M = E.marginPx;

  const paint = (): void => {
    const st = s.current;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx || st.w <= 0) return;
    const w = st.w + 2 * offset;
    const h = st.h + 2 * offset;
    const r = borderRadius + offset;
    const total = roundRectLength(w, h, r);
    ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
    ctx.clearRect(0, 0, st.w + 2 * M, st.h + 2 * M);
    if (st.power <= 0.001 || total <= 0) return;
    ctx.translate(M - offset, M - offset);
    ctx.strokeStyle = st.ink;
    ctx.shadowColor = st.ink;
    ctx.shadowBlur = E.glowBlurPx * glow;
    ctx.lineCap = "round";
    const time = st.t * speed;
    const head = (time * E.surgeSpeed) % total;
    const front = st.reveal * (total + E.revealSoftPx);
    const n = Math.max(8, Math.ceil(total / E.stepPx));
    for (let j = 0; j < Math.max(1, Math.round(strands)); j += 1) {
      const spark = 1 - flicker * 0.3 * (0.5 + 0.5 * valueNoise(time * 13 + j * 2.3, j + 6));
      let prev: { x: number; y: number } | null = null;
      for (let i = 0; i <= n; i += 1) {
        const along = (i / n) * total;
        const p = roundRectPoint(w, h, r, along);
        const energy = Math.min(1, surgeEnergy(along, head, total, E.pulses, E.surgeHalfPx) + (interactive ? pointerEnergy(Math.hypot(p.x - offset - st.hx, p.y - offset - st.hy), cursorRadius) : 0));
        const d = jag(along * E.jagFreq, time * (1.2 + 0.4 * j), chaos, j * 13) * E.jagAmpPx * spread * (0.4 + 0.6 * chaos) * (1 + energy);
        const q = { x: p.x + p.ty * d, y: p.y - p.tx * d };
        if (prev) {
          ctx.globalAlpha = Math.min(1, intensity * spark * st.power * revealShown(along, front, E.revealSoftPx) * (0.55 + 0.45 * energy));
          ctx.lineWidth = thickness * (1 + 1.5 * energy);
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
        prev = q;
      }
    }
    for (let k = 0; k < Math.min(E.maxArcs, Math.max(0, Math.round(arcs))); k += 1) {
      const at = (head + (k * total) / E.pulses) % total;
      if (revealShown(at, front, E.revealSoftPx) <= 0) continue;
      const p = roundRectPoint(w, h, r, at);
      ctx.globalAlpha = intensity * st.power * (0.5 + 0.5 * valueNoise(time * 9 + k * 4.1, k + 11));
      ctx.lineWidth = thickness * 0.8;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      for (let m = 1; m <= 4; m += 1) {
        const out = (m / 4) * E.arcLengthPx * (0.6 + spread);
        const side = valueNoise(time * 7 + m * 1.9 + k, k + 3) * E.arcLengthPx * 0.35;
        ctx.lineTo(p.x + p.ty * out + p.tx * side, p.y - p.tx * out + p.ty * side);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  useEffect(() => {
    const el = host.current;
    const cv = canvas.current;
    if (!el || !cv) return undefined;
    const fit = (): void => {
      const st = s.current;
      st.w = el.clientWidth;
      st.h = el.clientHeight;
      st.dpr = budgetRatio(window.devicePixelRatio || 1, st.w + 2 * M, st.h + 2 * M, E.pixelBudget);
      cv.width = Math.max(1, Math.round((st.w + 2 * M) * st.dpr));
      cv.height = Math.max(1, Math.round((st.h + 2 * M) * st.dpr));
      st.ink = probe.current ? getComputedStyle(probe.current).color : "currentColor";
      if (still) { st.power = active ? 1 : 0; st.reveal = 1; paint(); }
    };
    fit();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    ro?.observe(el);
    const io = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([e]) => setVisible(e?.isIntersecting ?? true));
    io?.observe(el);
    return () => { ro?.disconnect(); io?.disconnect(); };
    // paint 读最新 props; 只在外观参数变化时重配画布.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tone, borderRadius, offset, thickness, strands, glow, intensity, chaos, spread, active, still]);

  useFrameLoop((dtMs) => {
    const st = s.current;
    const dt = Math.min(E.maxDtS, dtMs / 1000);
    st.t += dt;
    st.power = approach(st.power, active ? 1 : 0, dt, active ? E.powerUpS : E.powerDownS);
    if (active) st.reveal = Math.min(1, st.reveal + dt / E.revealS);
    st.vx += ((st.px - st.hx) * E.hoverStiffness - st.vx * E.hoverDamping) * dt;
    st.vy += ((st.py - st.hy) * E.hoverStiffness - st.vy * E.hoverDamping) * dt;
    st.hx += st.vx * dt;
    st.hy += st.vy * dt;
    paint();
    return active || st.power > 0.001;
  }, { maxDtMs: E.maxDtS * 1000, active: !still && visible && (active || s.current.power > 0.001), pauseWhenHidden: true });

  const onMove = (e: PointerEvent): void => {
    if (!interactive || still) return;
    const rect = host.current?.getBoundingClientRect();
    if (!rect) return;
    const st = s.current;
    st.px = e.clientX - rect.left;
    st.py = e.clientY - rect.top;
    if (st.hx < -1e3) { st.hx = st.px; st.hy = st.py; }
  };
  const onLeave = (): void => {
    const st = s.current;
    st.px = -1e4;
    st.py = -1e4;
    st.hx = -1e4;
    st.hy = -1e4;
    st.vx = 0;
    st.vy = 0;
  };

  return (
    <div ref={host} data-slot="spark-edge" className={cn("relative", className)} style={{ borderRadius }} onPointerMove={onMove} onPointerLeave={onLeave} onPointerCancel={onLeave}>
      <span ref={probe} aria-hidden="true" className={cn("hidden", TONE_CLASS[tone])} />
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute" style={{ inset: -M, width: `calc(100% + ${2 * M}px)`, height: `calc(100% + ${2 * M}px)` }} />
      <div className="relative">{children}</div>
    </div>
  );
}
