import { useEffect, useMemo, useRef, useState } from "react";
import { VolumeProfile, type ProfileBin } from "@/data";
import type { DemoProps } from "../types";
import { DataOps, seeded } from "./_chart";

/** 一个交易日: 收盘价附近成交最密, 高低点之间都有量 */
type Day = { close: number; hi: number; lo: number; vol: number };
function makeDays(n: number): Day[] {
  const r = seeded(314);
  let p = 31;
  return Array.from({ length: n }, (_, i) => {
    p *= 1 + (i < 25 ? 0.006 : i < 45 ? -0.004 : 0.003) + (r() - 0.5) * 0.03;
    const range = p * (0.02 + r() * 0.03);
    return { close: +p.toFixed(2), hi: p + range * r(), lo: p - range * r(), vol: 2e6 * (0.5 + r()) };
  });
}
const DAYS = makeDays(60);

function profile(days: Day[], step: number): ProfileBin[] {
  const map = new Map<number, number>();
  for (const d of days) {
    const a = Math.floor(d.lo / step), z = Math.floor(d.hi / step);
    const weights: [number, number][] = [];
    for (let k = a; k <= z; k++) { const mid = (k + 0.5) * step; weights.push([k, Math.exp(-(((mid - d.close) / Math.max(step, (d.hi - d.lo) / 2)) ** 2))]); }
    const sum = weights.reduce((s, [, w]) => s + w, 0) || 1;
    for (const [k, w] of weights) map.set(k, (map.get(k) ?? 0) + (d.vol * w) / sum);
  }
  return [...map].map(([k, v]) => ({ price: +(k * step).toFixed(2), volume: Math.round(v) }));
}

export default function VolumeProfileDemo({ values }: DemoProps) {
  const step = Number(values.binSize);
  // 演示数据为虚构: 新增 = 叠加一个交易日, 删除 = 去掉最早一天, 更新 = 现价变化
  const [days, setDays] = useState(DAYS);
  const [price, setPrice] = useState(DAYS[DAYS.length - 1].close);
  const rnd = useRef(seeded(27));
  useEffect(() => { setDays(DAYS); setPrice(DAYS[DAYS.length - 1].close); }, [step]);
  const bins = useMemo(() => profile(days, step), [days, step]);
  return (
    <div className="w-full max-w-3xl rounded-2xl border bg-background/85 p-4 shadow-float backdrop-blur sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="font-semibold">HX 科技 · 近 {days.length} 个交易日筹码</p>
        <p className="font-mono text-xs text-muted-foreground">档位 {step} 元</p>
      </div>
      <DataOps
        addLabel="叠加一个交易日" removeLabel="去掉最早一天" updateLabel="现价变动" canRemove={days.length > 5}
        onAdd={() => setDays((d) => {
          const close = +(price * (1 + (rnd.current() - 0.5) * 0.06)).toFixed(2);
          const range = close * (0.02 + rnd.current() * 0.03);
          setPrice(close);
          return [...d, { close, hi: close + range * rnd.current(), lo: close - range * rnd.current(), vol: 2.6e6 * (0.6 + rnd.current()) }];
        })}
        onRemove={() => setDays((d) => d.slice(1))}
        onUpdate={() => setPrice((p) => +(p * (1 + (rnd.current() - 0.5) * 0.12)).toFixed(2))}
        onReset={() => { setDays(DAYS); setPrice(DAYS[DAYS.length - 1].close); }}
      />
      <VolumeProfile bins={bins} step={step} price={price} valueArea={values.valueArea ? 0.7 : 0} scheme={values.scheme as "cn" | "us"}
        formatVolume={(v) => `${(v / 10000).toFixed(1)}万股`} ariaLabel="HX 科技筹码分布" />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </div>
  );
}
