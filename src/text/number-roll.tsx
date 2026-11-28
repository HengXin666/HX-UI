import { AnimatedNumber } from "@/motion/animated-number";
import { SpeedCounter } from "@/interactions/speed-counter";

export interface NumberRollProps {
  value: number;
  /**
   * spring: 整个数一起从起点滚到目标值, 适合首屏大数字.
   * digits: 每一位各自滚动, 像机械计数器, 适合会频繁变的金额 / 库存.
   */
  mode?: "spring" | "digits";
  /** Intl.NumberFormat 选项, 例如 { style: "currency", currency: "CNY" } */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** spring: 整体时长; digits: 每一位的时长. 秒 */
  duration?: number;
  /** 仅 spring: 首次滚动的起点 */
  from?: number;
  className?: string;
}

/** 数字滚动: 两种手感一个入口. 等宽数字不抖; 读屏只读终值; 减弱动效直接显示终值. */
export function NumberRoll({ mode = "spring", duration, from, ...rest }: NumberRollProps) {
  if (mode === "digits") return <SpeedCounter duration={duration ?? 0.9} {...rest} />;
  return <AnimatedNumber duration={duration ?? 1.2} from={from ?? 0} {...rest} />;
}
