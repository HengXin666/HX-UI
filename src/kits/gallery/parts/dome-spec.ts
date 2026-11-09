/**
 * SphereWall 的规格常数与纯函数: 球面上的格位, 半径, 拖拽惯性.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */

/** 规格默认 (DomeGallery.jsx:111-127, 269). 规格 DEFAULTS 的值未进目录, 标 HX 的为本库自定. */
export const DOME_DEFAULTS = {
  fit: 0.5,
  minRadius: 600,
  dragDampening: 2,
  /** HX: 每 px 拖拽转多少度. */
  dragSensitivity: 0.2,
  /** HX: 竖向最多转多少度. */
  maxVerticalRotationDeg: 8,
  /** HX: 一圈多少列. */
  segments: 20,
  /** HX: 放大过渡 ms. */
  enlargeTransitionMs: 300,
} as const;
/** 规格 MAX_V: 松手速度上限 px/ms. */
export const DOME_MAX_V = 1.4;
/** 惯性停止阈值 deg/ms. HX 自定. */
export const DOME_REST_V = 0.0005;
/** 纬度带数: 赤道上下各两带. HX 自定. */
export const DOME_BANDS = 5;
const FULL = 360;
/** 纬度带间距上限 deg, 防止列数少时带越过两极. HX 自定. */
export const DOME_LAT_MAX_STEP = 30;
const HALF = 2;

export interface DomeCell {
  readonly lon: number;
  readonly lat: number;
  /** 取哪张图. */
  readonly image: number;
}

/** 球面格位: segments 列 × DOME_BANDS 带, 带距取列距与 30 度的较小者, 相邻带错开半格, 图片按顺序循环填满. */
export function domeCells(segments: number, images: number): DomeCell[] {
  const cells: DomeCell[] = [];
  if (segments <= 0 || images <= 0) return cells;
  const step = FULL / segments;
  const latStep = Math.min(step, DOME_LAT_MAX_STEP);
  const mid = Math.floor(DOME_BANDS / HALF);
  for (let b = 0; b < DOME_BANDS; b += 1) {
    for (let c = 0; c < segments; c += 1) {
      const lon = c * step + ((b - mid) % HALF ? step / HALF : 0);
      cells.push({ lon, lat: (b - mid) * latStep, image: cells.length % images });
    }
  }
  return cells;
}

/** 半径: 容器较短边乘 fit, 夹在 [minRadius, maxRadius]. */
export function domeRadius(width: number, height: number, fit: number, minRadius: number, maxRadius: number): number {
  const base = Math.min(width, height) * fit;
  return Math.min(maxRadius, Math.max(minRadius, base));
}

/** 惯性一帧: 速度按 exp(-dampening × dt) 衰减 (dt 秒). */
export function domeDecay(v: number, dampening: number, dtMs: number): number {
  return v * Math.exp((-dampening * dtMs) / 1000);
}

/** 松手速度夹到 ±MAX_V. */
export function domeFling(v: number): number {
  return Math.max(-DOME_MAX_V, Math.min(DOME_MAX_V, v));
}
