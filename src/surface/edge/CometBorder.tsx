"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 StarBorder 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../motion/frame/use-frame-loop";
import { approach, decay } from "../../motion/spring/follow";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import { TONE_CLASS, type SurfaceTone } from "../pointer/tone";
import { emitCount, lapEase, roundRectLength, roundRectPoint, wrapPhase } from "./parts/comet";
import { COMET, type CometHover } from "./tokens";

export interface CometBorderProps {
  readonly children?: ReactNode;
  /** 彗星与火星的色调 (语义 token). */
  readonly tone?: SurfaceTone;
  /** 一圈秒数. */
  readonly duration?: number;
  /** 描边粗细 px 与圆角 px. */
  readonly thickness?: number;
  readonly radius?: number;
  /** 尾巴占周长的比例. */
  readonly trailLength?: number;
  /** 同时在跑的彗星数, 沿周长均分. */
  readonly stars?: number;
  /** 光晕强度 0 到 1. */
  readonly glow?: number;
  /** 沿途洒火星. */
  readonly sparkle?: boolean;
  readonly direction?: "clockwise" | "counterclockwise";
  /** 悬停或聚焦时: lap 加跑一圈, boost 加亮, none 不变. */
  readonly hover?: CometHover;
  /** 点击闪一下. */
  readonly clickPulse?: boolean;
  readonly className?: string;
}

interface Mote { x: number; y: number; vx: number; vy: number; life: number }

/**
 * 彗星描边: 一到多颗彗星带着渐隐的尾巴沿圆角边框循环行进, 可洒火星; 悬停加跑一圈或加亮, 点击闪光.
 * 画布向外多出 48px 给光晕, aria-hidden 且不接指针; 内容照常可读可交互. 离开视口或页面隐藏时停帧.
 * 减弱动效: 彗星停在起点, 不洒火星, 只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-edge.md
 */
export function CometBorder({
  children,
  tone = "primary",
  duration = COMET.duration,
  thickness = COMET.thickness,
  radius = COMET.radius,
  trailLength = COMET.trailLength,
  stars = COMET.stars,
  glow = COMET.glow,
  sparkle = false,
  direction = "clockwise",
  hover = "lap",
  clickPulse = true,
  className,
}: CometBorderProps): JSX.Element {
  const reduced = useReducedMotion();
  const still = reduced || prefersReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(true);
  const s = useRef({ phase: 0, velocity: 0, lap: Infinity, reveal: 0, boost: 0, flash: 0, emit: 0, motes: [] as Mote[], hot: false, ink: "", w: 0, h: 0, dpr: 1 });
  const dir = direction === "clockwise" ? 1 : -1;
  const dur = Math.max(COMET.minDurationS, duration);
  const B = COMET.bleedPx;

  const paint = (): void => {
    const st = s.current;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx || st.w <= 0) return;
    const total = roundRectLength(st.w, st.h, radius);
    ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
    ctx.clearRect(0, 0, st.w + 2 * B, st.h + 2 * B);
    ctx.translate(B, B);
    ctx.strokeStyle = st.ink;
    ctx.fillStyle = st.ink;
    ctx.shadowColor = st.ink;
    ctx.shadowBlur = COMET.glowBlurPx * glow * (1 + st.boost + st.flash);
    ctx.lineWidth = thickness * (1 + 0.5 * st.boost + st.flash);
    ctx.lineCap = "round";
    const n = Math.max(1, Math.round(stars));
    const span = trailLength * total;
    for (let k = 0; k < n; k += 1) {
      const head = st.phase + (k * total) / n;
      for (let i = 0; i < COMET.trailSegments; i += 1) {
        const a = roundRectPoint(st.w, st.h, radius, head - dir * (span * i) / COMET.trailSegments);
        const b = roundRectPoint(st.w, st.h, radius, head - dir * (span * (i + 1)) / COMET.trailSegments);
        ctx.globalAlpha = st.reveal * (1 - i / COMET.trailSegments) ** 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    for (const m of st.motes) {
      ctx.globalAlpha = st.reveal * Math.max(0, m.life / COMET.moteLifeS);
      ctx.beginPath();
      ctx.arc(m.x, m.y, COMET.moteRadius, 0, Math.PI * 2);
      ctx.fill();
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
      st.dpr = Math.min(window.devicePixelRatio || 1, 2);
      st.w = el.clientWidth;
      st.h = el.clientHeight;
      cv.width = Math.max(1, Math.round((st.w + 2 * B) * st.dpr));
      cv.height = Math.max(1, Math.round((st.h + 2 * B) * st.dpr));
      st.ink = probe.current ? getComputedStyle(probe.current).color : "currentColor";
      if (still) { st.reveal = 1; paint(); }
    };
    fit();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    ro?.observe(el);
    const io = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([e]) => setVisible(e?.isIntersecting ?? true));
    io?.observe(el);
    return () => { ro?.disconnect(); io?.disconnect(); };
    // paint 读最新 props; 只在外观参数变化时重配画布.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tone, radius, thickness, stars, trailLength, glow, still]);

  useFrameLoop((dtMs) => {
    const st = s.current;
    const dt = Math.min(COMET.maxDtS, Math.max(COMET.minDtS, dtMs / 1000));
    const total = roundRectLength(st.w, st.h, radius);
    const cruise = (dir * total) / dur;
    st.reveal = approach(st.reveal, 1, dt, st.reveal < 1 ? COMET.revealUpS : COMET.revealDownS);
    const boostTarget = hover === "boost" && st.hot ? 1 : 0;
    st.boost = approach(st.boost, boostTarget, dt, boostTarget > st.boost ? COMET.boostUpS : COMET.boostDownS);
    st.flash = decay(st.flash, dt, COMET.flashTauS);
    st.velocity = approach(st.velocity, cruise, dt, COMET.velocityTauS);
    let extra = 0;
    if (st.lap < COMET.lapS) {
      const before = lapEase(st.lap / COMET.lapS);
      st.lap += dt;
      extra = (lapEase(st.lap / COMET.lapS) - before) * total * dir;
    }
    st.phase = wrapPhase(st.phase + st.velocity * dt + extra, total);
    if (sparkle && total > 0) {
      const pace = Math.abs(st.velocity + extra / dt) / Math.max(1, Math.abs(total / dur));
      const e = emitCount(st.emit, dt, pace, stars, COMET.emitBase, COMET.emitPace, COMET.emitPaceCap);
      st.emit = e.acc;
      const n = Math.max(1, Math.round(stars));
      for (let i = 0; i < e.count && st.motes.length < COMET.maxMotes; i += 1) {
        const p = roundRectPoint(st.w, st.h, radius, st.phase + (Math.floor(Math.random() * n) * total) / n);
        const out = Math.random() < 0.5 ? 1 : -1;
        st.motes.push({ x: p.x, y: p.y, vx: p.ty * out * COMET.moteSpeed, vy: -p.tx * out * COMET.moteSpeed, life: COMET.moteLifeS });
      }
    }
    st.motes = st.motes.filter((m) => {
      m.vx *= Math.exp(-dt * COMET.moteDrag);
      m.vy *= Math.exp(-dt * COMET.moteDrag);
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.life -= dt;
      return m.life > 0;
    });
    paint();
    return true;
  }, { maxDtMs: COMET.maxDtS * 1000, active: !still && visible, pauseWhenHidden: true });

  const heat = (on: boolean): void => {
    const st = s.current;
    if (on && !st.hot && hover === "lap" && !still) st.lap = 0;
    st.hot = on;
  };

  return (
    <div
      ref={host}
      data-slot="comet-border"
      className={cn("relative border border-border", className)}
      style={{ borderRadius: radius }}
      onPointerEnter={() => heat(true)}
      onPointerLeave={() => heat(false)}
      onFocus={() => heat(true)}
      onBlur={() => heat(false)}
      onPointerDown={() => { if (clickPulse && !still) s.current.flash = 1; }}
    >
      <span ref={probe} aria-hidden="true" className={cn("hidden", TONE_CLASS[tone])} />
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute" style={{ inset: -B - 1, width: `calc(100% + ${2 * B + 2}px)`, height: `calc(100% + ${2 * B + 2}px)` }} />
      <div className="relative">{children}</div>
    </div>
  );
}
