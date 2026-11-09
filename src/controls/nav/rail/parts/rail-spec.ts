/**
 * ProximityRail 的规格常数与纯函数: 邻近衰减曲线, 指针距离到目标强度.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
import { clamp } from "../../tokens";

const SMOOTH_A = 3;
const SMOOTH_B = 2;

/** 衰减曲线: t 为 1 - 距离 / 半径, 已钳到 [0, 1]. */
export const RAIL_FALLOFF = {
  linear: (t: number): number => t,
  smooth: (t: number): number => t * t * (SMOOTH_A - SMOOTH_B * t),
  sharp: (t: number): number => t * t * t,
} as const;
export type RailFalloff = keyof typeof RAIL_FALLOFF;

/** 规格默认 (LineSidebar.jsx:28-46). fontSize 以 rem 计, smoothing 是趋近时间常数 ms. */
export const RAIL_DEFAULTS = {
  proximityRadius: 100,
  maxShift: 30,
  markerLength: 60,
  markerGap: 0,
  tickScale: 0.5,
  itemGap: 20,
  fontSize: 1.1,
  smoothing: 100,
} as const;
/** 颜色过渡 ms, HX 自定 (取 --duration-fast 一档). */
export const RAIL_COLOR_MS = 150;
/** 序号补零到两位. */
export const RAIL_INDEX_PAD = 2;

/** 指针到条目中心的距离 -> 目标强度 0..1 (LineSidebar.jsx:110). 半径不大于 0 时恒为 0. */
export function railTarget(distancePx: number, radius: number, falloff: RailFalloff): number {
  if (radius <= 0) return 0;
  return RAIL_FALLOFF[falloff](clamp(1 - Math.abs(distancePx) / radius, 0, 1));
}

/** 刻度线长度: 强度 0 时为 tickScale 倍, 1 时为全长; 不缩放时恒为全长. */
export function railMarker(strength: number, length: number, tickScale: number, scaleTick: boolean): number {
  if (!scaleTick) return length;
  const s = clamp(tickScale, 0, 1);
  return length * (s + (1 - s) * clamp(strength, 0, 1));
}
