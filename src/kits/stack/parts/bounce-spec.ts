/**
 * SpreadCards 的规格常数与纯函数: 扇形摆位, 悬停推开, 入场错峰, 两档弹簧.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
import { bounceSpring } from "../tokens";

export const BOUNCE_DEFAULTS = {
  containerWidth: 400,
  containerHeight: 400,
  cardSize: 200,
  spread: 85,
  rotation: 10,
  arc: 0,
  animationDelay: 0.5,
  animationStagger: 0.06,
  bounciness: 0.6,
  pushDistance: 160,
  hoverScale: 1.06,
  borderWidth: 5,
  radius: 25,
} as const;
/** 入场弹出劲度 170, 悬停换位劲度 210 (规格 stiffness=170 / 210). */
export const BOUNCE_POP_STIFFNESS = 170;
export const BOUNCE_HOVER_STIFFNESS = 210;
/** 阴影过渡 0.3s ease (BounceCards.css:19). */
export const BOUNCE_SHADOW_MS = 300;
/**
 * 各卡转角的交替系数, 乘 rotation (规格 PATTERN 的形状: 两侧外翻, 中间微歪). 按序号循环取.
 */
export const BOUNCE_PATTERN = [1, 0.5, -0.3, -1, 0.2] as const;

export function popSpring(bounciness: number): ReturnType<typeof bounceSpring> {
  return bounceSpring(BOUNCE_POP_STIFFNESS, bounciness);
}
export function hoverSpring(bounciness: number): ReturnType<typeof bounceSpring> {
  return bounceSpring(BOUNCE_HOVER_STIFFNESS, bounciness);
}

export interface BouncePose {
  readonly x: number;
  readonly y: number;
  readonly rotate: number;
  readonly scale: number;
}

/** 第 i 张 (共 n 张) 的静止姿态: 以中间为 0 横向错开 spread, 按 PATTERN 转角, arc 让两侧沿抛物线下沉. */
export function restPose(i: number, n: number, spread: number, rotation: number, arc: number): BouncePose {
  const o = i - (n - 1) / 2;
  const k = BOUNCE_PATTERN[i % BOUNCE_PATTERN.length] ?? 0;
  return { x: o * spread, y: arc * o * o, rotate: k * rotation, scale: 1 };
}

/** 悬停 hot 时第 i 张的姿态: hot 本身摆正放大, 左右两边各推开 pushDistance. hot < 0 为无悬停. */
export function hoverPose(i: number, hot: number, rest: BouncePose, pushDistance: number, hoverScale: number): BouncePose {
  if (hot < 0) return rest;
  if (i === hot) return { ...rest, rotate: 0, scale: hoverScale };
  return { ...rest, x: rest.x + Math.sign(i - hot) * pushDistance };
}

/** 第 i 张的入场延迟 ms. */
export function popDelay(i: number, delay: number, stagger: number): number {
  return (Math.max(0, delay) + i * Math.max(0, stagger)) * 1000;
}
