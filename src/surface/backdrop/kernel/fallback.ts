// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.
import { cssColorOf } from "./color";

/** WebGL 不可用时兜底渐变的默认角度. */
export const FALLBACK_ANGLE = 160;
const EMPTY_FALLBACK = "var(--background)";

/**
 * WebGL 不可用时的 CSS 渐变: 颜色 prop 原样换成 var(--token) 或用户色值, 不在 JS 里算色.
 *
 * @param colors 颜色 prop 列表.
 * @param angle 渐变角度 (度).
 */
export function fallbackGradient(colors: readonly string[], angle: number = FALLBACK_ANGLE): string {
  const stops = colors.map(cssColorOf);
  if (stops.length === 0) return EMPTY_FALLBACK;
  if (stops.length === 1) return stops[0];
  return `linear-gradient(${angle}deg, ${stops.join(", ")})`;
}

/**
 * 暗底加一团居中光晕的兜底, 给以发光为主的场 (光柱, 闪电, 眼睛) 用.
 *
 * @param base 底色 prop.
 * @param glow 光色 prop.
 */
export function glowFallback(base: string, glow: string): string {
  return `radial-gradient(ellipse at 50% 45%, color-mix(in srgb, ${cssColorOf(glow)} 45%, transparent), transparent 70%), ${cssColorOf(base)}`;
}
