"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 CursorGrid 条目, 实现为 HX 自有.

import { useRef, type JSX, type ReactNode } from "react";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useCanvasBackdrop } from "../backdrop/kernel/use-surfaces";
import { inkOf } from "../pointer/ink";
import { SurfaceLayer } from "../pointer/SurfaceLayer";
import { TONE_TOKEN, type SurfaceTone } from "../pointer/tone";
import { clamp, pointerPx, seededRandom } from "./parts/common";
import { edgeAlpha, fitNudge, makeNudge, stepNudge, type NudgeFalloff, type NudgeHighlight, type NudgeState } from "./parts/nudge";
import { NUDGE } from "./tokens";

export type NudgeGridStyle = "lines" | "dashed" | "dots" | "crosses";

export interface NudgeGridProps {
  readonly children?: ReactNode;
  readonly cellSize?: number;
  /** 点亮的格的色调与网格线色调 (语义 token). */
  readonly tone?: SurfaceTone;
  readonly gridTone?: SurfaceTone;
  readonly radius?: number;
  readonly falloff?: NudgeFalloff;
  readonly highlight?: NudgeHighlight;
  /** 离开后保持 ms, 再按 fadeDuration ms 熄灭. */
  readonly holdTime?: number;
  readonly fadeDuration?: number;
  readonly lineWidth?: number;
  readonly maxOpacity?: number;
  readonly fillOpacity?: number;
  readonly gridOpacity?: number;
  readonly gridStyle?: NudgeGridStyle;
  readonly cellRadius?: number;
  readonly cellGap?: number;
  /** 指针附近网格线额外的亮度 0 到 1. */
  readonly spotlight?: number;
  readonly clickPulse?: boolean;
  /** 波的扩散速度 px/s. */
  readonly pulseSpeed?: number;
  /** 环境随机闪格的频度, 0 关闭. */
  readonly ambient?: number;
  /** 边缘渐隐占短边一半的比例. */
  readonly edgeFade?: number;
  readonly intro?: boolean;
  readonly className?: string;
}

/**
 * 跟手网格: children 下面垫一张网格, 指针附近的格按衰减曲线亮起, 离开后停留再熄灭; 指针周围的网格线被聚光提亮.
 * 点击放一圈扩散的波. 首次出现时从中心向外展开 1.4s. 画布在 children 下方, aria-hidden 且不接指针.
 * 减弱动效时只画静态网格.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
export function NudgeGrid({
  children,
  cellSize = NUDGE.cellSize,
  tone = "primary",
  gridTone = "foreground",
  radius = NUDGE.radius,
  falloff = "smooth",
  highlight = "area",
  holdTime = NUDGE.holdTime,
  fadeDuration = NUDGE.fadeDuration,
  lineWidth = NUDGE.lineWidth,
  maxOpacity = NUDGE.maxOpacity,
  fillOpacity = NUDGE.fillOpacity,
  gridOpacity = NUDGE.gridOpacity,
  gridStyle = "lines",
  cellRadius = NUDGE.cellRadius,
  cellGap = NUDGE.cellGap,
  spotlight = NUDGE.spotlight,
  clickPulse = true,
  pulseSpeed = NUDGE.pulseSpeed,
  ambient = NUDGE.ambient,
  edgeFade = NUDGE.edgeFade,
  intro = true,
  className,
}: NudgeGridProps): JSX.Element {
  const sim = useRef(makeNudge(intro));
  const seen = useRef(-1);
  const rand = useRef(seededRandom(Math.round(cellSize)));

  const grid = (ctx: CanvasRenderingContext2D, s: NudgeState, width: number, height: number, scale: number): void => {
    const cell = s.cell;
    ctx.setLineDash(gridStyle === "dashed" ? [NUDGE.dash * scale, NUDGE.dash * scale] : []);
    ctx.beginPath();
    if (gridStyle === "lines" || gridStyle === "dashed") {
      for (let c = 0; c <= s.cols; c += 1) {
        ctx.moveTo(c * cell, 0);
        ctx.lineTo(c * cell, height);
      }
      for (let r = 0; r <= s.rows; r += 1) {
        ctx.moveTo(0, r * cell);
        ctx.lineTo(width, r * cell);
      }
      ctx.stroke();
      return;
    }
    const arm = gridStyle === "crosses" ? cell * 0.12 : lineWidth * scale;
    for (let r = 0; r <= s.rows; r += 1) {
      for (let c = 0; c <= s.cols; c += 1) {
        const x = c * cell;
        const y = r * cell;
        if (gridStyle === "dots") ctx.rect(x - arm, y - arm, arm * 2, arm * 2);
        else {
          ctx.moveTo(x - arm, y);
          ctx.lineTo(x + arm, y);
          ctx.moveTo(x, y - arm);
          ctx.lineTo(x, y + arm);
        }
      }
    }
    if (gridStyle === "dots") ctx.fill();
    else ctx.stroke();
  };

  const draw = (ctx: CanvasRenderingContext2D, frame: BackdropFrame): void => {
    const { width, height, scale } = frame.fit;
    ctx.clearRect(0, 0, width, height);
    const s = sim.current;
    fitNudge(s, width, height, Math.max(4, cellSize) * scale);
    const [px, py] = pointerPx(frame);
    if (!frame.reduced) stepNudge(s, px, py, frame.pointer.inside, frame.dt, { radius: radius * scale, falloff, highlight, holdTime, fadeDuration, ambient, pulseSpeed: pulseSpeed * scale, pulseReach: NUDGE.pulseReach * scale }, rand.current);
    for (const tap of frame.pointer.taps) {
      if (tap.at <= seen.current) continue;
      seen.current = tap.at;
      if (clickPulse && !frame.reduced) s.pulses.push({ x: px, y: py, age: 0 });
    }
    const reveal = frame.reduced ? 1 : s.intro * s.intro * (3 - 2 * s.intro);
    ctx.save();
    if (reveal < 1) {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, reveal * Math.hypot(width, height) * 0.5 + s.cell, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.lineWidth = lineWidth * scale;
    ctx.strokeStyle = inkOf(frame.colors[1], clamp(gridOpacity, 0, 1));
    ctx.fillStyle = ctx.strokeStyle;
    grid(ctx, s, width, height, scale);
    if (spotlight > 0 && s.presence > 0.01 && !frame.reduced) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius * scale, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = inkOf(frame.colors[0], clamp(spotlight * 0.4 * s.presence, 0, 1));
      ctx.fillStyle = ctx.strokeStyle;
      grid(ctx, s, width, height, scale);
      ctx.restore();
    }
    ctx.setLineDash([]);
    const inset = cellGap * scale * 0.5;
    for (let r = 0; r < s.rows; r += 1) {
      for (let c = 0; c < s.cols; c += 1) {
        const v = s.level[r * s.cols + c];
        if (v < 0.01) continue;
        const x = c * s.cell + inset;
        const y = r * s.cell + inset;
        const size = s.cell - inset * 2;
        const a = clamp(v * maxOpacity, 0, 1) * edgeAlpha(x + size / 2, y + size / 2, width, height, edgeFade);
        ctx.beginPath();
        if (cellRadius > 0) ctx.roundRect(x, y, size, size, cellRadius * scale);
        else ctx.rect(x, y, size, size);
        ctx.fillStyle = inkOf(frame.colors[0], a * fillOpacity * 4);
        ctx.fill();
        ctx.strokeStyle = inkOf(frame.colors[0], a);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  const handle = useCanvasBackdrop({ draw }, { colors: [TONE_TOKEN[tone], TONE_TOKEN[gridTone]] });
  return (
    <SurfaceLayer handle={handle} front={false} slot="nudge-grid" className={className}>
      {children}
    </SurfaceLayer>
  );
}
