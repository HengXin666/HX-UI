import { Label, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

interface DonutProps {
  data: { key: string; label: string; value: number; color?: string }[];
  /** 中间的大字, 默认是总和 */
  center?: string;
  centerLabel?: string;
  size?: number;
  className?: string;
}

/** 环形占比图, 中心报总数. */
export function Donut({ data, center, centerLabel = "总计", size = 220, className }: DonutProps) {
  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.key, { label: d.label, color: d.color ?? `var(--chart-${(i % 5) + 1})` }]),
  );
  const rows = data.map((d) => ({ ...d, fill: `var(--color-${d.key})` }));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ChartContainer config={config} className={cn("mx-auto aspect-square", className)} style={{ height: size }}>
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
        <Pie data={rows} dataKey="value" nameKey="key" innerRadius="62%" outerRadius="88%" paddingAngle={2} cornerRadius={4} strokeWidth={0}>
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox)) return null;
              return (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 6} className="fill-foreground text-2xl font-semibold tabular">
                    {center ?? total.toLocaleString("zh-CN")}
                  </tspan>
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 16} className="fill-muted-foreground text-xs">{centerLabel}</tspan>
                </text>
              );
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
