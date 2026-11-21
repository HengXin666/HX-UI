import { AXIS_LABEL, AXIS_PAIR, DEFAULT_TICK_COUNT } from "../constants/data-scale";
import { punchDomain, type Domain } from "./scale";
import { formatNumber, formatTime } from "./kernel-format";
import { timeInterval, type BandScale, type ContinuousScale, type Scale } from "./kernel-scale";

/**
 * 坐标轴的刻度与标签. 只算数据, 不画: 图种拿 { value, px, label } 自己出 SVG 或 Canvas.
 * .agents/notes/implemented/architecture/2026-11-19-omni-data-kernel.md
 */

export interface AxisTick<V> {
  value: V;
  px: number;
  label: string;
}

export interface AxisOptions<V> {
  count?: number;
  locale?: string;
  /** 自定义标签; 不给时数字走 formatNumber, 时间按刻度档走 formatTime, 类目原样. */
  format?: (value: V) => string;
  /** 每字估算宽度与最小间距, 用于抽稀. 竖轴传 { charWidth: 行高 } 即按行高判断. */
  label?: Partial<Record<keyof typeof AXIS_LABEL, number>>;
}

function isBand(scale: Scale): scale is BandScale<string> {
  return scale.kind === "band" || scale.kind === "point";
}

/** 标签放不下时隔一取一, 直到相邻标签不重叠或只剩首尾. 用等宽估算, 服务端也能跑. */
export function thinTicks<V>(ticks: ReadonlyArray<AxisTick<V>>, label: Partial<Record<keyof typeof AXIS_LABEL, number>> = {}): AxisTick<V>[] {
  const charWidth = label.charWidth ?? AXIS_LABEL.charWidth;
  const minGap = label.minGap ?? AXIS_LABEL.minGap;
  const fits = (list: ReadonlyArray<AxisTick<V>>) =>
    list.every((t, i) => i === 0 || Math.abs(t.px - list[i - 1].px) >= ((t.label.length + list[i - 1].label.length) / AXIS_PAIR) * charWidth + minGap);
  let list = [...ticks];
  while (list.length > AXIS_PAIR && !fits(list)) list = list.filter((_, i) => i % AXIS_PAIR === 0);
  return list;
}

export function axisTicks(scale: BandScale<string>, options?: AxisOptions<string>): AxisTick<string>[];
export function axisTicks(scale: ContinuousScale<Date>, options?: AxisOptions<Date>): AxisTick<Date>[];
export function axisTicks(scale: ContinuousScale<number>, options?: AxisOptions<number>): AxisTick<number>[];
export function axisTicks(scale: Scale, options: AxisOptions<never> = {}): AxisTick<unknown>[] {
  const count = options.count ?? DEFAULT_TICK_COUNT;
  const custom = options.format as ((v: unknown) => string) | undefined;
  let raw: AxisTick<unknown>[];
  if (isBand(scale)) {
    const half = scale.bandwidth() / AXIS_PAIR;
    raw = scale.ticks().map((key) => ({ value: key, px: (scale(key) ?? 0) + half, label: custom ? custom(key) : key }));
  } else if (scale.kind === "time") {
    const s = scale as ContinuousScale<Date>;
    const [a, b] = s.domain();
    const { unit } = timeInterval(Math.abs(b.getTime() - a.getTime()), count);
    raw = s.ticks(count).map((d) => ({ value: d, px: s(d), label: custom ? custom(d) : formatTime(d, unit, options.locale) }));
  } else {
    const s = scale as ContinuousScale<number>;
    raw = s.ticks(count).map((v) => ({ value: v, px: s(v), label: custom ? custom(v) : formatNumber(v, { locale: options.locale }) }));
  }
  return thinTicks(raw, options.label);
}

export interface Rescale {
  domain: Domain;
  /** 新值越过旧域, 域已外扩: 调用方据此播 axis-rescale-shock. */
  shocked: boolean;
}

/** 坐标轴冲击的判定. 只外扩不收缩, 未越界时返回原域引用. */
export function axisRescale(current: Domain, values: readonly number[], count = DEFAULT_TICK_COUNT): Rescale {
  const domain = punchDomain(current, values, count);
  return { domain, shocked: domain !== current };
}
