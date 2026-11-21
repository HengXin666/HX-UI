"use client";

import type { Transition, Variants } from "motion/react";
import type { JSX, ReactNode } from "react";
import { MOTION_PRESET_NAME, MOTION_STATE, MOTION_TAG, MOTION_TIMING, REVEAL_VIEWPORT, STAGGER_GAP_S, STAGGER_TRIGGER } from "../constants/motion";
import { STAGGER_RHYTHM } from "../constants/motion-recipe";
import { DEAL_FIRST_MS, DEAL_LAST_MS } from "../craft/tokens";
import { presetVariants, useMotionTokens, type MotionPresetName, type MotionTiming } from "./presets";
import { MOTION_ELEMENTS, type MotionTag } from "./Reveal";
import { dealDelayChildren } from "./recipe";

export type StaggerRhythm = (typeof STAGGER_RHYTHM)[keyof typeof STAGGER_RHYTHM];

export interface StaggerProps {
  children: ReactNode;
  /** 相邻子项的起播间隔 (s). */
  gap?: number;
  /** 第一个子项之前的延迟 (s). */
  delay?: number;
  /**
   * 群体节奏. even (默认) 每个间隔都是 gap; deal 按发牌式加速, 首个间隔 120ms 线性收紧到 40ms, 此时 gap 不生效.
   * 卡片墙, 商品格, 特性网格这类一眼看全的群体用 deal, 恒定间隔读起来像模板.
   */
  rhythm?: StaggerRhythm;
  /** 触发时机: inView (默认) 进入视口才播; mount 挂载即播, 适合弹层与抽屉内容. */
  trigger?: (typeof STAGGER_TRIGGER)[keyof typeof STAGGER_TRIGGER];
  /** inView 时是否只播一次. */
  once?: boolean;
  /** 包裹标签. 列表请传 ul, 子项用 StaggerItem as="li". */
  as?: MotionTag;
  className?: string;
}

/** 容器的 visible 过渡. 减弱动效时间隔与延迟都归零. */
export function staggerTransition(rhythm: StaggerRhythm, gap: number, delay: number, reduced: boolean): Transition {
  if (reduced) return { staggerChildren: 0, delayChildren: 0 };
  if (rhythm === STAGGER_RHYTHM.deal) return { delayChildren: dealDelayChildren(delay, DEAL_FIRST_MS, DEAL_LAST_MS) };
  return { staggerChildren: gap, delayChildren: delay };
}

/**
 * 交错入场的容器. 本身不动, 只把 hidden / visible 两态往下传, 用 staggerChildren 给每个
 * StaggerItem 排开起播时间. 子项必须是 StaggerItem (或自带同名变体的 motion 元素),
 * 普通元素拿不到状态, 会直接显示.
 *
 * 减弱动效时间隔与延迟都归零, 子项一次性落到终态.
 */
export function Stagger({
  children,
  gap = STAGGER_GAP_S,
  delay = 0,
  rhythm = STAGGER_RHYTHM.even,
  trigger = STAGGER_TRIGGER.inView,
  once = true,
  as = MOTION_TAG.div,
  className,
}: StaggerProps): JSX.Element {
  const { reduced } = useMotionTokens();
  const variants: Variants = {
    hidden: {},
    visible: {
      transition: staggerTransition(rhythm, gap, delay, reduced),
    },
  };
  const Element = MOTION_ELEMENTS[as];
  const play = trigger === STAGGER_TRIGGER.mount
    ? { animate: MOTION_STATE.visible }
    : { whileInView: MOTION_STATE.visible, viewport: { once, amount: REVEAL_VIEWPORT.amount, margin: REVEAL_VIEWPORT.margin } };
  return (
    <Element className={className} variants={variants} initial={MOTION_STATE.hidden} {...play}>
      {children}
    </Element>
  );
}

export interface StaggerItemProps {
  children: ReactNode;
  /** 子项预设. 默认 fadeUp. */
  preset?: MotionPresetName;
  /** 节奏. 默认 enter. */
  timing?: MotionTiming;
  /** 包裹标签. 默认 div. */
  as?: MotionTag;
  className?: string;
}

/**
 * Stagger 的子项. 不设 initial / animate, 状态完全继承父容器, 起播时间由父容器的
 * staggerChildren 排定; 自身只决定 "怎么动" (预设与节奏).
 */
export function StaggerItem({
  children,
  preset = MOTION_PRESET_NAME.fadeUp,
  timing = MOTION_TIMING.enter,
  as = MOTION_TAG.div,
  className,
}: StaggerItemProps): JSX.Element {
  const { tokens, reduced } = useMotionTokens();
  const Element = MOTION_ELEMENTS[as];
  return (
    <Element className={className} variants={presetVariants(preset, tokens, { timing, reduced })}>
      {children}
    </Element>
  );
}
