"use client";

import { useInView, useMotionValueEvent, useSpring } from "motion/react";
import { useEffect, useMemo, useRef, type JSX } from "react";
import { MOTION_CHANGE_EVENT, REVEAL_VIEWPORT, SPRING_NAME } from "../constants/motion";
import { DECIMAL_POINT, NUMBER_CLASS } from "../constants/polish";
import { SPRING, useMotionTokens, type SpringName } from "./presets";

export interface AnimatedNumberProps {
  /** 目标值. 变化时从当前显示值弹到新值, 不会跳回起点. */
  value: number;
  /** 首次进入视口时从这个值开始. 省略则首帧直接显示 value, 只有后续变化才有动画. */
  from?: number;
  /** 弹簧档位. 默认 soft. */
  spring?: SpringName;
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
 */
export function AnimatedNumber({
  value,
  from,
  spring = SPRING_NAME.soft,
  locale,
  format,
  className,
}: AnimatedNumberProps): JSX.Element {
  const { reduced } = useMotionTokens();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: REVEAL_VIEWPORT.amount });
  const formatter = useMemo(() => {
    const digits = decimalsOf(value);
    return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits, ...format });
  }, [locale, format, value]);
  const motionValue = useSpring(from ?? value, SPRING[spring]);

  useEffect(() => {
    if (!inView) return;
    if (reduced) motionValue.jump(value);
    else motionValue.set(value);
  }, [inView, reduced, value, motionValue]);

  useMotionValueEvent(motionValue, MOTION_CHANGE_EVENT, (latest) => {
    if (ref.current) ref.current.textContent = formatter.format(latest);
  });

  const finalText = formatter.format(value);
  return (
    <span className={className}>
      <span ref={ref} aria-hidden className={NUMBER_CLASS.tabular}>
        {formatter.format(from ?? value)}
      </span>
      <span className={NUMBER_CLASS.srOnly}>{finalText}</span>
    </span>
  );
}
