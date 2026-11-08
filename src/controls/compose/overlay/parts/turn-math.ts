/** TurnCard 的翻转数学: 翻转轴的 CSS 旋转, 甩出落点, 朝外的面, 最近半圈, 拖动角速度. */
import { HALF, MS_PER_S, TURN } from "../../tokens";

export const TURN_AXIS = { x: "x", y: "y" } as const;
export type TurnAxis = (typeof TURN_AXIS)[keyof typeof TURN_AXIS];

/** 拖动采样: 时刻与当时的转角. */
export interface TurnSample {
  readonly t: number;
  readonly turn: number;
}

/** 绕翻转轴转 turn 度. 横轴翻时取负, 让向上拖等于向后翻. */
export function spinOf(axis: TurnAxis, turn: number): string {
  return axis === TURN_AXIS.y ? `rotateY(${turn}deg)` : `rotateX(${-turn}deg)`;
}

/** 甩出落点: 当前角加速度乘 fling 的投影, 吸到最近的半圈. */
export function settleTurn(turn: number, velocity: number, fling: number = TURN.fling): number {
  return Math.round((turn + velocity * fling) / TURN.halfTurn) * TURN.halfTurn;
}

/** 某个角度朝外的是不是背面. */
export function showsBack(turn: number): boolean {
  const half = Math.round(turn / TURN.halfTurn);
  return Math.abs(half % HALF) === 1;
}

/** 翻到目标面时走最近的那半圈, 不倒转一整圈. */
export function nearestFace(turn: number, back: boolean): number {
  const base = Math.round(turn / TURN.halfTurn);
  const wantOdd = back ? 1 : 0;
  if (Math.abs(base % HALF) === wantOdd) return base * TURN.halfTurn;
  const up = base + 1;
  const down = base - 1;
  return (Math.abs(up * TURN.halfTurn - turn) <= Math.abs(down * TURN.halfTurn - turn) ? up : down) * TURN.halfTurn;
}

/** 近 historyMs 内的平均角速度 (度/秒). */
export function velocityOf(history: readonly TurnSample[], now: number): number {
  const recent = history.filter((s) => now - s.t <= TURN.historyMs);
  const first = recent[0];
  const last = recent[recent.length - 1];
  if (!first || !last || last.t === first.t) return 0;
  return ((last.turn - first.turn) / (last.t - first.t)) * MS_PER_S;
}
