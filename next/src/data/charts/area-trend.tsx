import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useChartAnimation, type ChartAnimationOptions } from "./animation";

const compact = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });
export const formatCompact = (v: number): string => compact.format(v);

export interface SeriesSpec {
  key: string;
  label: string;
  color?: string;
}

interface AreaTrendProps {
  /** 行数据, 每行一个 x 值 + 各系列数值 */
  data: object[];
  /** x 轴字段名 */
  x: string;
  series: SeriesSpec[];
  stacked?: boolean;
  height?: number;
  className?: string;
  valueFormatter?: (v: number) => string;
  showAxis?: boolean;
  /** 数据更新时的动画策略, 见 animation.ts. 实时追加用默认 append, 滑动窗口用 { match: { dataKey } } */
  animation?: ChartAnimationOptions;
}

export function toConfig(series: SeriesSpec[]): ChartConfig {
  return Object.fromEntries(
    series.map((s, i) => [s.key, { label: s.label, color: s.color ?? `var(--chart-${(i % 5) + 1})` }]),
  );
}

/** 面积趋势图: 渐变填充, 可堆叠. 首次绘制完整动画, 之后只动增量, 实时数据不抖. */
export function AreaTrend({ data, x, series, stacked, height = 260, className, valueFormatter, showAxis = true, animation }: AreaTrendProps) {
  const uid = useId().replace(/:/g, "");
  const anim = useChartAnimation(animation, data.length);
  return (
    <ChartContainer config={toConfig(series)} className={cn("w-full", className)} style={{ height }}>
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`var(--color-${s.key})`} stopOpacity={0.35} />
              <stop offset="95%" stopColor={`var(--color-${s.key})`} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        {showAxis && <XAxis dataKey={x} tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />}
        {showAxis && <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={valueFormatter ?? formatCompact} />}
        <ChartTooltip cursor={{ strokeDasharray: "4 4" }} content={<ChartTooltipContent indicator="line" />} />
        {series.map((s) => (
          <Area
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stackId={stacked ? "a" : undefined}
            stroke={`var(--color-${s.key})`}
            strokeWidth={2}
            fill={`url(#${uid}-${s.key})`}
            {...anim}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
