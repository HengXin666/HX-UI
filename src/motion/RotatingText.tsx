"use client";

import { motion, useMotionValueEvent, type Variants } from "motion/react";
import { useEffect, useRef, useState, type JSX, type RefObject } from "react";
import { MOTION_CHANGE_EVENT, MOTION_PRESET_NAME, PRESENCE_MODE, ROTATE_INTERVAL_MS, ROTATE_TRIGGER } from "../constants/motion";
import { NUMBER_CLASS } from "../constants/polish";
import { useMotionTokens, type MotionPresetName } from "./presets";
import { useScrollProgress } from "./ScrollProgress";
import { FadeSwap } from "./Transition";

export type RotateTrigger = (typeof ROTATE_TRIGGER)[keyof typeof ROTATE_TRIGGER];

export interface RotatingTextProps {
  /** 轮换的词. 至少一个; 只有一个时等同静态文本. */
  words: string[];
  /** interval (默认) 定时轮换; scroll 按目标元素的滚动进度均分换词. */
  trigger?: RotateTrigger;
  /** 定时轮换的停留时长 (ms). */
  interval?: number;
  /** scroll 触发时的滚动容器, 省略时跟随整页. */
  container?: RefObject<HTMLElement | null>;
  /** 换词的进出场预设. 默认 fadeUp: 旧词上浮离场, 新词自下浮入. */
  preset?: MotionPresetName;
  /** 逐字错峰的间隔 (s). 给了且大于 0 时新词逐字升入; 省略时整词一起换, 与原先一致. */
  stagger?: number;
  /** 逐字错峰的起点: first 从头, last 从尾, center 从中间向两边. */
  staggerFrom?: RotateStaggerFrom;
  /** 当前词变化时回调. */
  onWordChange?: (index: number, word: string) => void;
  className?: string;
}

export type RotateStaggerFrom = "first" | "last" | "center";

/** 逐字错峰的延迟 (s): first 按下标, last 倒序, center 按到中间那个字的距离. */
export function rotateCharDelay(index: number, total: number, step: number, from: RotateStaggerFrom = "first"): number {
  if (from === "last") return (total - 1 - index) * step;
  if (from === "center") return Math.abs(Math.floor(total / 2) - index) * step;
  return index * step;
}

/** 逐字升入: 由 FadeSwap 的 hidden / visible 状态传下来, custom 带每个字的延迟. */
const CHAR_VARIANTS: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: (delay: number) => ({ y: 0, opacity: 1, transition: { delay } }),
};

/** 定时轮换的下标. 停用时 (减弱动效或单词) 不建定时器. */
function useIntervalIndex(count: number, interval: number, enabled: boolean): number {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!enabled || count < 2) return undefined;
    const id = globalThis.setInterval(() => setIndex((prev) => (prev + 1) % count), interval);
    return () => globalThis.clearInterval(id);
  }, [count, interval, enabled]);
  return index;
}

/** 滚动进度均分到每个词: 进度 [0, 1/n) 是第一个词, 以此类推. */
function useScrollIndex(count: number, target: RefObject<HTMLElement | null>, container?: RefObject<HTMLElement | null>): number {
  const progress = useScrollProgress({ target, container });
  const [index, setIndex] = useState(0);
  useMotionValueEvent(progress, MOTION_CHANGE_EVENT, (latest) => {
    setIndex(Math.min(count - 1, Math.max(0, Math.floor(latest * count))));
  });
  return index;
}

/**
 * 轮换词 (首屏 "为 ___ 而生" 那一格, 审计 E8 一节).
 *
 * 换词用 FadeSwap (popLayout), 旧词脱离布局, 新词就位. 读屏器只读一份 sr-only 的完整列表,
 * 轮换中的文字 aria-hidden, 不会每 2 秒被播报一次.
 * prefers-reduced-motion 时不轮换也不动画, 只静态显示第一个词.
 * stagger 与 staggerFrom 是可选补充 (行为规格参照 docs/research/catalog/textanimations.md 的 RotatingText 条目, 实现为 HX 自有).
 */
export function RotatingText({
  words,
  trigger = ROTATE_TRIGGER.interval,
  interval = ROTATE_INTERVAL_MS,
  container,
  preset = MOTION_PRESET_NAME.fadeUp,
  stagger = 0,
  staggerFrom = "first",
  onWordChange,
  className,
}: RotatingTextProps): JSX.Element {
  const { reduced } = useMotionTokens();
  const ref = useRef<HTMLSpanElement>(null);
  const count = words.length;
  const timed = useIntervalIndex(count, interval, !reduced && trigger === ROTATE_TRIGGER.interval);
  const scrolled = useScrollIndex(count, ref, container);
  const index = reduced ? 0 : trigger === ROTATE_TRIGGER.scroll ? scrolled : timed;
  const word = words[index] ?? "";

  const callback = useRef(onWordChange);
  callback.current = onWordChange;
  const reported = useRef(index);
  useEffect(() => {
    if (reported.current === index) return;
    reported.current = index;
    callback.current?.(index, words[index] ?? "");
  }, [index, words]);

  return (
    <span ref={ref} className={["relative inline-flex overflow-hidden align-bottom", className].filter(Boolean).join(" ")}>
      <span aria-hidden className="inline-block">
        {reduced ? word : (
          <FadeSwap swapKey={index} preset={preset} mode={PRESENCE_MODE.popLayout}>
            {stagger > 0 ? Array.from(word).map((char, i, all) => (
              <motion.span key={i} className="inline-block whitespace-pre" variants={CHAR_VARIANTS} custom={rotateCharDelay(i, all.length, stagger, staggerFrom)}>
                {char}
              </motion.span>
            )) : word}
          </FadeSwap>
        )}
      </span>
      <span className={NUMBER_CLASS.srOnly}>{words.join(", ")}</span>
    </span>
  );
}
