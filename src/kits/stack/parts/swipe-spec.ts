/**
 * SwipeStack 的规格常数与纯函数: 各布局的槽位姿态, 甩出判定, 离场方向, 拖拽倾斜, 次序轮换.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
import type { SpringSpec } from "../../../craft/spring";
import { clamp } from "../tokens";

export type SwipeLayout = "fan" | "cascade" | "deck" | "pile";

/** 变换原点, 卡片宽高的比例 (Stack.jsx:15). */
export const SWIPE_ORIGINS: Record<SwipeLayout, readonly [number, number]> = { fan: [0.9, 0.9], cascade: [0.5, 0.5], deck: [0.5, 0], pile: [0.5, 0.5] };
/** 非拖拽离场 (点击, 键盘, 自动播放) 的方向 (Stack.jsx:16); pile 规格未给, 取向右. */
export const SWIPE_EXITS: Record<SwipeLayout, readonly [number, number]> = { fan: [1, -0.3], cascade: [0.8, 0.6], deck: [0, 1], pile: [1, 0] };
/** 卡片阴影: 规格 SHADOW (Stack.jsx:17, 两层 14/34 与 3/8 的黑影) 换成主题阴影 token 里最接近的一档. */
export const SWIPE_SHADOW = "var(--shadow-xl)";
/** 甩出速度 px/s, 倾斜满幅的拖拽距离 px, 按住放大 (Stack.jsx:19-22). */
export const SWIPE_FLICK_SPEED = 650;
export const SWIPE_LEAN_REACH = 260;
export const SWIPE_PRESS_SCALE = 1.035;
/** 离场后回到底部前的停顿: 0.35s / speed (Stack.jsx:201). 减弱动效 0.2s. */
export const SWIPE_FADE_MS = 350;
export const SWIPE_REDUCED_MS = 200;
/** 挂载时逐张就位的错峰 0.06s (Stack.jsx:449). */
export const SWIPE_MOUNT_STAGGER_MS = 60;
export const SWIPE_DEFAULTS = { visible: 4, spread: 0.5, depth: 0.5, radius: 16, tilt: 30, threshold: 90, speed: 1, autoplayDelay: 3000 } as const;
/** 以下槽位几何规格未给数值, HX 自定: 满 spread 时每层错开 px, 满 depth 时每层缩小, 拖拽满幅倾斜 deg, 离场距离按卡片对角线的倍数. */
export const SWIPE_STEP_PX = 56;
export const SWIPE_SHRINK = 0.16;
export const SWIPE_LEAN_DEG = 12;
export const SWIPE_EXIT_REACH = 1.2;

/** 弹簧随 speed 变快: 劲度乘 speed^2, 阻尼乘 speed (HX 自定基值 260 / 26). */
export function swipeSpring(speed: number): SpringSpec {
  const k = Math.max(0.1, speed);
  return { stiffness: 260 * k * k, damping: 26 * k, mass: 1 };
}

export interface SlotPose {
  readonly x: number;
  readonly y: number;
  readonly rotate: number;
  readonly scale: number;
  readonly opacity: number;
}

/** 由序号算出的稳定抖动, 落在 [-1, 1]. pile 布局每张卡的歪斜用它. */
export function jitter(seed: number): number {
  const v = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (v - Math.floor(v)) * 2 - 1;
}

/** 第 p 层 (0 为顶) 的姿态. 超出 visible 的层收在最后一层下面并隐去. */
export function slotPose(layout: SwipeLayout, p: number, visible: number, spread: number, depth: number, tilt: number, seed: number): SlotPose {
  const last = Math.max(0, visible - 1);
  const k = Math.min(p, last);
  const step = SWIPE_STEP_PX * clamp(spread, 0, 1);
  const scale = 1 - k * SWIPE_SHRINK * clamp(depth, 0, 1);
  const opacity = p < visible ? 1 : 0;
  if (layout === "fan") return { x: 0, y: 0, rotate: last ? 0 - (k * tilt * clamp(spread, 0, 1)) / last : 0, scale, opacity };
  if (layout === "cascade") return { x: k * step * 0.5, y: k * step * 0.5, rotate: 0, scale, opacity };
  if (layout === "deck") return { x: 0, y: -k * step * 0.5, rotate: 0, scale, opacity };
  const lean = p === 0 ? 0.25 : 1;
  return { x: jitter(seed + 1) * step * 0.25, y: jitter(seed + 2) * step * 0.25, rotate: jitter(seed) * tilt * clamp(spread, 0, 1) * lean, scale, opacity };
}

/** 松手是否送到底: 拖过阈值, 或速度超过甩出速度 (px/s). 只剩一张时不送. */
export function shouldSend(dx: number, dy: number, speedPxS: number, threshold: number, count: number): boolean {
  return count > 1 && (Math.hypot(dx, dy) > Math.max(0, threshold) || speedPxS > SWIPE_FLICK_SPEED);
}

/** 离场方向单位向量: 有拖拽按拖拽方向, 否则按布局的 EXITS. */
export function exitVector(layout: SwipeLayout, dx = 0, dy = 0): readonly [number, number] {
  const [ex, ey] = Math.hypot(dx, dy) > 1 ? [dx, dy] : SWIPE_EXITS[layout];
  const len = Math.hypot(ex, ey) || 1;
  return [ex / len, ey / len];
}

/** 拖拽倾斜 deg: 横向拖过 LEAN_REACH 时满幅. */
export function leanDeg(dx: number): number {
  return clamp(dx / SWIPE_LEAN_REACH, -1, 1) * SWIPE_LEAN_DEG;
}

/** 顶牌送到底 (step 1) 或底牌抽回顶 (step -1). */
export function rotateOrder(order: readonly number[], step: 1 | -1): number[] {
  if (order.length < 2) return [...order];
  return step === 1 ? [...order.slice(1), order[0] as number] : [order[order.length - 1] as number, ...order.slice(0, -1)];
}
