"use client";

import * as React from "react";
import { animate, useInView, useMotionValue } from "motion/react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  /** Intl.NumberFormat 选项, 例如 { style: "currency", currency: "CNY" } */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** 首次从 0 开始 (默认). 之后数值变化都从当前值继续, 不重播. */
  from?: number;
  duration?: number;
}

/**
 * 弹簧数字: 进入视口时滚到目标值, 之后 value 变化从当前值继续.
 * 等宽数字, 不抖; 读屏只读终值; 减弱动效直接显示终值.
 */
export function AnimatedNumber({ value, format, locale = "zh-CN", from = 0, duration = 1.2, className, ...rest }: AnimatedNumberProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  // 减弱动效: 直接从终值起步, 不等进入视口
  const start = reduce ? value : from;
  const mv = useMotionValue(start);
  const fmt = React.useMemo(() => new Intl.NumberFormat(locale, format), [locale, format]);

  React.useEffect(() => {
    // 减弱动效: 不等进入视口, 直接终值 (水合后 reduce 才变 true, 所以放在 effect 里)
    if (reduce) {
      mv.set(value);
      return;
    }
    if (!inView) return;
    const controls = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [inView, value, reduce, duration, mv]);

  React.useEffect(() => mv.on("change", (v) => {
    if (ref.current) ref.current.textContent = fmt.format(v);
  }), [mv, fmt]);

  return (
    <span className={cn("tabular", className)} {...rest}>
      <span ref={ref} aria-hidden>{fmt.format(start)}</span>
      <span className="sr-only">{fmt.format(value)}</span>
    </span>
  );
}
