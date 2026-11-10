// 行为规格参照 docs/research/catalog/animations.md 的 GlowCursor 与 GhostCursor 条目 (溅点), 实现为 HX 自有.
/**
 * 光标流体的溅点: 一段线段 (a 到 b, 归一化坐标, y 朝上; 点溅时两端相同), 速度 (模拟格每秒) 或径向推力, 半径 (短边归一),
 * 三通道补色. 打包成着色器数组. 纯函数, 不碰 GL.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
import { CURSOR_FLUID } from "../tokens";

export interface FluidSplat {
  readonly ax: number;
  readonly ay: number;
  readonly bx: number;
  readonly by: number;
  /** kind 0: 目标速度 (vx, vy); kind 1: 径向推力 vx, vy 不用. */
  readonly vx: number;
  readonly vy: number;
  readonly radius: number;
  readonly kind: 0 | 1;
  readonly dye: readonly [number, number, number];
}

export interface PackedSplats {
  readonly seg: Float32Array;
  readonly vel: Float32Array;
  readonly dye: Float32Array;
  readonly count: number;
}

export function packSplats(splats: readonly FluidSplat[]): PackedSplats {
  const n = CURSOR_FLUID.maxSplats;
  const seg = new Float32Array(n * 4);
  const vel = new Float32Array(n * 4);
  const dye = new Float32Array(n * 4);
  const list = splats.slice(-n);
  list.forEach((s, i) => {
    seg.set([s.ax, s.ay, s.bx, s.by], i * 4);
    vel.set([s.vx, s.vy, s.radius, s.kind], i * 4);
    dye.set([s.dye[0], s.dye[1], s.dye[2], 0], i * 4);
  });
  return { seg, vel, dye, count: list.length };
}

/** 着色器 uniform. */
export function splatUniforms(p: PackedSplats, aspect: number) {
  return {
    u_splat_seg: { list: p.seg, size: 4 as const },
    u_splat_vel: { list: p.vel, size: 4 as const },
    u_splat_dye: { list: p.dye, size: 4 as const },
    u_splat_count: p.count,
    u_aspect: aspect,
  };
}

/** 设备像素 (y 朝下) 转归一化 (y 朝上). */
export function toUv(x: number, y: number, width: number, height: number): readonly [number, number] {
  return [x / Math.max(1, width), 1 - y / Math.max(1, height)];
}

/** 速度上限钳制 (格每秒). */
export function clampSpeed(vx: number, vy: number, max: number): readonly [number, number] {
  const len = Math.hypot(vx, vy);
  if (len <= max || len === 0) return [vx, vy];
  return [(vx / len) * max, (vy / len) * max];
}
