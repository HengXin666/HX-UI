/**
 * 按压族 (src/controls/press) 共用的时长, 曲线和过渡串拼装.
 * 每个数字在这里写一次, 组件只引用名字.
 */

import { cssCurve } from "../../motion/curves";

/** 按压与抖动曲线取公共曲线表 CURVE (outStrong, inOutQuart), 族内不留副本. */
export const PRESS_EASE_OUT = cssCurve("outStrong");
export const SHAKE_EASE = cssCurve("inOutQuart");
export const PLAIN_EASE = "ease";
export const LINEAR_EASE = "linear";

/** 按下缩放的过渡时长, 七件都用. */
export const PRESS_FEEDBACK_MS = 160;
/** 标签, 透明度, 滤镜和底色的常规淡变. */
export const FADE_MS = 200;
/** 底色的快速变化. */
export const QUICK_MS = 120;

/** 抖动的归一化位移序列, 乘以各组件自己的幅度. 规格只给了名字 SHAKE, 序列由本库定. */
export const SHAKE_STEPS = [0, -1, 0.8, -0.6, 0.4, -0.2, 0] as const;

export const MS_PER_SECOND = 1000;
/** press 族 "时长 + bounce" 换算的固有频率区间 (rad/s), 并入 src/motion 前即如此. */
export const PRESS_FIT = { omegaRange: [0.1, 2000] } as const;
export const PERCENT = 100;
export const HALF = 0.5;
export const DOUBLE = 2;

/** 一条 CSS 过渡: 属性, 时长 ms, 曲线, 可选延迟 ms. */
export type TransitionPart = readonly [property: string, ms: number, easing: string, delayMs?: number];

/**
 * 拼 transition 串. 只列具体属性, 从不写 all. 减弱动效时返回 none, 状态直接落到终值.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-press.md
 */
export function transitionOf(parts: readonly TransitionPart[], reduced: boolean): string {
  if (reduced) return "none";
  return parts.map(([property, ms, easing, delayMs]) => `${property} ${ms}ms ${easing}${delayMs ? ` ${delayMs}ms` : ""}`).join(", ");
}

/** 钳到 [lo, hi]. */
export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** 抖动关键帧. composite add 叠在当前 transform 上, 不清掉按下缩放. */
export function shakeFrames(amplitudePx: number): Keyframe[] {
  return SHAKE_STEPS.map((k) => ({ transform: `translateX(${k * amplitudePx}px)`, easing: SHAKE_EASE }));
}
