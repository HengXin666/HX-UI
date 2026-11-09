/**
 * MarqueeRows 的规格常数与纯函数: 进出边判定, 跑马带弹簧, 跑马位移取模.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
import type { SpringSpec } from "../../../../craft/spring";

/** 规格默认 (FlowingMenu.jsx:40-63). speed px/s, duration 秒. */
export const MARQUEE_DEFAULTS = { speed: 60, duration: 0.5 } as const;
/** 规格 duration 下限 (FlowingMenu.jsx:98), 秒. */
export const MARQUEE_MIN_DURATION_S = 0.1;
/** 跑马带弹簧的阻尼比; 规格的 zeta 随 stretch 变, 这里取不过冲的 0.9. HX 自定. */
export const MARQUEE_ZETA = 0.9;
/** 规格入场 (FlowingMenu.jsx:437-454): 行 0.9s 错峰 70ms, 文字 0.7s 起步 200ms 错峰 40ms. */
export const MARQUEE_ROW_MS = 900;
export const MARQUEE_ROW_STAGGER_MS = 70;
export const MARQUEE_TEXT_MS = 700;
export const MARQUEE_TEXT_LEAD_MS = 200;
export const MARQUEE_TEXT_STAGGER_MS = 40;
/** 规格未激活行淡化 (FlowingMenu.css:56): opacity 0.45s ease. */
export const MARQUEE_DIM_MS = 450;
export const MARQUEE_DIM = 0.5;
/** 跑马带里重复几段, 保证宽屏也铺满. HX 自定. */
export const MARQUEE_REPEAT = 4;
/** 入场时行下沉 px. HX 自定. */
export const MARQUEE_ROW_FROM_PX = 24;
const FULL = 101;
const TWO_PI = Math.PI * 2;

export type MarqueeEdge = "top" | "bottom";

/** 指针相对行的纵坐标 -> 从哪条边进出: 上半走上边, 下半走下边. */
export function marqueeEdge(offsetY: number, height: number): MarqueeEdge {
  return offsetY < height / 2 ? "top" : "bottom";
}

/** 跑马带藏在某条边外时的纵向百分比位移. */
export function marqueeHidden(edge: MarqueeEdge): number {
  return edge === "top" ? -FULL : FULL;
}

/** 跑马带弹簧: omega = 2pi / duration (FlowingMenu.jsx:227), 阻尼比 MARQUEE_ZETA. */
export function marqueeSpring(durationS: number): SpringSpec {
  const omega = TWO_PI / Math.max(MARQUEE_MIN_DURATION_S, durationS);
  return { stiffness: omega * omega, damping: 2 * MARQUEE_ZETA * omega, mass: 1 };
}

/** 跑马位移推进一帧后取模到 (-segment, 0]; 段宽不大于 0 时恒为 0. direction 1 往左, -1 往右. */
export function marqueeAdvance(offset: number, dtMs: number, speed: number, segment: number, direction: 1 | -1): number {
  if (segment <= 0) return 0;
  const next = offset - (direction * speed * dtMs) / 1000;
  const wrapped = next % segment;
  return wrapped > 0 ? wrapped - segment : wrapped;
}
