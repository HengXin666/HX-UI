import { FRAME_MS, ease, phase } from "../../../../../src/craft";

/**
 * 镜 5 整页拉升, 来自 crane-rise-reveal (docs/research/shots/part-3.md).
 * 起点 scale 3.0 对准被追踪的一行, hold 20f 以上 (这里 667ms), hold 内相机推近 1.5% 作预备;
 * 拉升 102f (3400ms) 走 crane 曲线 scale 到 1; 非主角行从 38% 起吊后 26f (867ms) 内回满;
 * 页头 KPI 与拉升同帧收; 落定后 1300ms 真静止.
 */
export const CRANE_FROM = 3;
export const BREATH = 0.015;
export const HOLD_MS = 667;
export const RISE_MS = 3400;
const DIM_FRAMES = 26;
export const DIM_MS = DIM_FRAMES * FRAME_MS;
export const DIM_FROM = 0.38;
const STILL_MS = 1300;
export const RISE_END_MS = HOLD_MS + RISE_MS;
export const CRANE_END_MS = Math.ceil((RISE_END_MS + STILL_MS) / FRAME_MS) * FRAME_MS;

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface CranePose {
  /** 整页层的 transform: 原点在左上, 先平移后缩放. */
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  /** 非主角行的透明度. */
  readonly dim: number;
  /** 页头 KPI 的进度, 与拉升同一条曲线, 同帧收. */
  readonly count: number;
}

/**
 * 相机姿态, 纯时间函数. focus 是被追踪那一行在整页里的坐标, start 是它在起点特写里应落的画面位置.
 * 画面坐标 = 平移 + scale × 页面坐标; 拉升时画面落点从 start 走回 focus 本身, scale 从 3.045 走回 1.
 */
export function cranePose(ms: number, focus: Point, start: Point): CranePose {
  const breath = ease("out", phase(ms, 0, HOLD_MS));
  const top = CRANE_FROM * (1 + BREATH * breath);
  const rise = ease("crane", phase(ms, HOLD_MS, RISE_MS));
  const scale = top + (1 - top) * rise;
  const screen = { x: start.x + (focus.x - start.x) * rise, y: start.y + (focus.y - start.y) * rise };
  const dim = DIM_FROM + (1 - DIM_FROM) * ease("out", phase(ms, HOLD_MS, DIM_MS));
  return { x: screen.x - scale * focus.x, y: screen.y - scale * focus.y, scale, dim, count: rise };
}
