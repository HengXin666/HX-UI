import { CLOCK_DRIVER } from "../../constants/motion-recipe";

/**
 * 统一时钟的纯函数部分: 四种驱动最后都折成 0..1 的进度.
 * 组件只读进度, 再用 recipeAt (src/motion/recipe.ts) 翻成镜头的段与缓动.
 */

export type ClockDriver = (typeof CLOCK_DRIVER)[keyof typeof CLOCK_DRIVER];

export { CLOCK_DRIVER };

/** 钳到 0..1; NaN 按 0. */
export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return value > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, value));
}

/** view 驱动: 已经过的毫秒数到进度. 时长不正时直接落到 1. */
export function elapsedProgress(elapsedMs: number, durationMs: number): number {
  return durationMs > 0 ? clampUnit(elapsedMs / durationMs) : 1;
}

/** loop 驱动: 循环进度, 每满一个时长回到 0. */
export function loopProgress(elapsedMs: number, durationMs: number): number {
  if (durationMs <= 0) return 1;
  return (((elapsedMs % durationMs) + durationMs) % durationMs) / durationMs;
}

/**
 * scroll 驱动: 元素顶边从视口底边进入记 0, 底边离开视口顶边记 1.
 *
 * @param top 元素顶边到视口顶边的距离 (getBoundingClientRect().top).
 * @param height 元素高度.
 * @param viewport 视口高度.
 */
export function scrollProgress(top: number, height: number, viewport: number): number {
  const travel = viewport + height;
  return travel > 0 ? clampUnit((viewport - top) / travel) : 1;
}
