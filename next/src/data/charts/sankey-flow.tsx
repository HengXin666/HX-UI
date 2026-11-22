import { useEffect, useRef, useState } from "react";
import { Layer, Rectangle, Sankey } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

interface SankeyFlowProps {
  nodes: { name: string }[];
  /** source / target 是 nodes 的下标 */
  links: { source: number; target: number; value: number }[];
  format?: (v: number) => string;
  height?: number;
  className?: string;
}

interface NodeShape { x: number; y: number; width: number; height: number; index: number; payload: { name: string; value: number; depth?: number } }
interface LinkShape { sourceX: number; targetX: number; sourceY: number; targetY: number; sourceControlX: number; targetControlX: number; linkWidth: number; index: number; payload: { source: { depth?: number } } }

/** 桑基图: 流量从哪来到哪去 (渠道 → 落地页 → 成交, 预算分配). 节点按层上色. */
export function SankeyFlow({ nodes, links, format = (v) => v.toLocaleString("zh-CN"), height = 320, className }: SankeyFlowProps) {
  const config: ChartConfig = { value: { label: "流量" } };
  const color = (d = 0) => `var(--chart-${(d % 5) + 1})`;
  // 最后一层的节点把文字放左边, 其余放右边; 不按像素判断, 窄屏也对
  // 窄容器 (手机) 只写节点名, 最后一层也写在右侧并预留边距, 避免和中间层的字撞在一起
  const box = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setCompact(e.contentRect.width < 520));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const sinks = new Set(nodes.map((_, i) => i).filter((i) => !links.some((l) => l.source === i)));
  const NodeEl = ({ x, y, width, height: h, index, payload }: NodeShape) => {
    const right = !compact && sinks.has(index);
    return (
      <Layer>
        <Rectangle x={x} y={y} width={width} height={h} radius={2} fill={color(payload.depth)} />
        <text x={right ? x - 8 : x + width + 8} y={y + h / 2} textAnchor={right ? "end" : "start"} dominantBaseline="middle" fontSize={12} className="fill-foreground">
          {payload.name}{!compact && <tspan className="fill-muted-foreground tabular-nums"> {format(payload.value)}</tspan>}
        </text>
      </Layer>
    );
  };
  const LinkEl = ({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, payload }: LinkShape) => (
    <path d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none" stroke={color(payload.source.depth)} strokeOpacity={0.28} strokeWidth={Math.max(1, linkWidth)}
      className="transition-[stroke-opacity] duration-200 hover:[stroke-opacity:0.55]" />
  );
  return (
    <div ref={box} className={cn("w-full", className)}>
    <ChartContainer config={config} className="w-full [&_.recharts-sankey-link]:outline-none" style={{ height }}>
      <Sankey data={{ nodes, links }} node={NodeEl as never} link={LinkEl as never} nodePadding={18} nodeWidth={10} margin={{ left: 8, right: compact ? 40 : 8, top: 8, bottom: 8 }} iterations={48}>
        <ChartTooltip content={<ChartTooltipContent hideIndicator hideLabel formatter={(v, _n, item) => {
          const p = item.payload?.payload as { source?: { name: string }; target?: { name: string }; name?: string } | undefined;
          const name = p?.source && p?.target ? `${p.source.name} → ${p.target.name}` : p?.name;
          return <div className="flex w-full items-center justify-between gap-4"><span>{name}</span><span className="font-mono tabular-nums">{format(Number(v))}</span></div>;
        }} />} />
      </Sankey>
    </ChartContainer>
    </div>
  );
}
