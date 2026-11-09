/**
 * PillTabs 的规格常数与纯函数: 指示块弹簧, 速度拉伸, 尺寸档.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
import type { SpringSpec } from "../../../../craft/spring";
import { SEGMENT_PRESS_SCALE, SPRING_THUMB } from "../../../../craft/tokens";
import { DOUBLE, clamp } from "../../tokens";

/** 悬停块淡入淡出与弹出的时间常数 ms (PillNav.jsx:369, 378, 383). */
export const PILL_TAU = { hoverIn: 60, hoverOut: 70, pop: 90, dot: 100 } as const;
/** 按下弹簧 (PillNav.jsx:391): 刚度 700, 阻尼 30, 单位质量. */
export const PILL_PRESS_SPRING: SpringSpec = { stiffness: 700, damping: 30, mass: 1 };
/** 按下目标缩放, 取控件合同的分段按下值. */
export const PILL_PRESS_SCALE = SEGMENT_PRESS_SCALE;
/** 悬停块出现时从这个缩放弹到 1, HX 自定. */
export const PILL_POP_FROM = 0.9;
/** 文字色过渡 (PillNav.css:160) 与底色过渡 (PillNav.css:309). */
export const PILL_COLOR_MS = 250;
export const PILL_SURFACE_MS = 300;
/** 速度拉伸增益: 每 px/s 拉宽多少 px, 再乘 stretch. HX 自定. */
export const PILL_STRETCH_GAIN = 0.04;
/** 规格默认. */
export const PILL_DEFAULTS = { bounce: 0.3, stretch: 0.5 } as const;
/** 尺寸档: [高, 字号, 水平内边距]. HX 自定. */
export const PILL_SIZES = { sm: [28, 12, 10], md: [34, 14, 14], lg: [40, 15, 18] } as const;
export type PillSize = keyof typeof PILL_SIZES;

/** bounce 0..1 换阻尼: 取 thumb 弹簧的刚度与质量, 阻尼比 = 1 - bounce. */
export function pillSpring(bounce: number): SpringSpec {
  const { stiffness, mass } = SPRING_THUMB;
  const zeta = 1 - clamp(bounce, 0, 1);
  return { stiffness, mass, damping: DOUBLE * Math.sqrt(stiffness * mass) * zeta };
}

/**
 * 指示块随速度拉伸: 额外宽度与速度成正比, 上限为本身宽度乘 stretch.
 * 返回左边与宽度, 拉伸对称地向两边铺开.
 */
export function pillBox(x: number, width: number, velocity: number, stretch: number): { left: number; width: number } {
  const s = clamp(stretch, 0, 1);
  const extra = clamp(Math.abs(velocity) * PILL_STRETCH_GAIN * s, 0, width * s);
  return { left: x - extra / DOUBLE, width: width + extra };
}
