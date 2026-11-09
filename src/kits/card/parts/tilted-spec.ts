/**
 * TiltCard 的规格常数与纯函数: 各弹簧, 点击判定阈值, 提示框的跟随与甩动倾角.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
import { clamp, omegaSpring } from "../tokens";

export const TILTED_DEFAULTS = { scaleOnHover: 1.05, rotateAmplitude: 12, overlayDepth: 30, radius: 15, perspective: 800, smoothness: 0.6, glare: 0.5, shadow: 0.5 } as const;
/** 按下后移动不超过 6px 才算点击翻面 (TiltedCard.jsx:6 FLIP_THRESHOLD). */
export const TILTED_FLIP_THRESHOLD = 6;
/** 翻面 omega 9.5 zeta 0.72; 按压 26 / 0.8; 提示框显隐 16 / 1; 提示框甩动 18 / 0.62 (TiltedCard.jsx:221-268). */
export const TILTED_FLIP = omegaSpring(9.5, 0.72);
export const TILTED_PRESS = omegaSpring(26, 0.8);
export const TILTED_SHOWN = omegaSpring(16, 1);
export const TILTED_TIP = omegaSpring(18, 0.62);
/** 提示框跟指针 tau 0.035s; 指针速度衰减 tau 0.08s; 甩动角 = -vx × 0.012, 钳到 ±14 度 (TiltedCard.jsx:263-268). */
export const TILTED_TOOLTIP_S = 0.035;
export const TILTED_VX_DECAY_S = 0.08;
export const TILTED_TIP_GAIN = 0.012;
export const TILTED_TIP_MAX = 14;
/** 入场淡入 0.45s (TiltedCard.jsx:224). */
export const TILTED_FADE_S = 0.45;
/** 按压时缩小量 (规格未摘录, HX 自定). */
export const TILTED_PRESS_SHRINK = 0.03;

/** 托起弹簧: 用倾斜同一 omega, zeta 至少 0.85 (TiltedCard.jsx:220). */
export function liftSpring(omega: number, zeta: number): ReturnType<typeof omegaSpring> {
  return omegaSpring(omega, Math.max(zeta, 0.85));
}

export function tipAngle(vx: number): number {
  return clamp(0 - vx * TILTED_TIP_GAIN, 0 - TILTED_TIP_MAX, TILTED_TIP_MAX);
}

/** 按下到松开移动距离判定点击. */
export function isTap(dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) <= TILTED_FLIP_THRESHOLD;
}
