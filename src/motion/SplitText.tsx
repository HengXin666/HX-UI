"use client";

import { motion, stagger, type Variants } from "motion/react";
import { Fragment, useMemo, type JSX } from "react";
import {
  MOTION_DIRECTION,
  MOTION_PRESET_NAME,
  MOTION_STATE,
  MOTION_TIMING,
  REVEAL_VIEWPORT,
  SPLIT_BY,
  SPLIT_STEP_S,
  STAGGER_TRIGGER,
  WHITESPACE_PATTERN,
} from "../constants/motion";
import type { MotionDirection } from "./Parallax";
import { presetVariants, useMotionTokens, type MotionPresetName, type MotionTiming } from "./presets";

export type SplitBy = (typeof SPLIT_BY)[keyof typeof SPLIT_BY];

export interface SplitTextProps {
  /** 要拆分的纯文本. */
  text: string;
  /** char 逐字 (默认) 或 word 逐词. 中文建议逐字, 长英文句子建议逐词. */
  by?: SplitBy;
  /** 每个单元从哪个方向进入. 默认 up (自下浮起). */
  direction?: MotionDirection;
  /** 相邻单元的起播间隔 (s). 省略时逐字 0.02, 逐词 0.06. */
  step?: number;
  /** 第一个单元之前的延迟 (s). 区块里可直接接 useOrchestration 的结果. */
  delay?: number;
  /** 节奏, 默认 enter. 首屏大标题可用 emphasized. */
  timing?: MotionTiming;
  /** inView (默认) 进视口才播; mount 挂载即播. */
  trigger?: (typeof STAGGER_TRIGGER)[keyof typeof STAGGER_TRIGGER];
  /** inView 时是否只播一次. */
  once?: boolean;
  /** 错峰起点: start 从头, end 从尾, center 从中间向两边. 省略时同 start. */
  staggerFrom?: SplitStaggerFrom;
  /** 每个单元套一层裁切, 只在自己的行框里升起, 不越过上下文字. */
  mask?: boolean;
  className?: string;
}

export type SplitStaggerFrom = "start" | "end" | "center";

/** 错峰起点到 motion 的 stagger 起点. */
const STAGGER_ORIGIN = { start: "first", end: "last", center: "center" } as const;

/** 方向换成预设: 位移来自哪边, 就用对应的 fade / slide. */
const DIRECTION_PRESET: Record<MotionDirection, MotionPresetName> = {
  [MOTION_DIRECTION.up]: MOTION_PRESET_NAME.fadeUp,
  [MOTION_DIRECTION.down]: MOTION_PRESET_NAME.fadeDown,
  [MOTION_DIRECTION.left]: MOTION_PRESET_NAME.slideLeft,
  [MOTION_DIRECTION.right]: MOTION_PRESET_NAME.slideRight,
};

/** 拆成单元. 空白原样保留且不参与动画; 逐字时用 Array.from, 不把表情等代理对拆坏. */
function splitUnits(text: string, by: SplitBy): string[][] {
  return text.split(WHITESPACE_PATTERN).map((part) => {
    if (part === "" || WHITESPACE_PATTERN.test(part)) return [part];
    return by === SPLIT_BY.word ? [part] : Array.from(part);
  });
}

/**
 * 逐字 / 逐词入场 (审计 E8 一节, carbon 首屏标题那种).
 *
 * 结构与 Stagger 相同: 外层只下发 staggerChildren, 每个单元是 inline-block 的 motion.span.
 * 逐字时一个词的字包在 whitespace-nowrap 里, 换行只发生在词与词之间.
 * 读屏器读外层的 aria-label 原文, 拆开的单元 aria-hidden, 不会被逐字拼读.
 * prefers-reduced-motion 时不拆分, 直接渲染静态原文.
 * staggerFrom 与 mask 是可选补充 (行为规格参照 docs/research/catalog/textanimations.md 的 SplitText 条目, 实现为 HX 自有),
 * 不给时行为与原先一致.
 */
export function SplitText({
  text,
  by = SPLIT_BY.char,
  direction = MOTION_DIRECTION.up,
  step,
  delay = 0,
  timing = MOTION_TIMING.enter,
  trigger = STAGGER_TRIGGER.inView,
  once = true,
  staggerFrom,
  mask = false,
  className,
}: SplitTextProps): JSX.Element {
  const { tokens, reduced } = useMotionTokens();
  const groups = useMemo(() => splitUnits(text, by), [text, by]);
  if (reduced) return <span className={className}>{text}</span>;

  const interval = step ?? SPLIT_STEP_S[by];
  const container: Variants = {
    hidden: {},
    visible: {
      transition: staggerFrom
        ? { delayChildren: stagger(interval, { from: STAGGER_ORIGIN[staggerFrom], startDelay: delay }) }
        : { staggerChildren: interval, delayChildren: delay },
    },
  };
  const unit = presetVariants(DIRECTION_PRESET[direction], tokens, { timing });
  const play = trigger === STAGGER_TRIGGER.mount
    ? { animate: MOTION_STATE.visible }
    : { whileInView: MOTION_STATE.visible, viewport: { once, amount: REVEAL_VIEWPORT.amount } };
  return (
    <motion.span className={className} aria-label={text} variants={container} initial={MOTION_STATE.hidden} {...play}>
      {groups.map((group, groupIndex) => {
        if (group.length === 1 && (group[0] === "" || WHITESPACE_PATTERN.test(group[0]))) {
          return <Fragment key={groupIndex}>{group[0]}</Fragment>;
        }
        return (
          <span key={groupIndex} aria-hidden className="inline-block whitespace-nowrap">
            {group.map((piece, pieceIndex) => {
              const moving = <motion.span key={pieceIndex} className="inline-block" variants={unit}>{piece}</motion.span>;
              return mask ? <span key={pieceIndex} className="inline-block overflow-hidden align-bottom">{moving}</span> : moving;
            })}
          </span>
        );
      })}
    </motion.span>
  );
}
