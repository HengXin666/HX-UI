/**
 * `@hx/ui/data/recharts` 入口: Recharts 套壳图降为适配器. 多轴, 饼图, 雷达这些自研内核还没有的图从这里取;
 * `toRechartsRows` / `barRowsToRecharts` 把 `@hx/ui/data` 的序列与柱行转成 Recharts 的记录数组, 两套图共用一份数据.
 * 主入口的 HxLineChart 等仍可用, 已标为过渡转发, 1.0 移出主包.
 * .agents/notes/implemented/architecture/2026-11-19-omni-data-kernel.md
 */
import { RECHARTS_KEY } from "../constants/data-stage";
import type { TimeUnit } from "../constants/data-scale";
import type { SeriesDef } from "../charts/Charts";
import type { BarRow } from "../viz/charts/Bar";
import type { LineSeries } from "../viz/charts/Line";
import { formatTime } from "../viz/kernel-format";

export { ChartFrame, ChartChrome, ChartTooltip, CHART_THEME, CHART_AXIS, CHART_GRID, seriesColor, type ChartFrameProps } from "../charts/ChartFrame";
export { useChartAnimation } from "../charts/useChartAnimation";
export { buildAnimationProps, shouldDisableAnimation, ANIMATION_POINT_LIMIT, type ChartAnimationOptions, type AnimationMatchMode, type MatchSpec } from "../charts/animation";
export {
  HxLineChart, HxAreaChart, HxBarChart, HxPieChart, HxRadarChart, HxRadialChart, type SeriesDef, type LineChartProps, type AreaChartProps, type BarChartProps, type PieChartProps, type RadarChartProps,
  type RadialChartProps,
} from "../charts/Charts";

export type RechartsRow = Record<string, string | number | undefined>;

export interface RechartsData {
  data: RechartsRow[];
  series: SeriesDef[];
}

export interface RowsOptions {
  /** 横轴记录键, 默认 "name". */
  xKey?: string;
  /** 横轴是日期时的标签档, 默认按日. 标签按 UTC, 与 `@hx/ui/data` 的时间轴一致. */
  timeUnit?: TimeUnit;
  locale?: string;
}

function xLabel(x: readonly string[] | readonly Date[] | undefined, index: number, options: RowsOptions): string {
  const value = x?.[index];
  if (value === undefined) {
    return String(index);
  }
  return value instanceof Date ? formatTime(value, options.timeUnit ?? "day", options.locale) : value;
}

/** Line / Area 的序列 → Recharts 记录: 每个横轴位置一行, 每条序列以 id 为键. 横轴缺省按序号; 序列短的位置留 undefined (Recharts 断线). */
export function toRechartsRows(series: readonly LineSeries[], x?: readonly string[] | readonly Date[], options: RowsOptions = {}): RechartsData {
  const xKey = options.xKey ?? RECHARTS_KEY.x;
  const count = Math.max(x?.length ?? 0, ...series.map((s) => s.values.length));
  const data: RechartsRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const row: RechartsRow = { [xKey]: xLabel(x, i, options) };
    for (const s of series) {
      row[s.id] = s.values[i];
    }
    data.push(row);
  }
  return { data, series: series.map((s) => ({ dataKey: s.id, name: s.label })) };
}

/** Bar 的行 → Recharts 记录. 单序列 (value) 的键是 "value"; 多序列按 series 的 id 展开, 没给 series 时报错, 因为键名无从得知. */
export function barRowsToRecharts(rows: readonly BarRow[], series?: readonly { id: string; label: string }[], options: Pick<RowsOptions, "xKey"> = {}): RechartsData {
  const xKey = options.xKey ?? RECHARTS_KEY.x;
  const multi = rows.some((r) => r.values !== undefined);
  if (multi && series === undefined) {
    throw new TypeError("barRowsToRecharts: 多序列的柱行需要 series 才能命名记录键");
  }
  const data = rows.map((r) => {
    const row: RechartsRow = { [xKey]: r.label };
    if (multi && series !== undefined) {
      series.forEach((s, i) => {
        row[s.id] = r.values?.[i];
      });
    } else {
      row[RECHARTS_KEY.value] = r.value;
    }
    return row;
  });
  const defs: SeriesDef[] = multi && series !== undefined ? series.map((s) => ({ dataKey: s.id, name: s.label })) : [{ dataKey: RECHARTS_KEY.value }];
  return { data, series: defs };
}
