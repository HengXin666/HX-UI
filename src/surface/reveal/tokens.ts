// 行为规格参照 docs/research/catalog/animations.md 的 PixelSwap, PixelTransition, ScrollExpand, GradualBlur 条目, 实现为 HX 自有.
/**
 * reveal 族 (切换与显露) 的手感合同. 数值是规格条目的常数与 props 默认值, 注释写原规格名;
 * 规格没给的数标 "本库定".
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-reveal.md
 */

export const HALF = 0.5;
export const PERCENT = 100;
export const MS_PER_S = 1000;
/** 一帧最长 50ms. */
export const MAX_DT_MS = 50;

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 与着色器同义的平滑阶跃. */
export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0 || Number.EPSILON), 0, 1);
  return t * t * (3 - 2 * t);
}

/** 由格子坐标得到稳定的 0..1 噪声, 同一格每次一样. */
export function cellNoise(col: number, row: number, seed = 0): number {
  let h = Math.imul(col + 1, 374761393) ^ Math.imul(row + 1, 668265263) ^ Math.imul(seed + 1, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/* ── TileFlip (规格 PixelSwap) ── */
export const TILE = {
  /** 方块总数上限 (MAX_PIXELS), 超了就放大格子. */
  maxPixels: 600,
  /** 方块放大的系数与上限: size = min(x * 1.08, 1.25) * (...). */
  grow: 1.08,
  growCap: 1.25,
  /** 方块在 0.6 到 0.93 之间并到邻格, 圆角同步收掉. */
  mergeFrom: 0.6,
  mergeTo: 0.93,
  /** 并格时多出的重叠, 以格宽为单位 (本库定), 保证缝合. */
  overlap: 0.02,
  pixelSize: 48,
  duration: 400,
  pixelDuration: 350,
  randomness: 0.2,
  bounce: 0.3,
  aspectRatio: "16 / 10",
} as const;

/* ── MosaicSwap (规格 PixelTransition) ── */
export const MOSAIC = {
  /** 每块自己的过渡窗口占整段的比例 (WINDOW). */
  window: 0.35,
  /** 4x4 有序抖动矩阵的级数 (LEVELS). */
  levels: 16,
  /** 时长下限 (秒). */
  minDurationS: 0.05,
  gridSize: 10,
  stepDuration: 0.4,
  randomness: 0.3,
} as const;

/** 4x4 Bayer 矩阵 (BAYER), dither 图案的起步顺序. */
export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5] as const;

/* ── ScrollWiden (规格 ScrollExpand) ── */
export const WIDEN = {
  /** 展开曲线 smoothstep(0, 1, p); 标题在 0.4 到 0.88 淡出; 提示在 0 到 0.12 消失; 后续内容在 0.68 到 1 进场. */
  titleOut: [0.4, 0.88],
  hintGone: [0, 0.12],
  contentIn: [0.68, 1],
  /** 标题淡出时上移的距离 (px, 本库定). */
  titleLift: 24,
  startWidth: 42,
  startHeight: 58,
  startRadius: 24,
  endRadius: 0,
  mediaZoom: 1.35,
  scrollDistance: 1.2,
  holdDistance: 0.35,
  smoothing: 0.1,
  overlayScrim: 0.45,
} as const;

/* ── EdgeBlur (规格 GradualBlur) ── */
export const EDGE_BLUR = {
  /** 每层最大模糊为 strength 乘这个 px (本库定). */
  blurUnit: 4,
  /** 指数分布的底数次幂跨度 (本库定): 2^(4t) - 1 归一化. */
  expSpan: 4,
  height: "6rem",
  strength: 2,
  layers: 8,
  duration: 0.3,
  hoverIntensity: 1,
} as const;

/** 规格的四条曲线 (CURVES). */
export const EDGE_CURVES = {
  linear: (t: number): number => t,
  bezier: (t: number): number => t * t * (3 - 2 * t),
  "ease-in": (t: number): number => t * t,
  "ease-out": (t: number): number => 1 - (1 - t) * (1 - t),
  "ease-in-out": (t: number): number => (t < HALF ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
} as const;

export type EdgeCurve = keyof typeof EDGE_CURVES;
