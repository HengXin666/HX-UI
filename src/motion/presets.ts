"use client";

import { useReducedMotion, type Transition, type Variants } from "motion/react";
import { useMemo } from "react";
import { HALF_DIVISOR } from "../constants";
import {
  CUBIC_BEZIER_POINTS,
  MOTION_DISTANCE,
  MOTION_DURATION_FALLBACK_MS,
  MOTION_DURATION_TOKEN,
  MOTION_EASE_FALLBACK,
  MOTION_EASE_TOKEN,
  MOTION_PRESET_NAME,
  MOTION_TIMING,
  MS_PER_SECOND,
  SPRING_TYPE,
} from "../constants/motion";
import { BEZIER_SEPARATOR, SPRING_DAMPING, SPRING_MASS, SPRING_STIFFNESS } from "../constants/polish";

/**
 * 三档物理弹簧. soft 用于数字与大面积位移, snappy 用于按压与小控件, bouncy 只给需要俏皮感的强调.
 * 弹簧没有时长, 所以不读时长令牌; 减弱动效时由调用方换成 INSTANT.
 *
 * .agents/notes/implemented/feature/2026-11-01-motion-engine.md
 */
export const SPRING = {
  soft: { type: SPRING_TYPE, stiffness: SPRING_STIFFNESS.soft, damping: SPRING_DAMPING.soft, mass: SPRING_MASS.soft },
  snappy: { type: SPRING_TYPE, stiffness: SPRING_STIFFNESS.snappy, damping: SPRING_DAMPING.snappy, mass: SPRING_MASS.snappy },
  bouncy: { type: SPRING_TYPE, stiffness: SPRING_STIFFNESS.bouncy, damping: SPRING_DAMPING.bouncy, mass: SPRING_MASS.bouncy },
} as const satisfies Record<string, Transition>;

export type SpringName = keyof typeof SPRING;

/** 减弱动效时的过渡: 直接落到终态, 不插值. */
export const INSTANT: Transition = { duration: 0 };

/**
 * 变体预设. 只描述 "从哪来到哪去", 不带时长; 时长与缓动由 useMotionTiming 从令牌读出后合成.
 * 离场位移取入场的一半, 让退出比进入更轻, 不抢下一屏的注意力.
 */
export const MOTION_PRESETS = {
  [MOTION_PRESET_NAME.fade]: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  [MOTION_PRESET_NAME.fadeUp]: {
    hidden: { opacity: 0, y: MOTION_DISTANCE.rise },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -MOTION_DISTANCE.rise / HALF_DIVISOR },
  },
  [MOTION_PRESET_NAME.fadeDown]: {
    hidden: { opacity: 0, y: -MOTION_DISTANCE.rise },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: MOTION_DISTANCE.rise / HALF_DIVISOR },
  },
  [MOTION_PRESET_NAME.scaleIn]: {
    hidden: { opacity: 0, scale: MOTION_DISTANCE.scaleFrom },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: MOTION_DISTANCE.scaleFrom },
  },
  [MOTION_PRESET_NAME.blurIn]: {
    hidden: { opacity: 0, filter: MOTION_DISTANCE.blur },
    visible: { opacity: 1, filter: MOTION_DISTANCE.sharp },
    exit: { opacity: 0, filter: MOTION_DISTANCE.blur },
  },
  [MOTION_PRESET_NAME.slideLeft]: {
    hidden: { opacity: 0, x: MOTION_DISTANCE.slide },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -MOTION_DISTANCE.slide / HALF_DIVISOR },
  },
  [MOTION_PRESET_NAME.slideRight]: {
    hidden: { opacity: 0, x: -MOTION_DISTANCE.slide },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: MOTION_DISTANCE.slide / HALF_DIVISOR },
  },
} as const satisfies Record<string, Variants>;

export type MotionPresetName = keyof typeof MOTION_PRESETS;
export type MotionTiming = (typeof MOTION_TIMING)[keyof typeof MOTION_TIMING];
type BezierPoints = [number, number, number, number];

/** 根元素的计算样式. 服务端渲染与测试环境没有 document, 返回 undefined 走回退. */
function rootStyle(): CSSStyleDeclaration | undefined {
  const doc = globalThis.document;
  if (!doc?.documentElement || !globalThis.getComputedStyle) return undefined;
  return globalThis.getComputedStyle(doc.documentElement);
}

/** 读时长令牌并换成秒. 支持 ms 与 s 两种写法, 读不到或解析失败时用回退值. */
function readSeconds(style: CSSStyleDeclaration | undefined, token: string, fallbackMs: number): number {
  const raw = style?.getPropertyValue(token).trim() ?? "";
  const value = Number.parseFloat(raw);
  if (!raw || Number.isNaN(value)) return fallbackMs / MS_PER_SECOND;
  return raw.endsWith("ms") ? value / MS_PER_SECOND : value;
}

/** 读缓动令牌. 只认 cubic-bezier(a, b, c, d); linear() 与关键字退回回退值. */
function readBezier(style: CSSStyleDeclaration | undefined, token: string, fallback: readonly number[]): BezierPoints {
  const raw = style?.getPropertyValue(token).trim() ?? "";
  const inner = /^cubic-bezier\(([^)]+)\)$/.exec(raw)?.[1];
  const points = inner?.split(BEZIER_SEPARATOR).map((part) => Number.parseFloat(part)) ?? [];
  const valid = points.length === CUBIC_BEZIER_POINTS && points.every((n) => Number.isFinite(n));
  return (valid ? points : [...fallback]) as BezierPoints;
}

/** 从令牌读出的整套时长 (s) 与缓动. */
export interface MotionTokens {
  readonly duration: Record<keyof typeof MOTION_DURATION_TOKEN, number>;
  readonly ease: Record<keyof typeof MOTION_EASE_TOKEN, BezierPoints>;
}

/** 一次性读出全部动效令牌. 在渲染期调用安全: 只读不写, 服务端得到回退值. */
export function readMotionTokens(): MotionTokens {
  const style = rootStyle();
  const duration = {} as Record<keyof typeof MOTION_DURATION_TOKEN, number>;
  for (const key of Object.keys(MOTION_DURATION_TOKEN) as Array<keyof typeof MOTION_DURATION_TOKEN>) {
    duration[key] = readSeconds(style, MOTION_DURATION_TOKEN[key], MOTION_DURATION_FALLBACK_MS[key]);
  }
  const ease = {} as Record<keyof typeof MOTION_EASE_TOKEN, BezierPoints>;
  for (const key of Object.keys(MOTION_EASE_TOKEN) as Array<keyof typeof MOTION_EASE_TOKEN>) {
    ease[key] = readBezier(style, MOTION_EASE_TOKEN[key], MOTION_EASE_FALLBACK[key]);
  }
  return { duration, ease };
}

/** 按节奏名合成过渡. 进入 slow + ease-out, 离场 fast + ease-in, 强调 emphasized 一对. */
export function timingTransition(tokens: MotionTokens, timing: MotionTiming, delay = 0): Transition {
  if (timing === MOTION_TIMING.exit) return { duration: tokens.duration.fast, ease: tokens.ease.in, delay };
  if (timing === MOTION_TIMING.emphasized) return { duration: tokens.duration.emphasized, ease: tokens.ease.emphasized, delay };
  return { duration: tokens.duration.slow, ease: tokens.ease.out, delay };
}

/**
 * 把预设与节奏合成可直接交给 motion 的变体: visible 带进入过渡, exit 带离场过渡.
 * reduced 为真时三态都换成 INSTANT, 保留 hidden 的初值让服务端与客户端首帧一致.
 */
export function presetVariants(
  preset: MotionPresetName,
  tokens: MotionTokens,
  options: { timing?: MotionTiming; delay?: number; reduced?: boolean } = {},
): Variants {
  const base = MOTION_PRESETS[preset];
  const enter = options.reduced ? INSTANT : timingTransition(tokens, options.timing ?? MOTION_TIMING.enter, options.delay);
  const leave = options.reduced ? INSTANT : timingTransition(tokens, MOTION_TIMING.exit);
  return {
    hidden: base.hidden,
    visible: { ...base.visible, transition: enter },
    exit: { ...base.exit, transition: leave },
  };
}

/** 组件内取令牌与减弱动效状态. 令牌只在挂载时读一次; 减弱动效随系统设置实时切换. */
export function useMotionTokens(): { tokens: MotionTokens; reduced: boolean } {
  const reduced = useReducedMotion() === true;
  const tokens = useMemo(readMotionTokens, []);
  return { tokens, reduced };
}
