/**
 * PosterFlight 的规格常数与纯函数: 帧率无关跟随, 速度与倾斜平滑, 海报在视口中的进度与姿态.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
import { smoothstep } from "../tokens";

/** 规格默认 (FlyingPosters.jsx:133-156). 长度 px. */
export const POSTER_DEFAULTS = {
  planeWidth: 320,
  planeHeight: 320,
  distortion: 3,
  scrollEase: 0.01,
  columns: 1,
  columnGap: 40,
  rotation: 180,
  speed: 0,
  lean: 0,
  fade: 0,
} as const;
/** 规格的速度与倾斜平滑率 (每秒, FlyingPosters.jsx:476, 478). */
export const POSTER_VELOCITY_RATE = 8;
export const POSTER_LEAN_RATE = 6;
/** 规格旋转轴 (FlyingPosters.jsx:112): 竖轴转 rotateY, 横轴转 rotateX, 对角两轴同转. */
export type PosterAxis = "vertical" | "horizontal" | "diagonal";
/** 规格 gap 未给默认时取海报高的 1/4. HX 自定. */
export const POSTER_GAP_RATIO = 0.25;
/** 速度 (px/s) 到斜切角的换算: distortion × 速度 / 该值 deg. HX 自定 (规格在着色器里弯曲). */
export const POSTER_SKEW_UNIT = 400;
/** 斜切与倾斜上限 deg. HX 自定. */
export const POSTER_MAX_DEG = 20;
/** 滚轮与拖拽每 px 推进的目标 px. */
export const POSTER_INPUT_GAIN = 1;
const MS_PER_S = 1000;

/** 指数平滑一帧: 1 - exp(-rate × dt). */
export function smoothRate(current: number, target: number, rate: number, dtMs: number): number {
  return current + (target - current) * (1 - Math.exp((-rate * dtMs) / MS_PER_S));
}

/** 海报在长 total 的循环带上, 相对视口中心的位置 y, 落在 (-total/2, total/2]. */
export function posterY(base: number, scroll: number, total: number): number {
  if (total <= 0) return base - scroll;
  let y = (((base - scroll) % total) + total) % total;
  if (y > total / 2) y -= total;
  return y;
}

/** 位置 y 在视口半高 half 下的姿态: 旋转随进度从 -rotation/2 到 rotation/2, 边缘按 fade 渐隐. */
export function posterPose(y: number, half: number, rotation: number, axis: PosterAxis, fade: number): { rotate: string; opacity: number } {
  const p = half > 0 ? Math.max(-1, Math.min(1, y / half)) : 0;
  const deg = (p * rotation) / 2;
  const rotate = axis === "horizontal" ? `rotateX(${deg}deg)` : axis === "diagonal" ? `rotateX(${deg}deg) rotateY(${deg}deg)` : `rotateY(${deg}deg)`;
  const opacity = fade > 0 ? 1 - smoothstep(1 - fade, 1, Math.abs(p)) : 1;
  return { rotate, opacity };
}

/** 速度 (px/s) 到斜切角. */
export function posterSkew(velocity: number, distortion: number): number {
  const deg = (distortion * velocity) / POSTER_SKEW_UNIT;
  return Math.max(-POSTER_MAX_DEG, Math.min(POSTER_MAX_DEG, deg));
}
