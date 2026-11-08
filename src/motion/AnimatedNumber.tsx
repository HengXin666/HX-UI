"use client";

import { animate, useInView, useMotionValue, useMotionValueEvent, useSpring } from "motion/react";
import { useEffect, useMemo, useRef, type JSX } from "react";
import { MOTION_CHANGE_EVENT, MOTION_EASE_FALLBACK, REVEAL_VIEWPORT, SPRING_NAME } from "../constants/motion";
import { DECIMAL_POINT, NUMBER_CLASS } from "../constants/polish";
import { NumberRoll } from "../craft/NumberRoll";
import { SPRING, useMotionTokens, type SpringName } from "./presets";

const MS_PER_S = 1000;

export interface AnimatedNumberProps {
  /** 目标值. 变化时从当前显示值弹到新值, 不会跳回起点. */
  value: number;
  /** 首次进入视口时从这个值开始. 省略则首帧直接显示 value, 只有后续变化才有动画. */
  from?: number;
  /** 弹簧档位. 默认 soft. */
  spring?: SpringName;
  /** 定时计数的时长 (s). 给了就按 ease-out 在这段时间内数到目标, 不走弹簧; 省略时与原先一致. */
  duration?: number;
  /** 进视口后再等这么久才开始 (s). */
  delay?: number;
  /** 数字槽: 每位一条竖向滚动的槽, 位间错峰有上限 (只显示整数, 不走 format). */
  roll?: boolean;
  /** 数字前后的固定文字 (货币符号, 单位等), 不参与动画. */
  prefix?: string;
  suffix?: string;
  /** 区域设置, 省略时跟随运行环境. */
  locale?: string;
  /** Intl.NumberFormat 选项 (货币, 百分比, 紧凑写法等). 省略小数位时按 value 自身的小数位. */
  format?: Intl.NumberFormatOptions;
  className?: string;
}

/** 一个数的小数位数. 用来让 0 到 1280 的过程不出现 643.127 这样的中间值. */
function decimalsOf(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value.toString().split(DECIMAL_POINT)[1]?.length ?? 0;
}

/**
 * 弹簧数字. 数值由 useSpring 驱动, 每帧直接写 textContent 而不走 React 渲染,
 * 一屏十几个数字同时滚动也不触发重渲染.
 *
 * 字宽用 tabular-nums 固定, 滚动时不左右抖. 读屏器只读一份 sr-only 的终值,
 * 动画中的文字 aria-hidden, 避免被逐帧播报. 减弱动效时直接跳到终值.
 * duration / delay / roll / prefix / suffix 是可选补充 (行为规格参照 docs/research/catalog/textanimations.md 的 CountUp 条目,
 * 实现为 HX 自有): 定时计数, 起播延迟, 封顶错峰的数字槽与前后缀. 都不给时行为与原先一致.
 */
export function AnimatedNumber({
  value,
  from,
  spring = SPRING_NAME.soft,
  duration,
  delay = 0,
  roll = false,
  prefix = "",
  suffix = "",
  locale,
  format,
  className,
}: AnimatedNumberProps): JSX.Element {
  const { reduced } = useMotionTokens();
  const ref = useRef<HTMLSpanElement>(null);
  const host = useRef<HTMLSpanElement>(null);
  const inView = useInView(host, { once: true, amount: REVEAL_VIEWPORT.amount });
  const formatter = useMemo(() => {
    const digits = decimalsOf(value);
    return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits, ...format });
  }, [locale, format, value]);
  const motionValue = useSpring(from ?? value, SPRING[spring]);
  const timed = useMotionValue(from ?? value);
  const counting = duration !== undefined;

  useEffect(() => {
    if (!inView || roll) return undefined;
    if (reduced) {
      motionValue.jump(value);
      timed.jump(value);
      return undefined;
    }
    if (counting) {
      const controls = animate(timed, value, { duration: Math.max(0, duration), delay, ease: [...MOTION_EASE_FALLBACK.out] });
      return () => controls.stop();
    }
    if (delay <= 0) {
      motionValue.set(value);
      return undefined;
    }
    const id = globalThis.setTimeout(() => motionValue.set(value), delay * MS_PER_S);
    return () => globalThis.clearTimeout(id);
  }, [inView, reduced, value, motionValue, timed, counting, duration, delay, roll]);

  const paint = (latest: number): void => {
    if (ref.current) ref.current.textContent = formatter.format(latest);
  };
  useMotionValueEvent(motionValue, MOTION_CHANGE_EVENT, (latest) => {
    if (!counting) paint(latest);
  });
  useMotionValueEvent(timed, MOTION_CHANGE_EVENT, (latest) => {
    if (counting) paint(latest);
  });

  const finalText = `${prefix}${formatter.format(value)}${suffix}`;
  const start = from ?? value;
  return (
    <span ref={host} className={className}>
      <span aria-hidden className={NUMBER_CLASS.tabular}>
        {prefix}
        {roll ? (
          <NumberRoll value={inView || reduced ? value : start} duration={duration === undefined ? undefined : duration * MS_PER_S} />
        ) : (
          <span ref={ref}>{formatter.format(start)}</span>
        )}
        {suffix}
      </span>
      <span className={NUMBER_CLASS.srOnly}>{finalText}</span>
    </span>
  );
}
