/**
 * 可视化层的纯数学: 比例尺, nice 刻度, 坐标轴冲击, 路径和发牌错峰.
 * 不依赖 DOM 与 React, 单测直接覆盖.
 */

export type Domain = readonly [number, number];
export type Point = readonly [number, number];

const NICE_STEPS = [1, 2, 5, 10] as const;
const DECIMALS = 3;
const PAIR = 2;
const HALF = 0.5;
const EPSILON = 1e-9;
const FIXED = PAIR;

function fmt(value: number): string {
  return value.toFixed(FIXED);
}

/** 数组的最小与最大值. 空数组返回 [0, 1], 调用方不用再判空. */
export function extent(values: readonly number[]): Domain {
  if (values.length === 0) return [0, 1];
  let min = values[0];
  let max = values[0];
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return [min, max];
}

/** 线性比例尺. domain 跨度为 0 时落到 range 中点, 不产生 NaN. */
export function linearScale(domain: Domain, range: Domain): (value: number) => number {
  const span = domain[1] - domain[0];
  const out = range[1] - range[0];
  if (span === 0) return () => range[0] + out * HALF;
  return (value: number) => range[0] + ((value - domain[0]) / span) * out;
}

/** 一档 nice 步长: 1, 2, 5 乘以 10 的幂, 让刻度数不超过 count. */
export function niceStep(span: number, count: number): number {
  if (span <= 0 || count <= 0) return 1;
  const raw = span / count;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = NICE_STEPS.find((base) => base * power >= raw * (1 - EPSILON)) ?? NICE_STEPS[NICE_STEPS.length - 1];
  return step * power;
}

/** 把 domain 外扩到 nice 步长的整数倍. 含 0 的数据不会被扩出负轴. */
export function niceDomain(domain: Domain, count: number): Domain {
  const step = niceStep(domain[1] - domain[0], count);
  return [Math.floor(domain[0] / step) * step, Math.ceil(domain[1] / step) * step];
}

/** nice 刻度. 步长按原 domain 取一次, 浮点残差按 3 位小数收掉, 不出现 0.30000000004. */
export function niceTicks(domain: Domain, count: number): number[] {
  const step = niceStep(domain[1] - domain[0], count);
  const lo = Math.floor(domain[0] / step) * step;
  const hi = Math.ceil(domain[1] / step) * step;
  const ticks: number[] = [];
  for (let value = lo; value <= hi + step * HALF; value += step) {
    ticks.push(Number(value.toFixed(DECIMALS)));
  }
  return ticks;
}

/**
 * 坐标轴冲击: 新值越过当前 domain 时只外扩, 不收缩, 返回新的 nice domain.
 * 未越界时原样返回同一个引用, 调用方据此判断要不要播重标.
 */
export function punchDomain(current: Domain, values: readonly number[], count: number): Domain {
  const [min, max] = extent(values);
  if (min >= current[0] && max <= current[1]) return current;
  return niceDomain([Math.min(current[0], min), Math.max(current[1], max)], count);
}

/** 从 0 起算的 domain, 柱状图用. 全负或全 0 也返回非零跨度. */
export function zeroDomain(values: readonly number[], count: number): Domain {
  const [min, max] = extent(values);
  const lo = Math.min(0, min);
  const hi = Math.max(0, max);
  return niceDomain(hi === lo ? [lo, lo + 1] : [lo, hi], count);
}

/** 把一组值投到画布上的点. x 均分, y 向下为正. */
export function project(values: readonly number[], domain: Domain, box: { width: number; height: number; pad: number }): Point[] {
  const y = linearScale(domain, [box.height - box.pad, box.pad]);
  const last = Math.max(1, values.length - 1);
  const inner = box.width - box.pad * PAIR;
  return values.map((value, index) => [box.pad + (index / last) * inner, y(value)] as const);
}

/** 折线 d. 少于两个点返回空串, 调用方不画. */
export function linePath(points: readonly Point[]): string {
  if (points.length < PAIR) return "";
  return points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`).join(" ");
}

/** 面积 d: 折线再落回基线闭合. */
export function areaPath(points: readonly Point[], baseline: number): string {
  const line = linePath(points);
  if (!line) return "";
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L${fmt(last[0])} ${baseline} L${fmt(first[0])} ${baseline} Z`;
}

/**
 * 发牌错峰 (秒). 间隔从 first 线性收到 last, 总长有上限, 不会出现 index * 60ms 的长尾.
 * 对齐 video-shotcraft 的发牌卡: 先慢后快, 满板后停住.
 */
export function dealDelays(count: number, first: number, last: number): number[] {
  const out: number[] = [];
  let elapsed = 0;
  for (let index = 0; index < count; index += 1) {
    out.push(Number(elapsed.toFixed(DECIMALS)));
    const t = count <= PAIR ? 1 : index / (count - PAIR);
    elapsed += first + (last - first) * Math.min(1, t);
  }
  return out;
}

/** 安全比值. 分母为 0 时返回 0. */
export function ratio(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole;
}

/** 按进度截出的折线: 截到的点 (末点是插值点) 与该处的插值读数. */
export interface Reveal {
  points: Point[];
  value: number | undefined;
}

/**
 * 按 0..1 的进度截折线. 进度按点序均分 (x 本就均分, 所以等于横向进度), 越界夹到两端.
 * 0 只剩首点, 1 原样返回全部点; 末点与读数都在相邻两点间线性插值.
 */
export function revealSeries(points: readonly Point[], values: readonly number[], progress: number): Reveal {
  const count = Math.min(points.length, values.length);
  if (count === 0) return { points: [], value: undefined };
  const at = Math.min(1, Math.max(0, progress)) * (count - 1);
  const index = Math.floor(at);
  const t = at - index;
  const head = points.slice(0, index + 1);
  if (t <= 0 || index >= count - 1) return { points: head, value: values[index] };
  const [x0, y0] = points[index];
  const [x1, y1] = points[index + 1];
  const tip: Point = [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
  return { points: [...head, tip], value: values[index] + (values[index + 1] - values[index]) * t };
}
