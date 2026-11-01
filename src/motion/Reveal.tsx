"use client";

import { motion, type UseInViewOptions } from "motion/react";
import type { JSX, ReactNode } from "react";
import { MOTION_PRESET_NAME, MOTION_STATE, MOTION_TAG, MOTION_TIMING, REVEAL_VIEWPORT } from "../constants/motion";
import { presetVariants, useMotionTokens, type MotionPresetName, type MotionTiming } from "./presets";

/** 可选的包裹标签对应的 motion 组件. 只开放块级与列表项, 行内动画请用 FadeSwap. */
export const MOTION_ELEMENTS = {
  [MOTION_TAG.div]: motion.div,
  [MOTION_TAG.section]: motion.section,
  [MOTION_TAG.article]: motion.article,
  [MOTION_TAG.li]: motion.li,
  [MOTION_TAG.ul]: motion.ul,
  [MOTION_TAG.span]: motion.span,
} as const;

export type MotionTag = keyof typeof MOTION_ELEMENTS;

export interface RevealProps {
  children: ReactNode;
  /** 入场预设. 默认 fadeUp. */
  preset?: MotionPresetName;
  /** 节奏: enter (默认, slow + ease-out) 或 emphasized (首屏大标题). */
  timing?: MotionTiming;
  /** 延迟 (s). 同屏多块依次出现时使用; 一组同类子项请改用 Stagger. */
  delay?: number;
  /** 只播一次. 默认 true; 设为 false 时滚出视口会复位, 再次进入重播. */
  once?: boolean;
  /** 露出比例达到多少才触发, 0 到 1. */
  amount?: number;
  /** 视口边距, 同 IntersectionObserver 的 rootMargin. */
  margin?: UseInViewOptions["margin"];
  /** 包裹标签. 默认 div. */
  as?: MotionTag;
  className?: string;
}

/**
 * 进入视口时播放一次入场动画.
 *
 * 用 whileInView 而不是 useInView + 手动 animate: 观察器的创建与销毁由 motion 管理, 列表里
 * 几十个 Reveal 共享同一套调度. 首帧固定渲染 hidden 态, 服务端与客户端一致不触发水合告警;
 * 减弱动效 (useMotionTokens 内的 useReducedMotion) 时过渡换成 0 时长, 元素进视口即刻落到终态.
 */
export function Reveal({
  children,
  preset = MOTION_PRESET_NAME.fadeUp,
  timing = MOTION_TIMING.enter,
  delay = 0,
  once = true,
  amount = REVEAL_VIEWPORT.amount,
  margin = REVEAL_VIEWPORT.margin,
  as = MOTION_TAG.div,
  className,
}: RevealProps): JSX.Element {
  const { tokens, reduced } = useMotionTokens();
  const variants = presetVariants(preset, tokens, { timing, delay, reduced });
  const Element = MOTION_ELEMENTS[as];
  return (
    <Element
      className={className}
      variants={variants}
      initial={MOTION_STATE.hidden}
      whileInView={MOTION_STATE.visible}
      viewport={{ once, amount, margin }}
    >
      {children}
    </Element>
  );
}
