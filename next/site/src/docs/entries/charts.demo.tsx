import { AreaTrend, BarCompare, Donut, Sparkline } from "@/data";
import type { DemoProps } from "../types";

const MONTHS = ["6月", "7月", "8月", "9月", "10月", "11月"];
const REV = [182000, 205000, 198000, 241000, 268000, 312000];
const COST = [121000, 133000, 129000, 150000, 162000, 171000];
const TREND = MONTHS.map((m, i) => ({ m, rev: REV[i], cost: COST[i] }));
const CHANNEL = [
  { ch: "官网", now: 128000, prev: 96000 },
  { ch: "小程序", now: 94000, prev: 88000 },
  { ch: "门店", now: 61000, prev: 72000 },
  { ch: "分销", now: 29000, prev: 18000 },
];
const SHARE = [
  { key: "web", label: "官网", value: 41 },
  { key: "mini", label: "小程序", value: 30 },
  { key: "store", label: "门店", value: 20 },
  { key: "agent", label: "分销", value: 9 },
];
const yuan = (n: number) => `${Math.round(n / 10000)}万`;

/** 真实场景: 经营看板的一张卡片 */
export default function ChartsDemo({ values }: DemoProps) {
  const type = String(values.type);
  const series2 = Boolean(values.compare);
  return (
    <div className="w-full max-w-2xl rounded-2xl border bg-background/85 p-5 shadow-float backdrop-blur">
      {type === "area" && (
        <>
          <p className="text-sm text-muted-foreground">近 6 个月营收</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">¥312,000 <span className="text-sm font-normal text-success">+16.4%</span></p>
          <AreaTrend className="mt-4" data={TREND} x="m" stacked={Boolean(values.stacked)} valueFormatter={yuan}
            series={series2 ? [{ key: "rev", label: "营收" }, { key: "cost", label: "成本" }] : [{ key: "rev", label: "营收" }]} />
        </>
      )}
      {type === "bar" && (
        <>
          <p className="text-sm text-muted-foreground">各渠道营收 · 本月与上月</p>
          <BarCompare className="mt-4" data={CHANNEL} x="ch" stacked={Boolean(values.stacked)} horizontal={Boolean(values.horizontal)}
            series={series2 ? [{ key: "now", label: "本月" }, { key: "prev", label: "上月" }] : [{ key: "now", label: "本月" }]} />
        </>
      )}
      {type === "donut" && (
        <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
          <Donut data={SHARE} center="¥31.2 万" centerLabel="本月营收" />
          <ul className="grid gap-2 text-sm">
            {SHARE.map((s, i) => (
              <li key={s.key} className="flex items-center gap-2">
                <span aria-hidden className="size-2.5 rounded-sm" style={{ background: `var(--chart-${i + 1})` }} />
                <span className="flex-1">{s.label}</span><span className="tabular-nums text-muted-foreground">{s.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {type === "sparkline" && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[["营收", "¥31.2 万", REV, "var(--chart-1)"], ["订单", "4,812", [3200, 3500, 3400, 3900, 4300, 4812], "var(--chart-2)"], ["退款率", "1.8%", [2.6, 2.4, 2.5, 2.1, 1.9, 1.8], "var(--chart-3)"]].map(([l, v, d, c]) => (
            <div key={l as string} className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">{l as string}</p>
              <p className="mt-0.5 font-semibold tabular-nums">{v as string}</p>
              <div className="mt-2" role="img" aria-label={`${l} 近 6 个月走势`}><Sparkline values={d as number[]} color={c as string} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
