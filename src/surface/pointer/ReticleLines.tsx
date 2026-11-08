"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 Crosshair 条目, 实现为 HX 自有.

import { useRef, type JSX, type ReactNode } from "react";
import { approach } from "../../motion/spring/follow";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useCanvasBackdrop } from "../backdrop/kernel/use-surfaces";
import { inkOf } from "./ink";
import { SurfaceLayer } from "./SurfaceLayer";
import { TONE_TOKEN, type SurfaceTone } from "./tone";
import { DOUBLE, HALF, RETICLE } from "./tokens";

export type ReticleLineStyle = "solid" | "dashed" | "dotted";
export type ReticleTargetEffect = "lock" | "none";

/** 十字线的可中断状态 (CSS 像素): 跟手位置, 出现度, 锁框与它的透明度, 点击脉冲. */
export interface ReticleState {
  x: number;
  y: number;
  presence: number;
  lock: { x: number; y: number; w: number; h: number; alpha: number };
  pulses: Array<{ x: number; y: number; age: number }>;
  seenTap: number;
}

export function makeReticle(): ReticleState {
  return { x: 0, y: 0, presence: 0, lock: { x: 0, y: 0, w: 0, h: 0, alpha: 0 }, pulses: [], seenTap: -1 };
}

/** 跟手时间常数 (秒): 0.008 + smoothing * 0.16; smoothing 为 0 或减弱动效时直接贴手. */
export function reticleTau(smoothing: number, reduced: boolean): number {
  return reduced || smoothing === 0 ? 0 : RETICLE.followBase + smoothing * RETICLE.followGain;
}

/** 推进一帧. target 为当前锁定的目标矩形 (宿主 CSS 像素), 没有则为 null. */
export function stepReticle(s: ReticleState, dtS: number, input: { x: number; y: number; inside: boolean; target: { x: number; y: number; width: number; height: number } | null; smoothing: number; reduced: boolean }): void {
  const { reduced } = input;
  const tau = reticleTau(input.smoothing, reduced);
  s.x = approach(s.x, input.x, dtS, tau);
  s.y = approach(s.y, input.y, dtS, tau);
  const wanted = input.inside ? 1 : 0;
  s.presence = approach(s.presence, wanted, dtS, reduced ? 0 : wanted ? RETICLE.presenceIn : RETICLE.presenceOut);
  const t = input.target;
  if (t) {
    const snap = reduced ? 0 : RETICLE.snap;
    s.lock.x = approach(s.lock.x, t.x, dtS, snap);
    s.lock.y = approach(s.lock.y, t.y, dtS, snap);
    s.lock.w = approach(s.lock.w, t.width, dtS, snap);
    s.lock.h = approach(s.lock.h, t.height, dtS, snap);
  }
  const shown = t ? 1 : 0;
  s.lock.alpha = approach(s.lock.alpha, shown, dtS, reduced ? 0 : shown ? RETICLE.lockIn : RETICLE.lockOut);
  s.pulses = s.pulses.filter((p) => (p.age += dtS) < RETICLE.pulseLife);
}

export interface ReticleLinesProps {
  readonly children?: ReactNode;
  readonly tone?: SurfaceTone;
  readonly opacity?: number;
  readonly lineStyle?: ReticleLineStyle;
  /** 交点周围留空 (px). */
  readonly gap?: number;
  /** 0..1, 跟手平滑度. */
  readonly smoothing?: number;
  readonly showCoordinates?: boolean;
  readonly targetEffect?: ReticleTargetEffect;
  /** 悬停到匹配的元素时锁框. */
  readonly targetSelector?: string;
  readonly clickPulse?: boolean;
  /** 在宿主内隐藏系统光标. */
  readonly hideCursor?: boolean;
  readonly className?: string;
}

function line(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number): void {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

/** 指针下匹配选择器且在宿主内的元素, 换成宿主 CSS 像素矩形. */
function lockTarget(host: HTMLElement, cx: number, cy: number, selector: string): { x: number; y: number; width: number; height: number } | null {
  const hr = host.getBoundingClientRect();
  const hit = typeof document === "undefined" || !document.elementFromPoint ? null : document.elementFromPoint(hr.left + cx, hr.top + cy);
  const el = hit?.closest(selector);
  if (!el || !host.contains(el)) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left - hr.left, y: r.top - hr.top, width: r.width, height: r.height };
}

/**
 * 十字准线: 横竖两条 1px 线跟手, 悬停到目标元素时吸附成锁框, 点击放一圈脉冲. 状态机是跟手, 出现,
 * 锁定三条一阶跟随, 每帧重算目标; pointercancel 与失焦由内核按离开处理. 画在 backdrop 内核的 Canvas2D 上;
 * 减弱动效时内核只画一帧, 不出脉冲.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-pointer.md
 */
export function ReticleLines({
  children,
  tone = "foreground",
  opacity = RETICLE.opacity,
  lineStyle = "solid",
  gap = 0,
  smoothing = RETICLE.smoothing,
  showCoordinates = true,
  targetEffect = "lock",
  targetSelector = "a, button",
  clickPulse = true,
  hideCursor = false,
  className,
}: ReticleLinesProps): JSX.Element {
  const state = useRef<ReticleState>(makeReticle());

  const draw = (ctx: CanvasRenderingContext2D, frame: BackdropFrame): void => {
    const { fit, pointer: p, reduced } = frame;
    const k = fit.scale;
    const w = fit.width / k;
    const h = fit.height / k;
    const s = state.current;
    const px = p.x * w;
    const py = (1 - p.y) * h;
    const target = targetEffect === "lock" && p.inside && handle.hostRef.current ? lockTarget(handle.hostRef.current, px, py, targetSelector) : null;
    for (const tap of p.taps) {
      if (tap.at <= s.seenTap) continue;
      s.seenTap = tap.at;
      if (clickPulse && !reduced) s.pulses.push({ x: tap.x * w, y: (1 - tap.y) * h, age: 0 });
    }
    stepReticle(s, frame.dt, { x: px, y: py, inside: p.inside, target, smoothing, reduced });
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const ink = inkOf(frame.colors[0]);
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = 1;
    ctx.globalAlpha = opacity * s.presence;
    ctx.setLineDash(lineStyle === "dashed" ? [...RETICLE.dash] : lineStyle === "dotted" ? [...RETICLE.dot] : []);
    const x = Math.round(s.x * k) / k + HALF / k;
    const y = Math.round(s.y * k) / k + HALF / k;
    line(ctx, 0, y, Math.max(0, x - gap), y);
    line(ctx, x + gap, y, w, y);
    line(ctx, x, 0, x, Math.max(0, y - gap));
    line(ctx, x, y + gap, x, h);
    ctx.setLineDash([]);
    if (s.lock.alpha > 0.01) {
      ctx.globalAlpha = opacity * s.lock.alpha * s.presence;
      ctx.strokeRect(s.lock.x, s.lock.y, s.lock.w, s.lock.h);
    }
    for (const pulse of s.pulses) {
      const t = pulse.age / RETICLE.pulseLife;
      ctx.globalAlpha = opacity * (1 - t);
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, t * RETICLE.pulseReach, 0, Math.PI * DOUBLE);
      ctx.stroke();
    }
    if (showCoordinates && s.presence > 0.01) {
      ctx.globalAlpha = opacity * s.presence;
      ctx.font = RETICLE.font;
      ctx.fillText(`${Math.round(s.x)}, ${Math.round(s.y)}`, x + RETICLE.labelOffset, y - RETICLE.labelOffset);
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  const handle = useCanvasBackdrop({ draw }, { colors: [TONE_TOKEN[tone]] });
  return (
    <SurfaceLayer handle={handle} slot="reticle-lines" className={hideCursor ? `cursor-none ${className ?? ""}` : className}>
      {children}
    </SurfaceLayer>
  );
}
