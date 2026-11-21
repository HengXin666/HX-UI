/**
 * 数据内核 (`@hx/ui/data`, src/viz/kernel-*) 的默认值与时间刻度档表. 比例尺与坐标轴只读这里, 不在函数里写魔法数.
 * .agents/notes/implemented/architecture/2026-11-19-omni-data-kernel.md
 */

/** 默认刻度数: 5 档左右是常见图表在 300~600px 宽度下不拥挤的数量. */
export const DEFAULT_TICK_COUNT = 5;

export const LOG_DEFAULT_BASE = 10;

/** band 默认留白: 内 0.1 外 0.1, 居中对齐. 与 Recharts 柱宽观感接近, 迁移时不跳. */
export const BAND_DEFAULTS = { paddingInner: 0.1, paddingOuter: 0.1, align: 0.5 } as const;

/** 标签防重叠: 等宽估算每字宽与最小间距 (px). 不测真实字宽, 纯函数可在服务端跑. */
export const AXIS_LABEL = { charWidth: 7, minGap: 4 } as const;

export const MS = {
  second: 1000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
} as const;

export type TimeUnit = "second" | "minute" | "hour" | "day" | "month" | "year";

/** 时间刻度档: 按跨度 / 刻度数选第一档不小于它的. 月与年按日历步进, 其余按毫秒步进 (均以 UTC 对齐, 结果与运行时区无关). */
export const TIME_INTERVALS: ReadonlyArray<{ unit: TimeUnit; step: number; approx: number }> = [
  { unit: "second", step: 1, approx: MS.second },
  { unit: "second", step: 5, approx: 5 * MS.second },
  { unit: "second", step: 15, approx: 15 * MS.second },
  { unit: "second", step: 30, approx: 30 * MS.second },
  { unit: "minute", step: 1, approx: MS.minute },
  { unit: "minute", step: 5, approx: 5 * MS.minute },
  { unit: "minute", step: 15, approx: 15 * MS.minute },
  { unit: "minute", step: 30, approx: 30 * MS.minute },
  { unit: "hour", step: 1, approx: MS.hour },
  { unit: "hour", step: 3, approx: 3 * MS.hour },
  { unit: "hour", step: 6, approx: 6 * MS.hour },
  { unit: "hour", step: 12, approx: 12 * MS.hour },
  { unit: "day", step: 1, approx: MS.day },
  { unit: "day", step: 2, approx: 2 * MS.day },
  { unit: "day", step: 7, approx: MS.week },
  { unit: "month", step: 1, approx: 30 * MS.day },
  { unit: "month", step: 3, approx: 91 * MS.day },
  { unit: "month", step: 6, approx: 182 * MS.day },
  { unit: "year", step: 1, approx: 365 * MS.day },
];

/** 每档的标签格式 (Intl.DateTimeFormat 选项). 时区固定 UTC, 与刻度对齐方式一致. */
export const TIME_LABEL_FORMAT: Readonly<Record<TimeUnit, Intl.DateTimeFormatOptions>> = {
  second: { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "UTC" },
  minute: { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" },
  hour: { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" },
  day: { month: "short", day: "numeric", timeZone: "UTC" },
  month: { year: "numeric", month: "short", timeZone: "UTC" },
  year: { year: "numeric", timeZone: "UTC" },
};

export const MONTHS_PER_YEAR = 12;

export type NumberStyle = "decimal" | "compact" | "percent" | "currency";

/** 抽稀与居中都按 2 分: 隔一取一, 相邻标签各占一半宽度, 带宽取中点. */
export const AXIS_PAIR = 2;
