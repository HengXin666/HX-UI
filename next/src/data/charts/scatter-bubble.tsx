import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { formatCompact } from "./area-trend";
import { useChartAnimation, type ChartAnimationOptions } from "./animation";

export interface ScatterGroup {
  key: string;
  label: string;
  color?: string;
  points: { x: number; y: number; z?: number; name?: string }[];
}

interface ScatterBubbleProps {
  groups: ScatterGroup[];
  xLabel: string;
  yLabel: string;
  /** 气泡大小字段的名字; 给了就按 z 画大小 */
  zLabel?: string;
  /** 气泡像素范围 */
  range?: [number, number];
  xFormatter?: (v: number) => string;
  yFormatter?: (v: number) => string;
  height?: number;
  className?: string;
  /** 数据变化时的动画. 默认按点的 name 配对: 同一个点平滑移位, 新点长出, 删掉的点缩回 */
  animation?: ChartAnimationOptions;
}

/** 散点 / 气泡图: 两个指标的相关性, 第三个指标用大小 (商品价格 vs 销量, 气泡 = 毛利). */
export function ScatterBubble({ groups, xLabel, yLabel, zLabel, range = [40, 520], xFormatter, yFormatter, height = 300, className, animation }: ScatterBubbleProps) {
  const anim = useChartAnimation({ match: { dataKey: "name" }, ...animation }, groups.reduce((s, g) => s + g.points.length, 0));
  const config: ChartConfig = {
    ...Object.fromEntries(groups.map((g, i) => [g.key, { label: g.label, color: g.color ?? `var(--chart-${(i % 5) + 1})` }])),
    x: { label: xLabel }, y: { label: yLabel }, ...(zLabel ? { z: { label: zLabel } } : {}),
  };
  return (
    <ChartContainer config={config} className={cn("w-full", className)} style={{ height }}>
      <ScatterChart margin={{ left: 4, right: 12, top: 12, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" name={xLabel} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={xFormatter ?? formatCompact} />
        <YAxis type="number" dataKey="y" name={yLabel} tickLine={false} axisLine={false} width={48} tickFormatter={yFormatter ?? formatCompact} />
        {zLabel && <ZAxis type="number" dataKey="z" name={zLabel} range={range} />}
        <ChartTooltip cursor={{ strokeDasharray: "4 4" }}
          content={<ChartTooltipContent hideLabel formatter={(v, n, item) => (
            <div className="flex w-full items-center justify-between gap-4">
              <span className="text-muted-foreground">{config[String(n)]?.label ?? n}{n === "x" && item.payload?.name ? ` · ${item.payload.name}` : ""}</span>
              <span className="font-mono font-medium tabular-nums">{n === "x" ? (xFormatter ?? formatCompact)(Number(v)) : n === "y" ? (yFormatter ?? formatCompact)(Number(v)) : formatCompact(Number(v))}</span>
            </div>
          )} />} />
        {groups.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
        {groups.map((g) => (
          <Scatter key={g.key} name={g.key} data={g.points} fill={`var(--color-${g.key})`} fillOpacity={zLabel ? 0.55 : 0.85} stroke={`var(--color-${g.key})`} {...anim} />
        ))}
      </ScatterChart>
    </ChartContainer>
  );
}
