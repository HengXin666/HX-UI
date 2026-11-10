"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 GhostCursor 条目, 实现为 HX 自有.

import { useRef, type JSX, type ReactNode } from "react";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useCanvasBackdrop } from "../backdrop/kernel/use-surfaces";
import { inkOf } from "../pointer/ink";
import { SurfaceLayer } from "../pointer/SurfaceLayer";
import { TONE_TOKEN, type SurfaceTone } from "../pointer/tone";
import { clamp, pointerPx } from "./parts/common";
import { makeHaze, puffHaze, puffRadius, stepHaze } from "./parts/haze";
import { HAZE } from "./tokens";

export interface HazeCursorProps {
  readonly children?: ReactNode;
  readonly tone?: SurfaceTone;
  readonly brightness?: number;
  /** 烟头直径 px. */
  readonly size?: number;
  /** 烟尾长短, 越大散得越慢. */
  readonly trailLength?: number;
  /** 0 到 1, 越大越飘. */
  readonly inertia?: number;
  readonly turbulence?: number;
  /** 向上漂移的快慢. */
  readonly drift?: number;
  readonly clickPuff?: boolean;
  readonly intro?: boolean;
  readonly className?: string;
}

/**
 * 幽灵烟雾光标: 烟头用弹簧跟手 (inertia 越大越飘), 沿路径放出烟团; 烟团减速, 向上漂移, 被噪声搅动, 一边变淡一边胀大.
 * 点击喷一圈. 首次出现用 1.9s 长大. 画布叠在 children 上方, aria-hidden 且不接指针. 减弱动效时不画.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
export function HazeCursor({
  children,
  tone = "foreground",
  brightness = HAZE.brightness,
  size = HAZE.size,
  trailLength = HAZE.trailLength,
  inertia = HAZE.inertia,
  turbulence = HAZE.turbulence,
  drift = HAZE.drift,
  clickPuff = true,
  intro = true,
  className,
}: HazeCursorProps): JSX.Element {
  const sim = useRef(makeHaze(intro));
  const seen = useRef(-1);

  const draw = (ctx: CanvasRenderingContext2D, frame: BackdropFrame): void => {
    const { width, height, scale } = frame.fit;
    ctx.clearRect(0, 0, width, height);
    if (frame.reduced) return;
    const s = sim.current;
    if (!frame.pointer.inside && !s.placed) return;
    const [tx, ty] = pointerPx(frame);
    const grow = s.intro * s.intro * (3 - 2 * s.intro);
    const radius = (size / 2) * scale * (0.3 + 0.7 * grow);
    stepHaze(s, tx, ty, frame.pointer.inside, frame.dt, { inertia, trailLength, turbulence, drift, radius: radius * 0.6 }, scale);
    for (const tap of frame.pointer.taps) {
      if (tap.at <= seen.current) continue;
      seen.current = tap.at;
      if (clickPuff) puffHaze(s, HAZE.clickPuffs, radius, scale);
    }
    const lum = clamp(brightness, 0, 2);
    ctx.save();
    for (const p of s.puffs) {
      const r = puffRadius(p);
      const ink = inkOf(frame.colors[0], clamp(p.amount * 0.28 * lum, 0, 1));
      ctx.fillStyle = ink;
      ctx.shadowColor = ink;
      ctx.shadowBlur = r;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    const head = inkOf(frame.colors[0], clamp(s.presence * 0.55 * lum, 0, 1));
    ctx.fillStyle = head;
    ctx.shadowColor = head;
    ctx.shadowBlur = radius;
    ctx.beginPath();
    ctx.arc(s.head.x, s.head.y, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const handle = useCanvasBackdrop({ draw }, { colors: [TONE_TOKEN[tone]] });
  return (
    <SurfaceLayer handle={handle} slot="haze-cursor" className={className}>
      {children}
    </SurfaceLayer>
  );
}
