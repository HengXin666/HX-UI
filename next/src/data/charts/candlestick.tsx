import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useChartAnimation } from "./animation";

export interface Candle {
  t: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandlestickProps {
  data: Candle[];
  /** 涨跌配色: cn = 红涨绿跌 (默认), us = 绿涨红跌 */
  scheme?: "cn" | "us";
  /** 均线周期, 如 [5, 10] */
  ma?: number[];
  showVolume?: boolean;
  format?: (v: number) => string;
  height?: number;
  className?: string;
}

interface ShapeProps { x?: number; y?: number; width?: number; height?: number; payload?: Candle & { range: [number, number] } }

/** K 线图: 开高低收 + 均线 + 成交量. 默认红涨绿跌. */
export function Candlestick({ data, scheme = "cn", ma = [5], showVolume = true, format = (v) => v.toFixed(2), height = 320, className }: CandlestickProps) {
  const anim = useChartAnimation({ match: "index", duration: 500 }, data.length);
  const up = scheme === "cn" ? "var(--destructive)" : "var(--success)";
  const down = scheme === "cn" ? "var(--success)" : "var(--destructive)";
  const rows = data.map((d, i) => {
    const row: Record<string, unknown> = { ...d, range: [d.low, d.high] };
    for (const n of ma) if (i >= n - 1) row[`ma${n}`] = data.slice(i - n + 1, i + 1).reduce((s, x) => s + x.close, 0) / n;
    return row;
  });
  const lo = Math.min(...data.map((d) => d.low)), hi = Math.max(...data.map((d) => d.high));
  const pad = (hi - lo) * 0.08;
  const vmax = Math.max(...data.map((d) => d.volume ?? 0));
  const config: ChartConfig = Object.fromEntries(ma.map((n, i) => [`ma${n}`, { label: `MA${n}`, color: `var(--chart-${((i + 2) % 5) + 1})` }]));
  const CandleShape = ({ x = 0, y = 0, width = 0, height: h = 0, payload }: ShapeProps) => {
    if (!payload) return null;
    const { open, close, high, low } = payload;
    const scale = (v: number) => y + ((high - v) / (high - low || 1)) * h;
    const c = close >= open ? up : down;
    const bw = Math.max(2, width * 0.7), cx = x + width / 2;
    const top = scale(Math.max(open, close)), bot = scale(Math.min(open, close));
    return (
      <g>
        <line x1={cx} x2={cx} y1={y} y2={y + h} stroke={c} strokeWidth={1.2} />
        <rect x={cx - bw / 2} y={top} width={bw} height={Math.max(1, bot - top)} fill={c} rx={1} />
      </g>
    );
  };
  return (
    <ChartContainer config={config} className={cn("w-full", className)} style={{ height }}>
      <ComposedChart data={rows} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="t" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} />
        <YAxis yAxisId="p" domain={[lo - pad, hi + pad]} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => format(v)} />
        {showVolume && <YAxis yAxisId="v" hide domain={[0, vmax * 4]} />}
        <ChartTooltip cursor={{ stroke: "var(--border)" }} content={({ active, payload }) => {
          const d = active && payload?.[0]?.payload as (Candle & Record<string, number>) | undefined;
          if (!d) return null;
          const chg = ((d.close - d.open) / d.open) * 100;
          return (
            <div className="grid min-w-36 gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
              <p className="font-medium">{d.t}</p>
              {(["open", "high", "low", "close"] as const).map((k) => (
                <p key={k} className="flex justify-between gap-4"><span className="text-muted-foreground">{{ open: "开", high: "高", low: "低", close: "收" }[k]}</span><span className="font-mono tabular-nums">{format(d[k])}</span></p>
              ))}
              <p className="flex justify-between gap-4"><span className="text-muted-foreground">涨跌</span><span className="font-mono tabular-nums" style={{ color: chg >= 0 ? up : down }}>{chg >= 0 ? "+" : ""}{chg.toFixed(2)}%</span></p>
              {d.volume != null && <p className="flex justify-between gap-4"><span className="text-muted-foreground">量</span><span className="font-mono tabular-nums">{d.volume.toLocaleString("zh-CN")}</span></p>}
            </div>
          );
        }} />
        {showVolume && (
          <Bar yAxisId="v" dataKey="volume" maxBarSize={10} {...anim}
            shape={(p: ShapeProps) => <rect x={p.x} y={p.y} width={p.width} height={p.height} fill={(p.payload?.close ?? 0) >= (p.payload?.open ?? 0) ? up : down} fillOpacity={0.25} />} />
        )}
        <Bar yAxisId="p" dataKey="range" maxBarSize={14} shape={<CandleShape />} {...anim} />
        {ma.map((n) => <Line key={n} yAxisId="p" dataKey={`ma${n}`} type="monotone" dot={false} stroke={`var(--color-ma${n})`} strokeWidth={1.5} {...anim} />)}
      </ComposedChart>
    </ChartContainer>
  );
}
