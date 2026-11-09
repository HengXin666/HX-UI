/**
 * FrayCard 的规格常数与纯函数: 出血放大, 指针跟随, 侵蚀量的目标与恢复, 噪声频率, 位移量.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
import { clamp } from "../tokens";

export const FRAY_DEFAULTS = { width: 300, height: 400, intensity: 0.5, sensitivity: 0.5, hoverDecay: 0.05, recovery: 0.6, grain: 0.25, detail: 5, pattern: 4, idle: 0.35, flow: 0, travel: 50, tilt: 10, radius: 0 } as const;
/** 图片出血放大 1.24 (DecayCard.jsx:8), 位移不露底. */
export const FRAY_BLEED = 1.24;
/** 指针跟随 tau 0.16s (DecayCard.jsx:350). */
export const FRAY_FOLLOW_S = 0.16;
/** 侵蚀量升起 tau 0.08s (HX 自定); 落回 tau = recovery s (规格 recovery 0.6). */
export const FRAY_RISE_S = 0.08;
/** 指针速度换侵蚀: 速度 2000px/s × sensitivity 时满 1 (HX 自定). */
export const FRAY_SPEED_FULL = 2000;
/** 最大位移 px (intensity 1 时), HX 自定. */
export const FRAY_MAX_DISPLACE = 60;
/** 闲置呼吸周期 s (HX 自定). */
export const FRAY_IDLE_PERIOD_S = 4;

/** 目标侵蚀量: 指针速度项 + 悬停常量 + 闲置呼吸, 钳到 0..1. */
export function frayWanted(speed: number, sensitivity: number, hovering: boolean, hoverDecay: number, idle: number, tS: number): number {
  const fromSpeed = (Math.max(0, speed) / FRAY_SPEED_FULL) * clamp(sensitivity, 0, 2);
  const breathe = idle > 0 ? idle * 0.15 * (0.5 + 0.5 * Math.sin((tS / FRAY_IDLE_PERIOD_S) * Math.PI * 2)) : 0;
  return clamp(fromSpeed + (hovering ? hoverDecay : 0) + breathe, 0, 1);
}

/** 规格 pattern (1..10) 换成 feTurbulence 的 baseFrequency; flow 让频率随时间漂. */
export function frayFrequency(pattern: number, flow: number, tS: number): number {
  const base = 0.004 * clamp(pattern, 0.5, 10);
  return base * (1 + (flow > 0 ? 0.15 * Math.sin(tS * flow) : 0));
}

/** 侵蚀量换成位移 px. */
export function frayScale(level: number, intensity: number): number {
  return clamp(level, 0, 1) * clamp(intensity, 0, 2) * FRAY_MAX_DISPLACE;
}
