/**
 * RingCarousel 的规格常数与纯函数: 临界阻尼弹簧, 角度与当前项互换, 巡航.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
import type { SpringSpec } from "../../../craft/spring";
import { wrapIndex } from "../tokens";

/** 规格 SPRING = 118, 阻尼 2 sqrt(SPRING) (CircularCarousel.jsx:123, 498), 即临界阻尼. */
export const RING_STIFFNESS = 118;
export const RING_SPRING: SpringSpec = { stiffness: RING_STIFFNESS, damping: 2 * Math.sqrt(RING_STIFFNESS), mass: 1 };
/** 巡航速度向目标靠拢的时间常数 ms (CircularCarousel.jsx:514 的 tau). HX 取 600. */
export const RING_CRUISE_TAU_MS = 600;
/** 巡航默认角速度 deg/s. HX 自定. */
export const RING_CRUISE_DEG_S = 12;
/** 拖拽: 每 px 转多少度. HX 自定. */
export const RING_DEG_PER_PX = 0.25;
/** 环半径相对条目宽的倍数下限. HX 自定. */
export const RING_MIN_RADIUS = 1.2;
const FULL_TURN = 360;
const HALF = 2;

/** 每项相隔的角度. */
export function ringStep(n: number): number {
  return n > 0 ? FULL_TURN / n : 0;
}

/** 环转到 angle 时正对观者的那一项. */
export function ringActive(angle: number, n: number): number {
  const step = ringStep(n);
  return step ? wrapIndex(Math.round(-angle / step), n) : 0;
}

/** 从当前角度转到第 i 项的最近目标角. */
export function ringTarget(angle: number, i: number, n: number): number {
  const step = ringStep(n);
  if (!step) return angle;
  const here = Math.round(-angle / step);
  const d = wrapIndex(i - here, n);
  const delta = d > n / HALF ? d - n : d;
  return -(here + delta) * step;
}

/** 让 n 张宽 w 的卡片围成一圈不重叠的半径. */
export function ringRadius(n: number, w: number, gap: number): number {
  if (n < 3) return w * RING_MIN_RADIUS;
  return Math.max(w * RING_MIN_RADIUS, (w + gap) / (HALF * Math.tan(Math.PI / n)));
}

/** 巡航一帧: 角速度按时间常数靠向 cruise (deg/s). */
export function cruiseVelocity(v: number, cruise: number, dtMs: number): number {
  return v + (cruise - v) * (1 - Math.exp(-dtMs / RING_CRUISE_TAU_MS));
}
