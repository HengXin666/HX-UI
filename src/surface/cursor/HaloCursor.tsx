"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 GlowCursor 条目, 实现为 HX 自有.

import { useRef, type JSX, type ReactNode } from "react";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useCanvasBackdrop } from "../backdrop/kernel/use-surfaces";
import { inkOf } from "../pointer/ink";
import { SurfaceLayer } from "../pointer/SurfaceLayer";
import { TONE_TOKEN, type SurfaceTone } from "../pointer/tone";
import { clamp, pointerPx } from "./parts/common";
import { haloLayers, makeHalo, stepHalo } from "./parts/halo";
import { HALO } from "./tokens";

export interface HaloCursorProps {
  readonly children?: ReactNode;
  /** 主色调与尾部色调 (语义 token); 不给 secondaryTone 时一色. */
  readonly tone?: SurfaceTone;
  readonly secondaryTone?: SurfaceTone;
  readonly intensity?: number;
  /** 轨迹线宽倍数. */
  readonly trailWidth?: number;
  /** 余辉停留秒数. */
  readonly linger?: number;
  /** 光晕模糊倍数. */
  readonly glow?: number;
  /** 光头热点强度 0 到 1. */
  readonly hotspot?: number;
  /** 0 到 1, 越大越贴手. */
  readonly followSpeed?: number;
  readonly clickBurst?: boolean;
  readonly enabled?: boolean;
  readonly className?: string;
}

/**
 * 发光拖尾光标: 光头平滑跟手, 身后留下按 linger 渐隐的三层光带 (外晕, 主体, 热芯), 快速移动时更亮更粗, 停下后热点慢慢平息.
 * 点击放一圈光环. 叠加混合 (lighter). 画布叠在 children 上方, aria-hidden 且不接指针. 减弱动效或 enabled 为 false 时不画.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
export function HaloCursor({
  children,
  tone = "primary",
  secondaryTone,
  intensity = HALO.intensity,
  trailWidth = HALO.trailWidth,
  linger = HALO.linger,
  glow = HALO.glow,
  hotspot = HALO.hotspot,
  followSpeed = HALO.followSpeed,
  clickBurst = true,
  enabled = true,
  className,
}: HaloCursorProps): JSX.Element {
  const sim = useRef(makeHalo());
  const seen = useRef(-1);

  const draw = (ctx: CanvasRenderingContext2D, frame: BackdropFrame): void => {
    const { width, height, scale } = frame.fit;
    ctx.clearRect(0, 0, width, height);
    if (frame.reduced || !enabled) return;
    const s = sim.current;
    if (!frame.pointer.inside && !s.placed) return;
    const [tx, ty] = pointerPx(frame);
    stepHalo(s, tx, ty, frame.dt, followSpeed, linger, scale);
    for (const tap of frame.pointer.taps) {
      if (tap.at <= seen.current) continue;
      seen.current = tap.at;
      if (clickBurst) s.bursts.push({ x: s.x, y: s.y, age: 0 });
    }
    const main = frame.colors[0];
    const tail = frame.colors[1] ?? main;
    const amp = clamp(intensity, 0, 3) / HALO.intensity;
    const unit = HALO.widthUnit * trailWidth * scale;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 12 * glow * scale;
    const layers: readonly (readonly [number, number, number])[] = [[0, 2.6, 0.22], [1, 1, 0.75], [2, 0.4, 1]];
    for (const [layer, widthK, alphaK] of layers) {
      for (let i = 1; i < s.points.length; i += 1) {
        const a = s.points[i - 1];
        const b = s.points[i];
        const fade = haloLayers(b.age, linger)[layer];
        const alpha = clamp(fade * alphaK * amp * b.energy, 0, 1);
        if (alpha < 0.01) continue;
        const ink = inkOf(layer === 2 ? main : i / s.points.length < 0.5 ? tail : main, alpha);
        ctx.strokeStyle = ink;
        ctx.shadowColor = ink;
        ctx.lineWidth = unit * widthK * (0.6 + 0.4 * b.energy);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    if (hotspot > 0) {
      const ink = inkOf(main, clamp(hotspot * frame.pointer.presence * (0.4 + 0.6 * s.energy), 0, 1));
      ctx.fillStyle = ink;
      ctx.shadowColor = ink;
      ctx.shadowBlur = HALO.hotRadius * glow * scale;
      ctx.beginPath();
      ctx.arc(s.x, s.y, unit * (0.8 + s.energy), 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of s.bursts) {
      const p = b.age / HALO.burstS;
      ctx.strokeStyle = inkOf(main, (1 - p) * clamp(amp, 0, 1));
      ctx.lineWidth = unit * (1 - p);
      ctx.beginPath();
      ctx.arc(b.x, b.y, HALO.burstReach * scale * (1 - (1 - p) ** 3), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  const colors = secondaryTone ? [TONE_TOKEN[tone], TONE_TOKEN[secondaryTone]] : [TONE_TOKEN[tone]];
  const handle = useCanvasBackdrop({ draw }, { colors });
  return (
    <SurfaceLayer handle={handle} slot="halo-cursor" className={className}>
      {children}
    </SurfaceLayer>
  );
}
