import { BAND_DEFAULTS, DEFAULT_TICK_COUNT, LOG_DEFAULT_BASE, MONTHS_PER_YEAR, TIME_INTERVALS, type TimeUnit } from "../constants/data-scale";
import { niceDomain, niceTicks, type Domain } from "./scale";

/**
 * 数据内核的比例尺. 连续型 (linear / log / sqrt / time) 共用一个接口, 离散型 (band / point) 另一个;
 * 线性的 nice 算法复用 viz/scale.ts, 不复制. 纯函数, 不碰 DOM.
 * .agents/notes/implemented/architecture/2026-11-19-omni-data-kernel.md
 */

export type ScaleKind = "linear" | "log" | "sqrt" | "time" | "band" | "point";

export interface ContinuousScale<D> {
  (value: D): number;
  readonly kind: "linear" | "log" | "sqrt" | "time";
  domain(): readonly [D, D];
  range(): Domain;
  ticks(count?: number): D[];
  invert(px: number): D;
  /** 外扩到 nice 边界, 返回新比例尺; 原比例尺不变. */
  nice(count?: number): ContinuousScale<D>;
}

export interface BandScale<K> {
  /** 带的起点 px; 不在定义域里的键返回 undefined, 调用方据此跳过. */
  (key: K): number | undefined;
  readonly kind: "band" | "point";
  domain(): readonly K[];
  range(): Domain;
  bandwidth(): number;
  step(): number;
  ticks(): K[];
}

export type Scale = ContinuousScale<number> | ContinuousScale<Date> | BandScale<string>;

function lerp(range: Domain, t: number): number {
  return range[0] + (range[1] - range[0]) * t;
}

function unlerp(range: Domain, px: number): number {
  const span = range[1] - range[0];
  return span === 0 ? 0 : (px - range[0]) / span;
}

/** 正反变换对: 把 linear / log / sqrt 统一成 "先变换定义域, 再线性映射". */
interface Transform {
  forward(v: number): number;
  backward(v: number): number;
}

const IDENTITY: Transform = { forward: (v) => v, backward: (v) => v };

function continuous(kind: "linear" | "log" | "sqrt", domain: Domain, range: Domain, tf: Transform, ticksOf: (d: Domain, n: number) => number[], niceOf: (d: Domain, n: number) => Domain): ContinuousScale<number> {
  const t0 = tf.forward(domain[0]);
  const t1 = tf.forward(domain[1]);
  const span = t1 - t0;
  const scale = ((value: number) => (span === 0 ? lerp(range, BAND_DEFAULTS.align) : lerp(range, (tf.forward(value) - t0) / span))) as ContinuousScale<number>;
  Object.assign(scale, {
    kind,
    domain: () => domain,
    range: () => range,
    ticks: (count = DEFAULT_TICK_COUNT) => ticksOf(domain, count),
    invert: (px: number) => tf.backward(t0 + unlerp(range, px) * span),
    nice: (count = DEFAULT_TICK_COUNT) => continuous(kind, niceOf(domain, count), range, tf, ticksOf, niceOf),
  });
  return scale;
}

export function scaleLinear(domain: Domain, range: Domain): ContinuousScale<number> {
  return continuous("linear", domain, range, IDENTITY, niceTicks, niceDomain);
}

/** 平方根比例尺: 气泡面积与数值成正比时用. 负值按 0 处理, 半径不会出现 NaN. */
export function scaleSqrt(domain: Domain, range: Domain): ContinuousScale<number> {
  const tf: Transform = { forward: (v) => Math.sqrt(Math.max(0, v)), backward: (v) => v * v };
  return continuous("sqrt", domain, range, tf, niceTicks, niceDomain);
}

/** 对数比例尺. 定义域含 ≤ 0 时直接抛错: 静默截断会让图看着对, 数却是错的. */
export function scaleLog(domain: Domain, range: Domain, base = LOG_DEFAULT_BASE): ContinuousScale<number> {
  if (domain[0] <= 0 || domain[1] <= 0) throw new RangeError(`scaleLog: 定义域必须为正, 收到 [${domain[0]}, ${domain[1]}]`);
  const ln = Math.log(base);
  const tf: Transform = { forward: (v) => Math.log(v) / ln, backward: (v) => Math.pow(base, v) };
  const powers = (d: Domain) => [Math.floor(tf.forward(Math.min(d[0], d[1]))), Math.ceil(tf.forward(Math.max(d[0], d[1])))] as const;
  const ticksOf = (d: Domain) => {
    const [lo, hi] = powers(d);
    const out: number[] = [];
    for (let p = lo; p <= hi; p += 1) out.push(Math.pow(base, p));
    return out.filter((v) => v >= Math.min(d[0], d[1]) && v <= Math.max(d[0], d[1]));
  };
  const niceOf = (d: Domain): Domain => {
    const [lo, hi] = powers(d);
    return [Math.pow(base, lo), Math.pow(base, hi)];
  };
  return continuous("log", domain, range, tf, ticksOf, niceOf);
}

/** 选时间刻度档: 第一档近似步长不小于 跨度 / 刻度数. */
export function timeInterval(span: number, count: number): (typeof TIME_INTERVALS)[number] {
  const target = span / Math.max(1, count);
  return TIME_INTERVALS.find((it) => it.approx >= target) ?? TIME_INTERVALS[TIME_INTERVALS.length - 1];
}

const UNIT_MS: Readonly<Record<Exclude<TimeUnit, "month" | "year">, number>> = { second: 1000, minute: 60_000, hour: 3_600_000, day: 86_400_000 };

/** 按档在 UTC 下生成刻度. 月与年走日历, 避免 30 天近似在长跨度上漂移. */
export function timeTicks(domain: readonly [Date, Date], count = DEFAULT_TICK_COUNT): Date[] {
  const lo = Math.min(domain[0].getTime(), domain[1].getTime());
  const hi = Math.max(domain[0].getTime(), domain[1].getTime());
  const { unit, step } = timeInterval(hi - lo, count);
  const out: Date[] = [];
  if (unit === "month" || unit === "year") {
    // 用 "自公元 0 年起的月序号" 对齐: 年档 step 年 = step * 12 个月, 结果落在能被 step 整除的年份的 1 月.
    const months = unit === "year" ? step * MONTHS_PER_YEAR : step;
    const start = new Date(lo);
    const atMonthStart = lo === Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1);
    const first = start.getUTCFullYear() * MONTHS_PER_YEAR + start.getUTCMonth() + (atMonthStart ? 0 : 1);
    for (let idx = Math.ceil(first / months) * months; ; idx += months) {
      const t = Date.UTC(Math.floor(idx / MONTHS_PER_YEAR), idx % MONTHS_PER_YEAR, 1);
      if (t > hi) break;
      out.push(new Date(t));
    }
    return out;
  }
  const size = UNIT_MS[unit] * step;
  for (let t = Math.ceil(lo / size) * size; t <= hi; t += size) out.push(new Date(t));
  return out;
}

export function scaleTime(domain: readonly [Date, Date], range: Domain): ContinuousScale<Date> {
  const inner = scaleLinear([domain[0].getTime(), domain[1].getTime()], range);
  const scale = ((value: Date) => inner(value.getTime())) as ContinuousScale<Date>;
  Object.assign(scale, {
    kind: "time",
    domain: () => domain,
    range: () => range,
    ticks: (count = DEFAULT_TICK_COUNT) => timeTicks(domain, count),
    invert: (px: number) => new Date(inner.invert(px)),
    nice: (count = DEFAULT_TICK_COUNT) => {
      const ticks = timeTicks(domain, count);
      const { approx } = timeInterval(domain[1].getTime() - domain[0].getTime(), count);
      const first = ticks[0]?.getTime() ?? domain[0].getTime();
      const last = ticks[ticks.length - 1]?.getTime() ?? domain[1].getTime();
      const lo = first > domain[0].getTime() ? first - approx : first;
      const hi = last < domain[1].getTime() ? last + approx : last;
      return scaleTime([new Date(lo), new Date(hi)], range);
    },
  });
  return scale;
}

export interface BandOptions {
  paddingInner?: number;
  paddingOuter?: number;
  /** 0 靠起点, 0.5 居中, 1 靠终点: 带总宽小于 range 时剩余空白怎么分. */
  align?: number;
}

function banded(kind: "band" | "point", keys: ReadonlyArray<string>, range: Domain, inner: number, outer: number, align: number): BandScale<string> {
  const n = keys.length;
  const span = range[1] - range[0];
  const step = n === 0 ? 0 : span / Math.max(1, n - inner + outer * 2);
  const bandwidth = kind === "point" ? 0 : step * (1 - inner);
  const start = range[0] + (span - step * (n - inner)) * align;
  const index = new Map(keys.map((k, i) => [k, i]));
  const scale = ((key: string) => {
    const i = index.get(key);
    return i === undefined ? undefined : start + step * i;
  }) as BandScale<string>;
  Object.assign(scale, {
    kind,
    domain: () => keys,
    range: () => range,
    bandwidth: () => bandwidth,
    step: () => step,
    ticks: () => [...keys],
  });
  return scale;
}

export function scaleBand(keys: ReadonlyArray<string>, range: Domain, options: BandOptions = {}): BandScale<string> {
  const inner = options.paddingInner ?? BAND_DEFAULTS.paddingInner;
  const outer = options.paddingOuter ?? BAND_DEFAULTS.paddingOuter;
  return banded("band", keys, range, inner, outer, options.align ?? BAND_DEFAULTS.align);
}

/** 点比例尺: 宽度为 0 的 band, 折线的类目轴用. paddingInner 固定 1, 让首尾点贴着外留白. */
export function scalePoint(keys: ReadonlyArray<string>, range: Domain, options: Omit<BandOptions, "paddingInner"> = {}): BandScale<string> {
  return banded("point", keys, range, 1, options.paddingOuter ?? 0, options.align ?? BAND_DEFAULTS.align);
}
