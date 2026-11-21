import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const compact = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });
export const formatCompact = (v: number): string => compact.format(v);
import { toConfig, type SeriesSpec } from "./area-trend";

interface BarCompareProps {
  /** 行数据, 每行一个 x 值 + 各系列数值 */
  data: object[];
  /** x 轴字段名 */
  x: string;
  series: SeriesSpec[];
  stacked?: boolean;
  horizontal?: boolean;
  height?: number;
  className?: string;
  legend?: boolean;
}

/** 分组 / 堆叠柱状图, 可横向. */
export function BarCompare({ data, x, series, stacked, horizontal, height = 260, className, legend = series.length > 1 }: BarCompareProps) {
  return (
    <ChartContainer config={toConfig(series)} className={cn("w-full", className)} style={{ height }}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={horizontal} horizontal={!horizontal} strokeDasharray="3 3" />
        {horizontal ? (
          <>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey={x} tickLine={false} axisLine={false} width={72} />
          </>
        ) : (
          <>
            <XAxis dataKey={x} tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={formatCompact} />
          </>
        )}
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={<ChartTooltipContent />} />
        {legend && <ChartLegend content={<ChartLegendContent />} />}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId={stacked ? "a" : undefined}
            fill={`var(--color-${s.key})`}
            radius={stacked && i < series.length - 1 ? 0 : horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
