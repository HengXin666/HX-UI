"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 SwarmCursor 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格是 2000 个实例化粒子加压力网格互斥; 内核没有实例化通道, 本件用 Canvas2D 逐个画, 默认降到 400 个, 不做粒子互斥.

import { useEffect, useRef, type JSX, type ReactNode } from "react";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useCanvasBackdrop } from "../backdrop/kernel/use-surfaces";
import { inkOf } from "../pointer/ink";
import { SurfaceLayer } from "../pointer/SurfaceLayer";
import { TONE_TOKEN, type SurfaceTone } from "../pointer/tone";
import { pointerPx } from "./parts/common";
import { FLOCK_STRIDE, burstFlock, makeFlock, stepFlock, type FlockState } from "./parts/flock";
import { FLOCK } from "./tokens";

export type FlockShape = "dot" | "square" | "streak";

export interface FlockCursorProps {
  readonly children?: ReactNode;
  /** 粒子数, 上限 2000. */
  readonly count?: number;
  /** 粒子直径 px. */
  readonly size?: number;
  readonly shape?: FlockShape;
  /** 主色调与近处粒子的强调色调 (语义 token). */
  readonly tone?: SurfaceTone;
  readonly accentTone?: SurfaceTone;
  /** 群的半径 px. */
  readonly spread?: number;
  readonly speed?: number;
  /** 0 到 1, 绕锚点打转的强度. */
  readonly swirl?: number;
  readonly wander?: number;
  /** 0 到 1, 远近层次 (远处粒子更小更淡). */
  readonly depth?: number;
  /** 指针不在时: 漫游或原地. */
  readonly idle?: "roam" | "still";
  readonly clickEffect?: "burst" | "none";
  readonly intro?: boolean;
  readonly enabled?: boolean;
  readonly className?: string;
}

/**
 * 蜂群光标: 一群粒子绕指针打转, 指针快移时被抓着跟上, 闲时绕区域漫游; 点击炸开再聚拢. 近处粒子用强调色调.
 * 粒子一种颜色合成一条路径一次填充. 画布叠在 children 上方, aria-hidden 且不接指针. 减弱动效或 enabled 为 false 时不画.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
export function FlockCursor({
  children,
  count = FLOCK.count,
  size = FLOCK.size,
  shape = "dot",
  tone = "primary",
  accentTone,
  spread = FLOCK.spread,
  speed = FLOCK.speed,
  swirl = FLOCK.swirl,
  wander = FLOCK.wander,
  depth = FLOCK.depth,
  idle = "roam",
  clickEffect = "burst",
  intro = true,
  enabled = true,
  className,
}: FlockCursorProps): JSX.Element {
  const sim = useRef<FlockState>(makeFlock(count, depth, 1, intro));
  const seen = useRef(-1);
  useEffect(() => {
    sim.current = makeFlock(count, depth, 1, intro);
  }, [count, depth, intro]);

  const paint = (ctx: CanvasRenderingContext2D, s: FlockState, near: boolean, r: number): void => {
    ctx.beginPath();
    for (let i = 0; i < s.count; i += 1) {
      const k = i * FLOCK_STRIDE;
      const z = s.data[k + 7];
      if ((z > 0.8) !== near) continue;
      const x = s.data[k];
      const y = s.data[k + 1];
      const rr = r * (0.4 + 0.6 * z);
      if (shape === "square") ctx.rect(x - rr, y - rr, rr * 2, rr * 2);
      else if (shape === "streak") {
        ctx.moveTo(x, y);
        ctx.lineTo(x - s.data[k + 2] * 0.03, y - s.data[k + 3] * 0.03);
      } else {
        ctx.moveTo(x + rr, y);
        ctx.arc(x, y, rr, 0, Math.PI * 2);
      }
    }
    if (shape === "streak") ctx.stroke();
    else ctx.fill();
  };

  const draw = (ctx: CanvasRenderingContext2D, frame: BackdropFrame): void => {
    const { width, height, scale } = frame.fit;
    ctx.clearRect(0, 0, width, height);
    if (frame.reduced || !enabled) return;
    const s = sim.current;
    const [px, py] = pointerPx(frame);
    stepFlock(s, px, py, frame.pointer.inside, idle, width, height, frame.dt, { spread, speed, swirl, wander }, scale);
    for (const tap of frame.pointer.taps) {
      if (tap.at <= seen.current) continue;
      seen.current = tap.at;
      if (clickEffect === "burst") burstFlock(s, px, py, spread, scale);
    }
    const r = (size / 2) * scale;
    ctx.lineCap = "round";
    ctx.lineWidth = r * 1.4;
    ctx.globalAlpha = 0.35 + 0.65 * (s.intro * s.intro * (3 - 2 * s.intro));
    ctx.fillStyle = inkOf(frame.colors[0], 0.75);
    ctx.strokeStyle = ctx.fillStyle;
    paint(ctx, s, false, r);
    ctx.fillStyle = inkOf(frame.colors[1] ?? frame.colors[0]);
    ctx.strokeStyle = ctx.fillStyle;
    paint(ctx, s, true, r);
    ctx.globalAlpha = 1;
  };

  const handle = useCanvasBackdrop({ draw }, { colors: [TONE_TOKEN[tone], TONE_TOKEN[accentTone ?? tone]] });
  return (
    <SurfaceLayer handle={handle} slot="flock-cursor" className={className}>
      {children}
    </SurfaceLayer>
  );
}
