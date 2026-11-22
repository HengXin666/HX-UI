import { Candlestick, type Candle } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, seeded } from "./_chart";

const r = seeded(3);
let p = 38.2;
const DATA: Candle[] = Array.from({ length: 48 }, (_, i) => {
  const d = new Date(2026, 8, 1); d.setDate(d.getDate() + Math.floor(i * 1.4));
  const open = p; const close = +(open * (1 + (r() - 0.47) * 0.06)).toFixed(2);
  const high = +(Math.max(open, close) * (1 + r() * 0.02)).toFixed(2); const low = +(Math.min(open, close) * (1 - r() * 0.02)).toFixed(2);
  p = close;
  return { t: `${d.getMonth() + 1}/${d.getDate()}`, open, high, low, close, volume: Math.round(80000 + r() * 160000) };
});
const last = DATA[DATA.length - 1], first = DATA[0];

export default function CandlestickDemo({ values }: DemoProps) {
  const up = last.close >= first.open; const cn = values.scheme === "cn";
  const c = up === cn ? "text-destructive" : "text-success";
  return (
    <ChartCard title="HXUI · 日 K" value={last.close.toFixed(2)} delta={<span className={c}>{up ? "+" : ""}{(((last.close - first.open) / first.open) * 100).toFixed(2)}%</span>} wide>
      <Candlestick data={DATA} scheme={values.scheme as "cn" | "us"} ma={values.ma === "none" ? [] : String(values.ma).split(",").map(Number)} showVolume={Boolean(values.showVolume)} />
    </ChartCard>
  );
}
