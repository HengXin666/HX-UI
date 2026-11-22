import { useEffect, useMemo, useRef, useState } from "react";
import { aShareMinutes, Intraday, type IntradayPoint } from "@/data";
import type { DemoProps } from "../types";
import { DataOps, seeded } from "./_chart";

const MIN = aShareMinutes();
const PREV = 36.12;
/** 一整天的分钟线: 开盘冲高, 午前回落, 午后慢慢走强; 量在开盘和尾盘放大 */
function makeDay(): IntradayPoint[] {
  const r = seeded(20261123);
  const g = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
  let p = PREV * 1.004;
  return MIN.map((t, i) => {
    const drift = i < 25 ? 0.0009 : i < 110 ? -0.00045 : 0.00035;
    p *= 1 + drift + g() * 0.0011;
    const u = i / 240;
    const vol = Math.round(42000 * (0.35 + 1.6 * Math.exp(-u * 14) + 0.9 * Math.exp(-(1 - u) * 12)) * (0.6 + r() * 0.8));
    return { t, price: +p.toFixed(2), volume: vol };
  });
}
const DAY = makeDay();
const START = { open: 30, noon: 150, close: 241 } as Record<string, number>;

export default function IntradayDemo({ values }: DemoProps) {
  const stage = String(values.stage);
  // 演示数据为虚构: 推进 = 走一分钟, 撤回 = 退一分钟, 跳动 = 最新这一分钟价格变化
  const [n, setN] = useState(START[stage] ?? 150);
  const [ticks, setTicks] = useState<Record<number, number>>({});
  useEffect(() => { setN(START[stage] ?? 150); setTicks({}); }, [stage]);
  const rnd = useRef(seeded(9));
  const data = useMemo(() => DAY.slice(0, n).map((d, i) => (ticks[i] != null ? { ...d, price: ticks[i] } : d)), [n, ticks]);
  const last = data[data.length - 1];
  const chg = last.price - PREV;
  const cn = values.scheme === "cn";
  const tone = chg >= 0 === cn ? "text-destructive" : "text-success";
  return (
    <div className="w-full max-w-4xl rounded-2xl border bg-background/85 p-4 shadow-float backdrop-blur sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-semibold">HX 科技 <span className="font-mono text-xs font-normal text-muted-foreground">688001.SH</span></p>
        <p className={`font-mono text-2xl font-semibold tabular-nums ${tone}`}>{last.price.toFixed(2)}</p>
        <p className={`font-mono text-sm tabular-nums ${tone}`}>{chg >= 0 ? "+" : ""}{chg.toFixed(2)} {chg >= 0 ? "+" : ""}{((chg / PREV) * 100).toFixed(2)}%</p>
        <p className="ml-auto font-mono text-xs text-muted-foreground">{last.t} · 昨收 {PREV.toFixed(2)}</p>
      </div>
      <DataOps
        addLabel="推进一分钟" removeLabel="撤回一分钟" updateLabel="最新价跳动" canAdd={n < MIN.length} canRemove={n > 2}
        onAdd={() => setN((v) => Math.min(MIN.length, v + 1))}
        onRemove={() => { setN((v) => Math.max(2, v - 1)); }}
        onUpdate={() => setTicks((tk) => ({ ...tk, [n - 1]: +(last.price * (1 + (rnd.current() - 0.45) * 0.012)).toFixed(2) }))}
        onReset={() => { setN(START[stage] ?? 150); setTicks({}); }}
      />
      <Intraday data={data} prevClose={PREV} name="HX 科技分时" scheme={values.scheme as "cn" | "us"} showAvg={Boolean(values.showAvg)} showVolume={Boolean(values.showVolume)} />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </div>
  );
}
