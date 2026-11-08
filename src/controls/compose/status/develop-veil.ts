import { approach } from "../../../motion/spring/follow";
import { DEVELOP, HALF, MS_PER_S } from "../tokens";

/** 显影进度追随: stageMs 内走完约 95% (tau = stageMs / 3), 目标改了下一帧生效. */
export function developApproach(progress: number, target: number, dt: number, stageMs: number): number {
  const next = approach(progress, target, dt, stageMs / MS_PER_S / DEVELOP.approachSpan);
  return Math.abs(next - target) < DEVELOP.rest ? target : next;
}

/** 内容的模糊级别 (px): 按进度分档, 完成时为 0. */
export function blurFor(progress: number): number {
  const levels = DEVELOP.levels;
  if (progress >= 1) return levels[levels.length - 1];
  const steps = levels.length - 1;
  return levels[Math.min(steps - 1, Math.floor(progress * steps))];
}

/** 第 i 条带的揭开量 0..1. 上面的条带先揭开, 下面的落后 stripLag. */
export function stripReveal(progress: number, index: number, strips: number): number {
  const lag = DEVELOP.stripLag;
  const offset = strips > 1 ? (lag * index) / (strips - 1) : 0;
  return Math.min(1, Math.max(0, progress * (1 + lag) - offset));
}

const VEIL_ALPHA = 0.85;
const SWEEP_ALPHA = 0.18;

/** 画遮罩与扫光带. veil 是底色, ink 是扫光色, phase 0..1. */
export function drawVeil(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  phase: number,
  colors: { veil: string; ink: string },
  sweep: boolean,
): void {
  ctx.clearRect(0, 0, width, height);
  const band = height / DEVELOP.strips;
  ctx.fillStyle = colors.veil;
  for (let i = 0; i < DEVELOP.strips; i += 1) {
    ctx.globalAlpha = (1 - stripReveal(progress, i, DEVELOP.strips)) * VEIL_ALPHA;
    ctx.fillRect(0, i * band, width, Math.ceil(band));
  }
  if (!sweep || progress >= 1) {
    ctx.globalAlpha = 1;
    return;
  }
  const x = phase * (width + DEVELOP.edge * HALF) - DEVELOP.edge;
  const gradient = ctx.createLinearGradient(x - DEVELOP.edge, 0, x + DEVELOP.edge, 0);
  gradient.addColorStop(0, "transparent");
  gradient.addColorStop(1 / HALF, colors.ink);
  gradient.addColorStop(1, "transparent");
  ctx.globalAlpha = SWEEP_ALPHA;
  ctx.fillStyle = gradient;
  ctx.fillRect(x - DEVELOP.edge, 0, DEVELOP.edge * HALF, height);
  ctx.globalAlpha = 1;
}
