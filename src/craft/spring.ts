import { EASE, MS, PX, SCALE, type EaseName, type Spring } from "./tokens";

export type Channel = { x: number; v: number };

/**
 * 半隐式欧拉, 与 Magnet 同一条力: k * (目标 - 当前) - c * 速度.
 * dt 钳在 8ms 到 34ms, 切后台后的一帧不会把控件甩出屏幕.
 *
 * .agents/notes/implemented/feature/2026-11-07-craft-controls.md
 */
export function stepSpring(state: Channel, target: number, spring: Spring, dtMs: number): void {
  const dt = Math.min(MS.dtMax, Math.max(MS.dtMin, dtMs)) / 1000;
  const force = spring.stiffness * (target - state.x) - spring.damping * state.v;
  state.v += (force / spring.mass) * dt;
  state.x += state.v * dt;
}

export function resting(state: Channel, target: number): boolean {
  return Math.abs(state.x - target) < PX.rest && Math.abs(state.v) < PX.vel;
}

function curve(u: number, p1: number, p2: number): number {
  const o = 1 - u;
  return 3 * o * o * u * p1 + 3 * o * u * u * p2 + u * u * u;
}

/** 单位区间上的 cubic-bezier. t 是时间, 返回的是曲线的 y. */
export function ease(name: EaseName, t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  const [x1, y1, x2, y2] = EASE[name];
  let lo = 0;
  let hi = 1;
  let u = clamped;
  for (let step = 0; step < 14; step += 1) {
    u = (lo + hi) / 2;
    if (curve(u, x1, x2) < clamped) lo = u;
    else hi = u;
  }
  return curve(u, y1, y2);
}

/**
 * 第 k 张的入场时刻. 间隔从 120ms 收到 40ms, 后一张比前一张更赶.
 * count 小于 2 时没有间隔.
 */
export function dealCue(index: number, count: number): number {
  if (index <= 0 || count <= 1) return 0;
  const gaps = count - 1;
  let total = 0;
  const last = Math.min(index, gaps);
  for (let step = 1; step <= last; step += 1) {
    const along = gaps === 1 ? 0 : (step - 1) / (gaps - 1);
    total += MS.dealStart + (MS.dealEnd - MS.dealStart) * along;
  }
  return total;
}

function mix(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/**
 * 首页主角句. 前 300ms 不出现. 然后下沉 8px, 抬过 -4px, 落回 0, 再停住.
 * 返回的时间轴可逆: 同一个毫秒永远是同一个姿态.
 */
export function heroPose(ms: number): { y: number; scale: number; opacity: number } {
  if (ms < MS.quiet) return { y: 0, scale: SCALE.rest, opacity: 0 };
  const t = ms - MS.quiet;
  if (t < MS.prep) {
    return { y: PX.prep * ease("in", t / MS.prep), scale: SCALE.rest, opacity: 1 };
  }
  if (t < MS.punch) {
    const u = ease("punch", (t - MS.prep) / (MS.punch - MS.prep));
    return { y: mix(PX.prep, PX.lift, u), scale: mix(SCALE.rest, SCALE.hero, u), opacity: 1 };
  }
  if (t < MS.land) {
    const u = ease("settle", (t - MS.punch) / (MS.land - MS.punch));
    return { y: mix(PX.lift, 0, u), scale: mix(SCALE.hero, SCALE.rest, u), opacity: 1 };
  }
  return { y: 0, scale: SCALE.rest, opacity: 1 };
}

/** 错峰上限是整段时长的 40%, 高位先动. */
export function digitDelay(index: number, count: number): number {
  if (count <= 1) return 0;
  const gap = Math.min(MS.digitStagger, (MS.digit * MS.digitShare) / (count - 1));
  return index * gap;
}
