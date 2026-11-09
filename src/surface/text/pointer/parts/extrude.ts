// 行为规格参照 docs/research/catalog/textanimations.md 的 DepthText 条目, 实现为 HX 自有.

import { clamp, clamp01, mix } from "../../kernel/curve";
import { DOUBLE, HALF, PERCENT } from "../../kernel/tokens";
import { EXTRUDE_FADE_FLOOR, EXTRUDE_MAX_LAYERS, EXTRUDE_ORBIT_PITCH, EXTRUDE_ORBIT_PITCH_RATE, EXTRUDE_PRESS_EXTRA, EXTRUDE_REF_HZ } from "../tokens";

/**
 * ExtrudeText 的纯函数: 层数钳制, 入场曲线, 指针倾斜, 自转, 平滑折算, 推深目标与层的不透明度.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-text-pointer.md
 */

export interface Tilt {
  /** 绕 X 轴 (度), 指针在上半时为正 (上沿朝外). */
  readonly x: number;
  /** 绕 Y 轴 (度), 指针在右半时为正. */
  readonly y: number;
}

/** 层数取整并钳到 1 到 EXTRUDE_MAX_LAYERS. */
export function extrudeLayers(layers: number): number {
  return clamp(Math.round(Number.isFinite(layers) ? layers : 1), 1, EXTRUDE_MAX_LAYERS);
}

/** 入场进度 0 到 1 的三次缓出: 厚度先快后慢长出来. */
export function extrudeIntro(elapsedMs: number, introMs: number): number {
  if (introMs <= 0) return 1;
  const t = clamp01(elapsedMs / introMs);
  return 1 - (1 - t) ** 3;
}

/** 指针在元素内的位置换成倾角: 中心为 0, 边沿为 ±tilt. */
export function pointerTilt(x: number, y: number, width: number, height: number, tilt: number): Tilt {
  if (width <= 0 || height <= 0) return { x: 0, y: 0 };
  const nx = clamp01(x / width) - HALF;
  const ny = clamp01(y / height) - HALF;
  return { x: -ny * DOUBLE * tilt, y: nx * DOUBLE * tilt };
}

/** 自转: 横向按正弦摆, 纵向以两倍相位摆一半幅度. */
export function orbitTilt(phase: number, tilt: number): Tilt {
  return { x: Math.sin(phase * EXTRUDE_ORBIT_PITCH_RATE) * tilt * EXTRUDE_ORBIT_PITCH, y: Math.sin(phase) * tilt };
}

/**
 * 每帧跟随比例 (以 60Hz 计) 折成本帧比例, 帧率变了手感不变.
 *
 * @param smoothing 0 到 1, 越大越跟手; 1 直接到位.
 * @param dtS 本帧时长 (秒).
 */
export function smoothingStep(smoothing: number, dtS: number): number {
  const s = clamp01(smoothing);
  if (s >= 1) return 1;
  return 1 - (1 - s) ** (dtS * EXTRUDE_REF_HZ);
}

/** 推深目标: 1 为原厚度, 悬停加 hoverPush, 按下再加 EXTRUDE_PRESS_EXTRA. */
export function pushTarget(hover: boolean, down: boolean, hoverPush: number): number {
  return 1 + (hover ? hoverPush : 0) + (down ? EXTRUDE_PRESS_EXTRA : 0);
}

/** 第 index 层 (0 为紧贴正面的一层) 的不透明度百分比: 渐变时由前往后降到 EXTRUDE_FADE_FLOOR. */
export function layerOpacity(index: number, count: number, gradient: boolean): number {
  if (!gradient || count <= 1) return PERCENT;
  return mix(PERCENT, EXTRUDE_FADE_FLOOR, index / (count - 1));
}
