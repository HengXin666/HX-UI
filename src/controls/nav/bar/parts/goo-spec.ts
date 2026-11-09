/**
 * GooTabs 的规格常数与纯函数: 液滴规划, 液滴轨迹, 黏液滤镜参数, 可复现的随机数.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
import { clamp } from "../../tokens";

/** 规格 MAX_DROPS (GooeyNav.jsx:42): 同时在飞的液滴上限. */
export const GOO_MAX_DROPS = 32;
/** 规格默认 (GooeyNav.jsx:205-223). animationTime 与 timeVariance 以 ms 计, spread 以 px 计. */
export const GOO_DEFAULTS = { animationTime: 600, particleCount: 15, timeVariance: 300, spread: 56, gooeyness: 0.5, wobble: 0.5 } as const;
/** 液滴最短飞行时间 (GooeyNav.jsx:384), 秒. */
export const GOO_MIN_DROP_S = 0.15;
/** 规格的时长构成: base * (0.62 + r * 0.32) + variance * 0.6. */
export const GOO_BASE_FLOOR = 0.62;
export const GOO_BASE_RANGE = 0.32;
export const GOO_VARIANCE_GAIN = 0.6;
/** 目标胶囊在液滴起飞后多久开始长 (GooeyNav.jsx:389): min(时长 / 3, 0.12) 秒. */
export const GOO_CARRY_MAX_S = 0.12;
export const GOO_CARRY_DIV = 3;
/** 悬停块淡入淡出的时间常数 (GooeyNav.jsx:604), ms. */
export const GOO_HOVER_TAU = 80;
/** 文字色过渡 (GooeyNav.css:98), ms. */
export const GOO_COLOR_MS = 200;
/** 液滴直径占条目高度的比例, 飞行中最细处的比例. HX 自定. */
export const GOO_DROP_RATIO = 0.42;
export const GOO_DROP_PINCH = 0.55;
/** 黏液滤镜: 模糊半径 = 2 + gooeyness * 8; 阈值矩阵的 alpha 增益与偏移. HX 自定. */
export const GOO_BLUR_MIN = 2;
export const GOO_BLUR_GAIN = 8;
export const GOO_ALPHA_GAIN = 18;
export const GOO_ALPHA_SHIFT = -7;

/** mulberry32: 给定种子的可复现均匀随机数, 测试与重放结果一致. */
export function gooRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GooDrop {
  /** 飞行时间, 秒. */
  readonly duration: number;
  /** 弧线的垂直鼓出量 px, 正负表示上下. */
  readonly lift: number;
}

/** 一次换选的液滴: 数量钳到 [0, GOO_MAX_DROPS], 时长与鼓出量按规格公式随机. */
export function planDrops(count: number, baseS: number, varianceS: number, spread: number, rand: () => number): GooDrop[] {
  const n = clamp(Math.round(count), 0, GOO_MAX_DROPS);
  return Array.from({ length: n }, () => {
    const duration = Math.max(GOO_MIN_DROP_S, baseS * (GOO_BASE_FLOOR + rand() * GOO_BASE_RANGE) + varianceS * rand() * GOO_VARIANCE_GAIN);
    return { duration, lift: (rand() * 2 - 1) * spread };
  });
}

/** 三次贝塞尔一维求值. */
export function bezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/** 液滴在进度 t 的位置: 从 x0 到 x1, 两个控制点都抬 lift, 首尾落在 y. */
export function dropPoint(t: number, x0: number, x1: number, y: number, lift: number): { x: number; y: number } {
  const dx = x1 - x0;
  const k = clamp(t, 0, 1);
  return { x: bezier(x0, x0 + dx / 3, x0 + (dx * 2) / 3, x1, k), y: bezier(y, y - lift, y - lift, y, k) };
}

/** 液滴直径: 两端为 size, 飞到一半最细 (size * GOO_DROP_PINCH). */
export function dropSize(t: number, size: number): number {
  const k = clamp(t, 0, 1);
  return size * (GOO_DROP_PINCH + (1 - GOO_DROP_PINCH) * Math.abs(1 - 2 * k));
}

/** 黏液滤镜参数: 模糊半径与 feColorMatrix 的 values. */
export function gooFilter(gooeyness: number): { blur: number; matrix: string } {
  const g = clamp(gooeyness, 0, 1);
  return { blur: GOO_BLUR_MIN + g * GOO_BLUR_GAIN, matrix: `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${GOO_ALPHA_GAIN} ${GOO_ALPHA_SHIFT}` };
}
