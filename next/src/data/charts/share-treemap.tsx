import { Treemap } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useChartAnimation } from "./animation";

export interface TreemapNode {
  name: string;
  value?: number;
  children?: TreemapNode[];
}

interface ShareTreemapProps {
  /** 一层: 各项; 两层: 分组 + 子项, 同组同色 */
  data: TreemapNode[];
  format?: (v: number) => string;
  height?: number;
  className?: string;
}

interface CellProps {
  x?: number; y?: number; width?: number; height?: number; depth?: number; index?: number; name?: string; value?: number;
  root?: { children?: unknown[] }; colorIndex?: number;
}

/** 矩形树图: 面积即占比, 适合类目 / 品牌 / SKU 的结构 (比环形图装得下更多项). */
export function ShareTreemap({ data, format = (v) => v.toLocaleString("zh-CN"), height = 300, className }: ShareTreemapProps) {
  const anim = useChartAnimation({ match: "index" }, data.length);
  const nested = data.some((d) => d.children?.length);
  // 每个顶层分组一种颜色, 子项继承
  const rows = data.map((d, i) => ({ ...d, colorIndex: i % 5, children: d.children?.map((c) => ({ ...c, colorIndex: i % 5 })) }));
  const config: ChartConfig = { value: { label: "数值" } };
  const Cell = ({ x = 0, y = 0, width = 0, height: h = 0, depth = 0, name, value, colorIndex = 0 }: CellProps) => {
    const leaf = nested ? depth === 2 : depth === 1;
    if (depth === 0) return null;
    if (!leaf) return <rect x={x} y={y} width={width} height={h} fill="none" stroke="var(--background)" strokeWidth={3} />;
    const show = width > 54 && h > 30;
    return (
      <g>
        <rect x={x + 1} y={y + 1} width={Math.max(0, width - 2)} height={Math.max(0, h - 2)} rx={6} fill={`var(--chart-${colorIndex + 1})`} fillOpacity={0.88} className="transition-[fill-opacity] duration-200 hover:fill-opacity-100" />
        {show && <text x={x + 9} y={y + 19} fill="white" fontSize={12} fontWeight={600}>{name}</text>}
        {show && h > 46 && <text x={x + 9} y={y + 35} fill="white" fillOpacity={0.8} fontSize={11} className="tabular-nums">{format(value ?? 0)}</text>}
      </g>
    );
  };
  return (
    <ChartContainer config={config} className={cn("w-full", className)} style={{ height }}>
      <Treemap data={rows as never} dataKey="value" nameKey="name" aspectRatio={4 / 3} content={<Cell />} {...anim}>
        <ChartTooltip content={<ChartTooltipContent hideIndicator formatter={(v, _n, item) => (
          <div className="flex w-full items-center justify-between gap-4"><span>{item.payload?.name}</span><span className="font-mono tabular-nums">{format(Number(v))}</span></div>
        )} />} />
      </Treemap>
    </ChartContainer>
  );
}
