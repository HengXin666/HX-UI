// 行为规格参照 docs/research/catalog/animations.md 的 GhostCursor 条目, 实现为 HX 自有.
/**
 * HazeCursor 的烟雾场驱动: 还没打过的烟团 (沿弹簧烟头的路径, 点击喷的一圈) 从老到新取至多 maxSplats 团打成溅点, 标为已打, 留在表里继续老化;
 * 排队时已过寿命的不发射; 补色乘该团当前浓度, 半径取 puffRadius;
 * 速度为烟团速度换成模拟格每秒 (x velocityShare), 补色两通道 body / smoke. 渐隐: 指针静止 fadeDelayMs 后按 fadeDurationMs 线性隐去.
 * 纯函数, 不碰 GL.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
import { CURSOR_FLUID, HAZE } from "../tokens";
import { clamp } from "./common";
import { clampSpeed, toUv, type FluidSplat } from "./fluid";
import { puffRadius, type HazeState } from "./haze";

export interface HazeFluidTuning {
  readonly brightness: number;
  readonly simScale: number;
}

/** 从老到新取还没打过且未过寿命的烟团, 至多 CURSOR_FLUID.maxSplats 团, 打成溅点并标为已打. */
export function hazeSplats(s: HazeState, fit: { readonly width: number; readonly height: number; readonly scale: number }, t: HazeFluidTuning): FluidSplat[] {
  const lum = clamp(t.brightness, 0, 2);
  const due = s.puffs.filter((p) => !p.sent && p.age < p.life).slice(0, CURSOR_FLUID.maxSplats);
  return due.map((p): FluidSplat => {
    p.sent = true;
    const [x, y] = toUv(p.x, p.y, fit.width, fit.height);
    const [vx, vy] = clampSpeed(p.vx * t.simScale * HAZE.velocityShare, -p.vy * t.simScale * HAZE.velocityShare, 600);
    const k = lum * p.amount;
    return { ax: x, ay: y, bx: x, by: y, vx, vy, radius: puffRadius(p) / Math.max(1, fit.height), kind: 0, dye: [HAZE.puffBody * k, HAZE.puffSmoke * k, 0] };
  });
}

/** 渐隐乘子: 不给 delay 时恒为 1. idle 为指针静止的秒数. */
export function hazeFade(idle: number, fadeDelayMs: number | undefined, fadeDurationMs: number | undefined): number {
  if (fadeDelayMs === undefined) return 1;
  const over = idle * 1000 - fadeDelayMs;
  if (over <= 0) return 1;
  const span = Math.max(1, fadeDurationMs ?? 600);
  return clamp(1 - over / span, 0, 1);
}
