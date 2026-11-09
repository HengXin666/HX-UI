/**
 * DriftColumns 的规格常数与纯函数: 每列速度的趋近, 列内循环取模, 列的速度系数.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
import { approach } from "../tokens";

/** 悬停减速的时间常数 160ms, 离开后回速 280ms (DriftWall.jsx:145). */
export const DRIFT_STOP_TAU_MS = 160;
export const DRIFT_GO_TAU_MS = 280;
/** 卡片悬停过渡 420ms (DriftWall.css:73-95), 曲线 (0.22, 1, 0.36, 1). */
export const DRIFT_HOVER_MS = 420;
/** 默认漂移速度 px/s, 列数. HX 自定 (规格未给默认). */
export const DRIFT_DEFAULTS = { speed: 30, columns: 4, gap: 16, height: 600 } as const;
/** 各列速度系数, 循环取用, 让相邻列错开. HX 自定. */
export const DRIFT_COLUMN_FACTORS = [1, 0.8, 1.15, 0.9] as const;
/** 悬停卡片上浮 px 与放大, 其余卡片淡到的透明度. HX 自定. */
export const DRIFT_LIFT_PX = 4;
export const DRIFT_LIFT_SCALE = 1.02;
export const DRIFT_DIM = 0.55;
/** 速度落定阈值 px/s. */
export const DRIFT_REST = 0.01;

/** 第 c 列的基础速度 (px/s, 正为向上). alternate 时奇数列反向. */
export function driftBase(c: number, speed: number, alternate: boolean): number {
  const factor = DRIFT_COLUMN_FACTORS[c % DRIFT_COLUMN_FACTORS.length] ?? 1;
  return speed * factor * (alternate && c % 2 === 1 ? -1 : 1);
}

/** 速度一帧: 向目标趋近, 减速用 160ms, 加速用 280ms. */
export function driftSpeedStep(v: number, target: number, dtMs: number): number {
  return approach(v, target, dtMs, target === 0 ? DRIFT_STOP_TAU_MS : DRIFT_GO_TAU_MS);
}

/** 列偏移按一份内容高 span 取模到 (-span, 0]. span 不大于 0 时不取模. */
export function driftWrap(offset: number, span: number): number {
  if (span <= 0) return offset;
  const w = offset % span;
  return w > 0 ? w - span : w;
}
