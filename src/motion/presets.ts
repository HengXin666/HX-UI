import type { Transition, Variants } from "motion/react";

/** 弹簧档位: 统一手感, 组件里不写裸数字. */
export const spring = {
  /** 按压 / 小控件: 快, 几乎不过冲 */
  snappy: { type: "spring", stiffness: 520, damping: 34, mass: 0.8 },
  /** 默认: 入场 / 布局变化 */
  smooth: { type: "spring", stiffness: 260, damping: 30 },
  /** 有弹性: 徽标 / 数字 / 强调 */
  bouncy: { type: "spring", stiffness: 300, damping: 16 },
  /** 慢跟随: 指针跟随 / 视差 */
  follow: { type: "spring", stiffness: 150, damping: 20, mass: 0.6 },
} satisfies Record<string, Transition>;

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const duration = { fast: 0.15, base: 0.25, slow: 0.5 } as const;

export type RevealPreset = "fade" | "up" | "down" | "left" | "right" | "scale" | "blur";

const OFFSET = 24;

/** 入场预设: 只动 opacity / transform / filter. */
export const reveal: Record<RevealPreset, Variants> = {
  fade: { hidden: { opacity: 0 }, show: { opacity: 1 } },
  up: { hidden: { opacity: 0, y: OFFSET }, show: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -OFFSET }, show: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: OFFSET }, show: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: -OFFSET }, show: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.94 }, show: { opacity: 1, scale: 1 } },
  blur: { hidden: { opacity: 0, filter: "blur(10px)", y: 8 }, show: { opacity: 1, filter: "blur(0px)", y: 0 } },
};
