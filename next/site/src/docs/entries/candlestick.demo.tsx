import { useEffect, useMemo, useRef, useState } from "react";
import { Candlestick, type Candle, type CandleOverlay, type CandleSub } from "@/data";
import type { DemoProps } from "../types";
import { DataOps, seeded } from "./_chart";

/** 约 2.5 年的日线: 几何布朗运动 + 波动聚集, 成交量随涨跌幅放大, 只取交易日 */
const TRENDS = [0.0025, -0.0012, 0.002, 0.0008, -0.002, 0.0015, 0.0035];
function makeDaily(): Candle[] {
  const r = seeded(20261122);
  const gauss = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
  const out: Candle[] = [];
  let p = 24.6, vol = 0.018, trend = 0.0006;
  const d = new Date(2024, 6, 22);
  while (out.length < 600) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      trend = TRENDS[Math.floor(out.length / 90)] ?? 0.002; // 先涨, 回调, 再走出一段主升
      vol = Math.min(0.05, Math.max(0.008, vol * 0.94 + Math.abs(gauss()) * 0.0022));
      const ret = trend + gauss() * vol;
      const open = +(p * (1 + gauss() * vol * 0.25)).toFixed(2);
      const close = +(open * (1 + ret)).toFixed(2);
      const high = +(Math.max(open, close) * (1 + Math.abs(gauss()) * vol * 0.5)).toFixed(2);
      const low = +(Math.min(open, close) * (1 - Math.abs(gauss()) * vol * 0.5)).toFixed(2);
      const volume = Math.round(4_000_000 * (0.6 + r() * 0.5) * (1 + Math.abs(ret) * 40));
      out.push({ t: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, open, high, low, close, volume });
      p = close;
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}
const DAILY = makeDaily();

/** 日线合成周线 / 月线 */
function group(daily: Candle[], key: (t: string) => string, label: (c: Candle[]) => string): Candle[] {
  const map = new Map<string, Candle[]>();
  for (const c of daily) { const k = key(c.t); (map.get(k) ?? map.set(k, []).get(k)!).push(c); }
  return [...map.values()].map((g) => ({
    t: label(g), open: g[0].open, close: g[g.length - 1].close,
    high: Math.max(...g.map((c) => c.high)), low: Math.min(...g.map((c) => c.low)),
    volume: g.reduce((s, c) => s + (c.volume ?? 0), 0),
  }));
}
const weekKey = (t: string) => { const d = new Date(t); const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return mon.toISOString().slice(0, 10); };
const WEEKLY = group(DAILY, weekKey, (g) => g[g.length - 1].t);
const MONTHLY = group(DAILY, (t) => t.slice(0, 7), (g) => g[0].t.slice(0, 7));

/** 下一个周期的日期标签: 日线跳过周末, 周线 +7 天, 月线 +1 月 */
function nextLabel(t: string, period: string) {
  if (period === "month") { const [y, mo] = t.split("-").map(Number); return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`; }
  const d = new Date(`${t}T00:00:00`);
  do d.setDate(d.getDate() + (period === "week" ? 7 : 1)); while (period === "day" && (d.getDay() === 0 || d.getDay() === 6));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CandlestickDemo({ values }: DemoProps) {
  const period = String(values.period);
  const base = period === "week" ? WEEKLY : period === "month" ? MONTHLY : DAILY;
  // 演示数据为虚构: 推送 = 收盘后新增一根, 跳动 = 盘中最新一根的价格变化
  const [data, setData] = useState(base);
  useEffect(() => setData(base), [base]);
  const rnd = useRef(seeded(7));
  const g = () => Math.sqrt(-2 * Math.log(rnd.current() || 1e-9)) * Math.cos(2 * Math.PI * rnd.current());
  const vol = period === "month" ? 0.08 : period === "week" ? 0.04 : 0.02;
  const last = data[data.length - 1], prev = data[data.length - 2];
  const chg = ((last.close - prev.close) / prev.close) * 100;
  const cn = values.scheme === "cn";
  const tone = chg >= 0 === cn ? "text-destructive" : "text-success";
  const ma = useMemo(() => String(values.ma).split(",").map(Number), [values.ma]);
  return (
    <div className="w-full max-w-4xl rounded-2xl border bg-background/85 p-4 shadow-float backdrop-blur sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-semibold">HX 科技 <span className="font-mono text-xs font-normal text-muted-foreground">688001.SH</span></p>
        <p className={`font-mono text-2xl font-semibold tabular-nums ${tone}`}>{last.close.toFixed(2)}</p>
        <p className={`font-mono text-sm tabular-nums ${tone}`}>{chg >= 0 ? "+" : ""}{(last.close - prev.close).toFixed(2)} {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%</p>
        <p className="ml-auto text-xs text-muted-foreground">{period === "week" ? "周 K" : period === "month" ? "月 K" : "日 K"} · 滚轮缩放 · 拖动平移 · 双击回到最新</p>
      </div>
      <DataOps
        addLabel="推送新 K 线" removeLabel="撤回最新一根" canRemove={data.length > base.length - 20}
        onAdd={() => setData((d) => {
          const l = d[d.length - 1];
          const open = +(l.close * (1 + g() * vol * 0.2)).toFixed(2);
          const close = +(open * (1 + g() * vol)).toFixed(2);
          const high = +(Math.max(open, close) * (1 + Math.abs(g()) * vol * 0.4)).toFixed(2);
          const low = +(Math.min(open, close) * (1 - Math.abs(g()) * vol * 0.4)).toFixed(2);
          return [...d, { t: nextLabel(l.t, period), open, high, low, close, volume: Math.round((l.volume ?? 4e6) * (0.7 + rnd.current() * 0.6)) }];
        })}
        onRemove={() => setData((d) => d.slice(0, -1))}
        updateLabel="最新价跳动"
        onUpdate={() => setData((d) => {
          const l = d[d.length - 1];
          const close = +(l.close * (1 + g() * vol * 0.5)).toFixed(2);
          return [...d.slice(0, -1), { ...l, close, high: Math.max(l.high, close), low: Math.min(l.low, close), volume: Math.round((l.volume ?? 0) * 1.05) }];
        })}
        onReset={() => setData(base)}
      />
      <Candlestick data={data} name="HX 科技 K 线" scheme={values.scheme as "cn" | "us"} overlay={values.overlay as CandleOverlay} ma={ma}
        sub={values.sub as CandleSub} showVolume={Boolean(values.showVolume)} hollow={Boolean(values.hollow)} visible={period === "month" ? 30 : period === "week" ? 60 : 90} />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </div>
  );
}
