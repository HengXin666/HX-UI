import { TIME_LABEL_FORMAT, type NumberStyle, type TimeUnit } from "../constants/data-scale";

/**
 * 数字与时间的格式化统一走 Intl, 图表, 指标件, 提示框共用. 格式器按参数缓存: Intl 构造开销远大于 format 本身,
 * 坐标轴一次要格式化几十个刻度.
 * .agents/notes/implemented/architecture/2026-11-19-omni-data-kernel.md
 */

export interface NumberFormatOptions {
  locale?: string;
  style?: NumberStyle;
  /** style 为 currency 时必填, 例如 CNY. */
  currency?: string;
  /** 最多小数位. compact 缺省 1, 其余缺省交给 Intl. */
  digits?: number;
}

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

function cached<T extends Intl.NumberFormat | Intl.DateTimeFormat>(key: string, make: () => T): T {
  let hit = cache.get(key) as T | undefined;
  if (!hit) {
    hit = make();
    cache.set(key, hit);
  }
  return hit;
}

function numberOptions({ style = "decimal", currency, digits }: NumberFormatOptions): Intl.NumberFormatOptions {
  if (style === "compact") return { notation: "compact", maximumFractionDigits: digits ?? 1 };
  if (style === "percent") return { style: "percent", maximumFractionDigits: digits };
  if (style === "currency") {
    if (!currency) throw new RangeError("formatNumber: style 为 currency 时必须给 currency");
    return { style: "currency", currency, maximumFractionDigits: digits };
  }
  return { maximumFractionDigits: digits };
}

export function formatNumber(value: number, options: NumberFormatOptions = {}): string {
  const opts = numberOptions(options);
  const key = `n|${options.locale ?? ""}|${JSON.stringify(opts)}`;
  return cached(key, () => new Intl.NumberFormat(options.locale, opts)).format(value);
}

/** 按刻度档选格式 (见 TIME_LABEL_FORMAT), 时区固定 UTC, 与 timeTicks 的对齐一致. */
export function formatTime(value: Date, unit: TimeUnit, locale?: string): string {
  const key = `t|${locale ?? ""}|${unit}`;
  return cached(key, () => new Intl.DateTimeFormat(locale, TIME_LABEL_FORMAT[unit])).format(value);
}
