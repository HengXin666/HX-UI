// 行为规格参照 docs/research/catalog/animations.md 的 GhostCursor 条目, 实现为 HX 自有.
/**
 * HazeCursor 的烟雾场驱动: stepHaze 这一帧新放的烟团 (沿弹簧烟头的路径, 点击喷的一圈) 打成溅点并从烟团表里取走;
 * 速度为烟团速度换成模拟格每秒 (x velocityShare), 补色两通道 body / smoke. 渐隐: 指针静止 fadeDelayMs 后按 fadeDurationMs 线性隐去.
 * 纯函数, 不碰 GL.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
import { HAZE } from "../tokens";
import { clamp } from "./common";
import { clampSpeed, toUv, type FluidSplat } from "./fluid";
import type { HazeState } from "./haze";

export interface HazeFluidTuning {
  readonly brightness: number;
  readonly simScale: number;
}

/** 取走 seq 大于 since 的烟团, 打成溅点; 返回溅点与新的 seq. */
export function hazeSplats(s: HazeState, since: number, fit: { readonly width: number; readonly height: number; readonly scale: number }, t: HazeFluidTuning): { splats: FluidSplat[]; seq: number } {
  const fresh = s.puffs.filter((p) => p.seed / 7.31 > since + 0.5);
  s.puffs = s.puffs.filter((p) => p.seed / 7.31 <= since + 0.5);
  const lum = clamp(t.brightness, 0, 2);
  const splats = fresh.map((p): FluidSplat => {
    const [x, y] = toUv(p.x, p.y, fit.width, fit.height);
    const [vx, vy] = clampSpeed(p.vx * t.simScale * HAZE.velocityShare, -p.vy * t.simScale * HAZE.velocityShare, 600);
    return { ax: x, ay: y, bx: x, by: y, vx, vy, radius: p.r / Math.max(1, fit.height), kind: 0, dye: [HAZE.puffBody * lum, HAZE.puffSmoke * lum, 0] };
  });
  return { splats, seq: s.seq };
}

/** 渐隐乘子: 不给 delay 时恒为 1. idle 为指针静止的秒数. */
export function hazeFade(idle: number, fadeDelayMs: number | undefined, fadeDurationMs: number | undefined): number {
  if (fadeDelayMs === undefined) return 1;
  const over = idle * 1000 - fadeDelayMs;
  if (over <= 0) return 1;
  const span = Math.max(1, fadeDurationMs ?? 600);
  return clamp(1 - over / span, 0, 1);
}
