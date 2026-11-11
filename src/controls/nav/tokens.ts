/**
 * 导航族 (src/controls/nav) 共用的曲线与语义色名; 帧驱动工具转自 src/motion.
 * 每个数字在这里写一次, 组件只引用名字.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
import { FOCUS_RING } from "../../craft/tokens";
import { cssCurve } from "../../motion/curves";

/** 规格的缓出 (0.22, 1, 0.36, 1), 取公共曲线表. */
export const NAV_EASE_OUT = cssCurve("outQuint");
export const PLAIN_EASE = "ease";

export const PX = "px";
export const MS_PER_SECOND = 1000;
export const HALF = 0.5;
export const DOUBLE = 2;
export const BACK = -1;

/** 焦点环: craft 的 FOCUS_RING (outline 1px + 偏移 2px). */
export const NAV_FOCUS = FOCUS_RING;
/** 禁用透明度 0.45, 与控件合同同值. */
export const NAV_DISABLED = "disabled:cursor-not-allowed disabled:opacity-[0.45]";

/** 颜色 props 只收这些语义 token 名, 不收任意色值. */
export type NavTone =
  | "primary"
  | "primary-foreground"
  | "foreground"
  | "background"
  | "muted"
  | "muted-foreground"
  | "secondary"
  | "secondary-foreground"
  | "accent"
  | "accent-foreground"
  | "card"
  | "border"
  | "success"
  | "warning"
  | "destructive";

/** token 名转成 CSS 变量引用. */
export function navTone(tone: NavTone): string {
  return `var(--${tone})`;
}

/** 过渡串, 钳位, 趋近, 缓出, 细分弹簧步与动值表取 src/motion, 族内沿用旧名. */
export { approach, clamp, easeOutCubic, subStepSpring as navStep, transitionOf, type TransitionPart as NavTransition } from "../../motion/drive/glide";
export { MOTION_SNAP as NAV_SNAP, useMotionTable as useNavMotion, type MotionTable as NavMotion } from "../../motion/drive/use-motion-table";
