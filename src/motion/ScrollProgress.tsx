"use client";

import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useState, type JSX, type RefObject } from "react";
import {
  MOTION_CHANGE_EVENT,
  PROGRESS_RANGE,
  SCROLL_AXIS,
  SCROLL_BAR_POSITION,
  SCROLL_BAR_SPRING,
  SCROLL_OFFSET,
} from "../constants/motion";
import { useMotionTokens } from "./presets";

type ScrollOptions = NonNullable<Parameters<typeof useScroll>[0]>;
export type ScrollAxis = (typeof SCROLL_AXIS)[keyof typeof SCROLL_AXIS];
export type ScrollBarPosition = (typeof SCROLL_BAR_POSITION)[keyof typeof SCROLL_BAR_POSITION];

export interface ScrollProgressOptions {
  /** 滚动容器. 省略时跟随整页 (window) 滚动. */
  container?: RefObject<HTMLElement | null>;
  /** 跟踪的元素. 给了就是 "这个元素从进屏到出屏" 的进度, 省略就是整个容器的进度. */
  target?: RefObject<HTMLElement | null>;
  /** 跟踪元素时的区间, 默认 through (底边进屏到顶边出屏). */
  offset?: ScrollOptions["offset"];
  /** 轴向, 默认 y. */
  axis?: ScrollAxis;
}

/**
 * 滚动进度, 0 到 1 的 MotionValue. 直接交给 style / useTransform, 每帧不触发 React 渲染.
 * 进度是信息不是装饰, 减弱动效时照常读取; 由消费方决定要不要把它变成位移.
 */
export function useScrollProgress({ container, target, offset, axis = SCROLL_AXIS.y }: ScrollProgressOptions = {}): MotionValue<number> {
  const defaultOffset = target ? ([...SCROLL_OFFSET.through] as ScrollOptions["offset"]) : undefined;
  const { scrollXProgress, scrollYProgress } = useScroll({ container, target, offset: offset ?? defaultOffset });
  return axis === SCROLL_AXIS.x ? scrollXProgress : scrollYProgress;
}

/**
 * 滚动进度的普通数值版本 (0 到 1), 给需要据此渲染文字或切换状态的场景.
 * 每次变化都会重渲染, 高频场景请用 useScrollProgress 拿 MotionValue.
 */
export function useScrollProgressValue(options: ScrollProgressOptions = {}): number {
  const progress = useScrollProgress(options);
  const [value, setValue] = useState(() => progress.get());
  useMotionValueEvent(progress, MOTION_CHANGE_EVENT, setValue);
  return value;
}

const POSITION_CLASS: Record<ScrollBarPosition, string> = {
  [SCROLL_BAR_POSITION.top]: "fixed inset-x-0 top-0 z-50",
  [SCROLL_BAR_POSITION.bottom]: "fixed inset-x-0 bottom-0 z-50",
  [SCROLL_BAR_POSITION.inline]: "relative w-full",
};

export interface ScrollProgressProps extends ScrollProgressOptions {
  /** 贴边位置: top / bottom 固定在视口边缘; inline 随文档流放在容器内. 默认 top. */
  position?: ScrollBarPosition;
  /** 是否用弹簧平滑. 默认 true; 减弱动效时总是关闭. */
  smooth?: boolean;
  /** 读屏器名称. 给了就以 progressbar 身份暴露并播报百分比, 省略则视为装饰. */
  label?: string;
  /** 轨道的类名, 用于改高度 (默认 h-1) 或底色. */
  className?: string;
  /** 填充条的类名, 默认 bg-primary. */
  barClassName?: string;
}

/** 百分比文本, 供 aria-valuenow 使用. */
const toPercent = (value: number): number => Math.round(value * 100);

/**
 * 可视滚动进度条 (阅读进度, 长文目录).
 *
 * 正常情况下用 scaleX 走合成器; prefers-reduced-motion 时不做缩放与弹簧, 改为按百分比宽度
 * 静态贴合当前位置, 只表达 "读到哪了", 不产生动效.
 */
export function ScrollProgress({
  position = SCROLL_BAR_POSITION.top,
  smooth = true,
  label,
  className,
  barClassName = "bg-primary",
  ...options
}: ScrollProgressProps): JSX.Element {
  const { reduced } = useMotionTokens();
  const progress = useScrollProgress(options);
  const spring = useSpring(progress, SCROLL_BAR_SPRING);
  const width = useTransform(progress, [...PROGRESS_RANGE], ["0%", "100%"]);
  const [percent, setPercent] = useState(0);
  useMotionValueEvent(progress, MOTION_CHANGE_EVENT, (latest) => {
    if (label) setPercent(toPercent(latest));
  });
  const style = reduced ? { width } : { scaleX: smooth ? spring : progress, transformOrigin: "0% 50%" };
  const a11y = label
    ? { role: "progressbar", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": percent }
    : { "aria-hidden": true };
  return (
    <div className={[POSITION_CLASS[position], "h-1 overflow-hidden", className].filter(Boolean).join(" ")} {...a11y}>
      <motion.div className={["h-full w-full", barClassName].join(" ")} style={style} />
    </div>
  );
}
