/**
 * 画廊族 (src/kits/gallery) 共用的名字: 曲线, 语义色, 过渡串, 弹簧积分步与动值循环.
 * 导航族已有同一套工具, 这里只转出并补本族自己的常数; 收口时两族一起并进 src/motion.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
import { cssCurve } from "../../motion/curves";

export { approach, clamp, easeOutCubic, navStep as kitStep, navTone as kitTone, transitionOf, PLAIN_EASE, type NavTone as KitTone, type NavTransition as KitTransition } from "../../controls/nav/tokens";
export { useNavMotion as useKitMotion, type NavMotion as KitMotion } from "../../controls/nav/parts/use-nav-motion";
export { FOCUS_RING as KIT_FOCUS } from "../../craft/tokens";

/** GSAP power3.out. */
export const KIT_OUT = cssCurve("outQuart");
/** 规格的 (0.22, 1, 0.36, 1). */
export const KIT_OUT_LONG = cssCurve("outQuint");
export const MS_PER_S = 1000;
/** 拖拽起算阈值 px, 规格 DRAG_THRESHOLD. */
export const DRAG_THRESHOLD_PX = 5;

/** 循环取模到 [0, n). */
export function wrapIndex(i: number, n: number): number {
  if (n <= 0) return 0;
  return ((i % n) + n) % n;
}

/** 环上最近的有符号差: 从 from 走到 to 的最短步数, 落在 (-n/2, n/2]. */
export function ringDelta(from: number, to: number, n: number): number {
  if (n <= 0) return 0;
  const d = wrapIndex(to - from, n);
  return d > n / 2 ? d - n : d;
}

/** smoothstep, 与规格同式. */
export function smoothstep(lo: number, hi: number, x: number): number {
  if (hi === lo) return x < lo ? 0 : 1;
  const t = Math.min(1, Math.max(0, (x - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
}
