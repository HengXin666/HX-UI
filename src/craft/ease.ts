import { EASE, type EaseName } from "./tokens";

const NEWTON_STEPS = 8;
const BISECT_STEPS = 24;
const EPSILON = 1e-6;
/** 三次贝塞尔展开式的系数. */
const CUBIC = 3;
const QUADRATIC = 2;

type Curve = (t: number) => number;

function bezier(x1: number, y1: number, x2: number, y2: number): Curve {
  const cx = CUBIC * x1;
  const bx = CUBIC * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = CUBIC * y1;
  const by = CUBIC * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number): number => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number): number => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number): number => (CUBIC * ax * t + QUADRATIC * bx) * t + cx;
  const solve = (x: number): number => {
    let t = x;
    for (let i = 0; i < NEWTON_STEPS; i += 1) {
      const error = sampleX(t) - x;
      if (Math.abs(error) < EPSILON) return t;
      const slope = slopeX(t);
      if (Math.abs(slope) < EPSILON) break;
      t -= error / slope;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < BISECT_STEPS; i += 1) {
      const value = sampleX(t);
      if (Math.abs(value - x) < EPSILON) return t;
      if (value < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };
  return (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return sampleY(solve(t));
  };
}

const CURVES = Object.fromEntries(
  Object.entries(EASE).map(([name, points]) => {
    const [x1, y1, x2, y2] = points.split(",").map(Number);
    return [name, bezier(x1, y1, x2, y2)];
  }),
) as Record<EaseName, Curve>;

/** 按名字取缓动. 输入钳在 0 到 1, 首尾严格等于 0 和 1, 落定后不留 0.3px 斜差. */
export function ease(name: EaseName, t: number): number {
  return CURVES[name](t);
}

/** 把一段时间窗映射到 0 到 1. 镜头时间轴和滚动进度共用. */
export function phase(value: number, start: number, length: number): number {
  if (length <= 0) return value >= start ? 1 : 0;
  return Math.min(1, Math.max(0, (value - start) / length));
}
