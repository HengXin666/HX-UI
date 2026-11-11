/**
 * kits 各族 (gallery / stack / glass / card / stage3d) 共用的名字, 原先在导航族 -> 画廊 -> 叠放 -> 玻璃 / 卡片层层转出.
 * 帧驱动工具直接取 src/motion; 本文件只放 kits 自己的常数与换算.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
import type { SpringSpec } from "../craft/spring";
import { cssCurve } from "../motion/curves";

export { approach, clamp, easeOutCubic, subStepSpring as kitStep, transitionOf, type TransitionPart as KitTransition } from "../motion/drive/glide";
export { useMotionTable as useKitMotion, type MotionTable as KitMotion } from "../motion/drive/use-motion-table";
export { navTone as kitTone, PLAIN_EASE, type NavTone as KitTone } from "../controls/nav/tokens";
export { FOCUS_RING as KIT_FOCUS } from "../craft/tokens";

/** GSAP power3.out. */
export const KIT_OUT = cssCurve("outQuart");
/** 规格的 (0.22, 1, 0.36, 1). */
export const KIT_OUT_LONG = cssCurve("outQuint");
export const MS_PER_S = 1000;
export const TAU = Math.PI * 2;
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

/** 规格的 omega (rad/s) 与阻尼比 zeta 换成 craft 弹簧: 质量 1, 劲度 omega^2, 阻尼 2 zeta omega. */
export function omegaSpring(omega: number, zeta: number): SpringSpec {
  return { stiffness: omega * omega, damping: 2 * zeta * omega, mass: 1 };
}

/** 规格的 "劲度 + 回弹度" 写法: 阻尼 2 (1 - 0.85 bounciness) sqrt(stiffness), bounciness 钳到 [0, 1]. */
export function bounceSpring(stiffness: number, bounciness: number): SpringSpec {
  const b = Math.min(1, Math.max(0, bounciness));
  return { stiffness, damping: 2 * (1 - 0.85 * b) * Math.sqrt(stiffness), mass: 1 };
}
