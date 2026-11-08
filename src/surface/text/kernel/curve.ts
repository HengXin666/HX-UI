// 行为规格参照 docs/research/catalog/textanimations.md 的 BlurText, ScrollFloat, TechText, VariableProximity, TextPressure, ScrambledText 条目, 实现为 HX 自有.

/**
 * 文本族的纯函数曲线: 钳制, 平滑阶跃, 模糊中点, 距离衰减与确定性伪随机.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-kernel.md
 */

import { HALF } from "./tokens";

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 三次平滑阶跃: edge0 之前为 0, edge1 之后为 1. */
export function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * 模糊中点: 进度 0 到 0.5 从 from 走到 mid, 0.5 到 1 从 mid 走到 to.
 * 入场时模糊先降到一半, 文字在后半段才清晰, 中段不会糊成一片.
 */
export function midpoint(p: number, from: number, mid: number, to: number): number {
  const t = clamp01(p);
  return t < HALF ? mix(from, mid, t / HALF) : mix(mid, to, (t - HALF) / HALF);
}

export type Falloff = "linear" | "exponential" | "gaussian";

/** 高斯衰减在半径处的残值, 再小就截成 0. */
const GAUSS_EDGE = 0.01;
const GAUSS_K = -Math.log(GAUSS_EDGE);

/**
 * 距离衰减, 半径内 1 到 0, 半径外恒 0.
 *
 * @param distance 到中心的距离.
 * @param radius 半径.
 * @param kind linear 线性; exponential 平方; gaussian 高斯 (半径处残 1%).
 */
export function falloff(distance: number, radius: number, kind: Falloff = "linear"): number {
  if (radius <= 0 || distance >= radius) return 0;
  const k = 1 - distance / radius;
  if (kind === "exponential") return k * k;
  if (kind === "gaussian") {
    const d = distance / radius;
    return Math.max(0, (Math.exp(-GAUSS_K * d * d) - GAUSS_EDGE) / (1 - GAUSS_EDGE));
  }
  return k;
}

const HASH_A = 12.9898;
const HASH_B = 78.233;
const HASH_SCALE = 43758.5453;

/** 0 到 1 的确定性伪随机: 同样的种子每次同样的结果, 测试与服务端渲染都稳定. */
export function hash01(a: number, b = 0): number {
  const s = Math.sin(a * HASH_A + b * HASH_B) * HASH_SCALE;
  return s - Math.floor(s);
}
