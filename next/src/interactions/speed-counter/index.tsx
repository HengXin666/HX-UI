import * as React from "react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const DIGITS = "0123456789";

export interface SpeedCounterProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  value: number;
  /** Intl.NumberFormat 选项, 例如 { style: "currency", currency: "CNY" } */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** 每一位的滚动时长 (秒). 高位比低位稍慢, 读起来像机械计数器 */
  duration?: number;
}

/**
 * 逐位滚动的数字. 每一位是一根 0-9 的竖条, 只动 translateY.
 * 读屏只读完整数值; 减弱动效时直接跳到终值.
 */
export function SpeedCounter({ value, format, locale = "zh-CN", duration = 0.9, className, ...rest }: SpeedCounterProps) {
  const reduce = useReducedMotion();
  const text = React.useMemo(() => new Intl.NumberFormat(locale, format).format(value), [value, locale, format]);
  const chars = Array.from(text);
  const digitCount = chars.filter((c) => DIGITS.includes(c)).length;
  let seen = 0;

  return (
    <span className={cn("tabular inline-flex overflow-hidden leading-none", className)} {...rest}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex">
        {chars.map((c, i) => {
          if (!DIGITS.includes(c)) return <span key={`s${i}`}>{c}</span>;
          // 从右往左编号, 让同一数位在数值变长变短时保持同一个 key, 动画才连续
          const place = digitCount - 1 - seen++;
          return <Digit key={`d${place}`} digit={Number(c)} delay={place * 0.04} duration={duration} instant={!!reduce} />;
        })}
      </span>
    </span>
  );
}

function Digit({ digit, delay, duration, instant }: { digit: number; delay: number; duration: number; instant: boolean }) {
  return (
    <span className="relative inline-block h-[1em] w-[1ch] overflow-hidden">
      <m.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${-digit}em` }}
        transition={instant ? { duration: 0 } : { duration, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {Array.from(DIGITS).map((d) => (
          <span key={d} className="block h-[1em] text-center">{d}</span>
        ))}
      </m.span>
    </span>
  );
}
