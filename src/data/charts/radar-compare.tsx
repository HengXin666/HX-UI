"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { toConfig, type SeriesSpec } from "./helpers";
import { useChartAnimation, type ChartAnimationOptions } from "./animation";

interface RadarCompareProps {
  /** 每行一个维度 */
  data: object[];
  /** 维度名字段 */
  axis: string;
  series: SeriesSpec[];
  /** 网格形状 */
  grid?: "polygon" | "circle";
  /** 刻度上限, 默认自动 */
  max?: number;
  size?: number;
  className?: string;
  /** 增删维度时的动画. 默认按维度名配对: 多边形平滑变形, 新维度从圆心长出 */
  animation?: ChartAnimationOptions;
}

/** 雷达图: 多维评分对比 (竞品, 能力模型, 门店体检). */
export function RadarCompare({ data, axis, series, grid = "polygon", max, size = 300, className, animation }: RadarCompareProps) {
  const anim = useChartAnimation({ match: { dataKey: axis }, ...animation }, data.length);
  return (
    <ChartContainer config={toConfig(series)} className={cn("mx-auto aspect-square", className)} style={{ height: size }}>
      <RadarChart data={data} outerRadius="72%">
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <PolarGrid gridType={grid} />
        <PolarAngleAxis dataKey={axis} tick={{ fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, max ?? "auto"]} tick={false} axisLine={false} />
        {series.map((s, i) => (
          <Radar key={s.key} dataKey={s.key} stroke={`var(--color-${s.key})`} fill={`var(--color-${s.key})`} fillOpacity={i === 0 ? 0.28 : 0.12}
            strokeWidth={2} dot={{ r: 2.5, fillOpacity: 1 }} {...anim} />
        ))}
        {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
      </RadarChart>
    </ChartContainer>
  );
}
