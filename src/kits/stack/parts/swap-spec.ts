/**
 * CycleDeck 的规格常数与纯函数: 纵深槽位, 轮换错峰, 甩出判定, 指针视差.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
import { TAU, clamp, omegaSpring } from "../tokens";

/** 透视距 px, 离场时越出卡片下沿的余量 px (CardSwap.jsx:65-68). */
export const SWAP_PERSPECTIVE = 900;
export const SWAP_PAD = 32;
/** 轮换间隔下限 400ms (CardSwap.jsx:449). */
export const SWAP_MIN_DELAY_MS = 400;
/** 甩出: 拖过卡片短边的 0.3, 或速度超过 700px/s (CardSwap.jsx:625). */
export const SWAP_SWIPE_RATIO = 0.3;
export const SWAP_FLING = 700;
/** 挂载时整台淡入 420ms ease-out (CardSwap.jsx:686). */
export const SWAP_INTRO_MS = 420;
export const SWAP_DEFAULTS = { width: 360, height: 260, cardDistance: 60, verticalDistance: 70, delay: 4000, skew: 6, speed: 1 } as const;
/** 张开度弹簧 omega 2pi x 1.4, zeta 0.9; 视差弹簧 2pi x 1.1, zeta 1 (CardSwap.jsx:367-369). */
export const SWAP_SPREAD_SPRING = omegaSpring(TAU * 1.4, 0.9);
export const SWAP_PARALLAX_SPRING = omegaSpring(TAU * 1.1, 1);
/** 离场与归位弹簧: 规格的 exitOmega / restOmega / restZeta 未给数值, HX 自定. 离场临界阻尼, 归位带一点回弹. */
export const SWAP_EXIT_OMEGA = TAU * 1.6;
export const SWAP_REST_OMEGA = TAU * 1.2;
export const SWAP_REST_ZETA = 0.72;
/** 离场多久后换到底部, ms (HX 自定); 悬停张开到 1.15 倍 (HX 自定); 视差满幅 8 度 (HX 自定). */
export const SWAP_EXIT_MS = 450;
export const SWAP_HOVER_SPREAD = 1.15;
export const SWAP_TILT_DEG = 8;

export function swapSprings(speed: number): { readonly exit: ReturnType<typeof omegaSpring>; readonly rest: ReturnType<typeof omegaSpring> } {
  const k = Math.max(0.1, speed);
  return { exit: omegaSpring(SWAP_EXIT_OMEGA * k, 1), rest: omegaSpring(SWAP_REST_OMEGA * k, SWAP_REST_ZETA) };
}

/** 每张错峰秒数 0.05 / speed (CardSwap.jsx:467). */
export function swapStagger(speed: number): number {
  return 0.05 / Math.max(0.1, speed);
}

export interface SwapSlot {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** 第 k 层 (0 为最前) 的位置: 向右上, 向后错开, 乘张开度. */
export function swapSlot(k: number, cardDistance: number, verticalDistance: number, spread: number): SwapSlot {
  return { x: k * cardDistance * spread, y: -k * verticalDistance * spread, z: -k * cardDistance * 1.5 * spread };
}

/** 松手是否换牌. speed 为 px/s. */
export function swapShouldCycle(dx: number, dy: number, speedPxS: number, width: number, height: number): boolean {
  return Math.hypot(dx, dy) > Math.min(width, height) * SWAP_SWIPE_RATIO || speedPxS > SWAP_FLING;
}

/** 指针在台面上的归一化位置, 中心为 0, 边缘为 ±1. */
export function swapPointer(x: number, y: number, width: number, height: number): readonly [number, number] {
  if (width <= 0 || height <= 0) return [0, 0];
  return [clamp((x / width) * 2 - 1, -1, 1), clamp((y / height) * 2 - 1, -1, 1)];
}
