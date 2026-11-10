// 行为规格参照 docs/research/catalog/animations.md 的 GlowCursor 条目, 实现为 HX 自有.
/**
 * HaloCursor 的流体驱动: 光头 (stepHalo) 这一帧走过的线段打成一个溅点, 速度取光头速度 (换成模拟格每秒, 钳上限),
 * 三通道补色: energy (主体) / gas (热芯) / halo (外晕); 点击光环打一个径向推力的溅点. 三通道保留率按规格
 * exp(-dt x 4.6 / (linger x 0.8 / 0.2 / 1.2)). 纯函数, 不碰 GL.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
import { HALO } from "../tokens";
import { clamp } from "./common";
import { clampSpeed, toUv, type FluidSplat } from "./fluid";
import type { HaloState } from "./halo";

export interface HaloFluidTuning {
  readonly intensity: number;
  readonly trailWidth: number;
  readonly glow: number;
  readonly hotspot: number;
  /** 模拟格相对画布的比例. */
  readonly simScale: number;
}

/** 三通道 (energy, gas, halo) 每帧保留率. */
export function haloKeep(dt: number, linger: number): readonly [number, number, number] {
  const l = Math.max(0.05, linger);
  const at = (share: number): number => Math.exp((-dt * HALO.lingerRate) / (l * share));
  return [at(HALO.lingerCore), at(HALO.lingerHot), at(HALO.lingerWide)];
}

/**
 * 这一帧的溅点.
 *
 * @param s stepHalo 推进后的状态 (设备像素, y 朝下).
 * @param from 推进前的光头位置.
 * @param bursts 这一帧新放的点击光环.
 */
export function haloSplats(
  s: Pick<HaloState, "x" | "y" | "energy">,
  from: { readonly x: number; readonly y: number },
  bursts: readonly { readonly x: number; readonly y: number }[],
  dt: number,
  fit: { readonly width: number; readonly height: number; readonly scale: number },
  t: HaloFluidTuning,
): FluidSplat[] {
  if (dt <= 0) return [];
  const out: FluidSplat[] = [];
  const [ax, ay] = toUv(from.x, from.y, fit.width, fit.height);
  const [bx, by] = toUv(s.x, s.y, fit.width, fit.height);
  const cellsX = fit.width * t.simScale;
  const cellsY = fit.height * t.simScale;
  const [vx, vy] = clampSpeed(((bx - ax) / dt) * cellsX, ((by - ay) / dt) * cellsY, HALO.maxSpeed);
  const radius = (HALO.widthUnit * Math.max(0.1, t.trailWidth) * fit.scale * (0.6 + 0.4 * s.energy)) / Math.max(1, fit.height) / 2;
  const amount = HALO.dye * clamp(t.intensity, 0, 3) * Math.min(1, dt * 60) * (0.35 + 0.65 * s.energy);
  const moved = Math.hypot(bx - ax, by - ay) > 1e-5;
  if (moved || s.energy > 0.05) {
    out.push({ ax, ay, bx, by, vx, vy, radius, kind: 0, dye: [amount, amount * clamp(t.hotspot, 0, 1) * 0.8, amount * 0.6 * Math.max(0, t.glow)] });
  }
  for (const b of bursts) {
    const [x, y] = toUv(b.x, b.y, fit.width, fit.height);
    out.push({ ax: x, ay: y, bx: x, by: y, vx: HALO.burstPush, vy: 0, radius: radius * 3, kind: 1, dye: [amount * 3, amount * 2, amount * 3] });
  }
  return out;
}
