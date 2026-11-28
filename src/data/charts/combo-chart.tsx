"use client";

import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { formatCompact, toConfig, type SeriesSpec } from "./helpers";
import { useChartAnimation, type ChartAnimationOptions } from "./animation";

interface ComboChartProps {
  data: object[];
  x: string;
  /** 柱: 用左轴 */
  bars: SeriesSpec[];
  /** 线: 默认用右轴 (比如转化率, 增长率) */
  lines: SeriesSpec[];
  stacked?: boolean;
  /** 线是否单独用右轴, 默认 true */
  dualAxis?: boolean;
  barFormatter?: (v: number) => string;
  lineFormatter?: (v: number) => string;
  height?: number;
  className?: string;
  animation?: ChartAnimationOptions;
}

/** 柱 + 线组合图, 双轴: 量用柱, 率用线. 经营看板最常见的一张图. */
export function ComboChart({ data, x, bars, lines, stacked, dualAxis = true, barFormatter, lineFormatter, height = 280, className, animation }: ComboChartProps) {
  const anim = useChartAnimation({ match: "index", ...animation }, data.length);
  const all = [...bars, ...lines.map((l, i) => ({ ...l, color: l.color ?? `var(--chart-${((bars.length + i) % 5) + 1})` }))];
  return (
    <ChartContainer config={toConfig(all)} className={cn("w-full", className)} style={{ height }}>
      <ComposedChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={x} tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis yAxisId="l" tickLine={false} axisLine={false} width={48} tickFormatter={barFormatter ?? formatCompact} />
        {dualAxis && <YAxis yAxisId="r" orientation="right" tickLine={false} axisLine={false} width={44} tickFormatter={lineFormatter ?? formatCompact} />}
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {bars.map((s, i) => (
          <Bar key={s.key} yAxisId="l" dataKey={s.key} stackId={stacked ? "a" : undefined} fill={`var(--color-${s.key})`}
            radius={stacked && i < bars.length - 1 ? 0 : [5, 5, 0, 0]} maxBarSize={32} {...anim} />
        ))}
        {lines.map((s) => (
          <Line key={s.key} yAxisId={dualAxis ? "r" : "l"} dataKey={s.key} type="monotone" stroke={`var(--color-${s.key})`} strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--background)", strokeWidth: 2 }} activeDot={{ r: 5 }} {...anim} />
        ))}
      </ComposedChart>
    </ChartContainer>
  );
}
