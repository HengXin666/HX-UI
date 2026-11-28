import { useEffect, useRef, useState } from "react";
import { DepthChart, type DepthLevel } from "@/data";
import type { DemoProps } from "../types";
import { DataOps, seeded } from "./_chart";

const MID = 25;
function book(levels: number) {
  const r = seeded(77 + levels);
  const side = (dir: 1 | -1): DepthLevel[] => Array.from({ length: levels }, (_, i) => ({
    price: +(MID + dir * (0.01 + i * 0.01)).toFixed(2),
    // 离盘口越远挂单越厚, 偶尔有一堵大单墙
    size: Math.round((800 + i * 260) * (0.5 + r()) * (r() < 0.08 ? 4 : 1)),
  }));
  return { bids: side(-1), asks: side(1) };
}

export default function DepthChartDemo({ values }: DemoProps) {
  const levels = Number(values.levels);
  // 演示数据为虚构: 挂单 = 新增一个价位, 撤单 = 去掉一档, 更新 = 各档挂单量变化
  const [b, setB] = useState(() => book(levels));
  useEffect(() => setB(book(levels)), [levels]);
  const rnd = useRef(seeded(5));
  return (
    <div className="w-full max-w-3xl rounded-2xl border bg-background/85 p-4 shadow-float backdrop-blur sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="font-semibold">HX 科技 · 盘口深度</p>
        <p className="font-mono text-xs text-muted-foreground">买 {b.bids.length} 档 · 卖 {b.asks.length} 档</p>
      </div>
      <DataOps
        addLabel="挂一笔新单" removeLabel="撤一档"
        canRemove={b.bids.length + b.asks.length > 4}
        onAdd={() => setB((d) => {
          // 一半概率挂在更远的价位, 一半挂在已有两档之间的空位上 (没有空位就往外挂)
          const bid = rnd.current() < 0.5;
          const list = bid ? d.bids : d.asks;
          const far = bid ? Math.min(...list.map((l) => l.price)) - 0.01 : Math.max(...list.map((l) => l.price)) + 0.01;
          const size = Math.round(1500 + rnd.current() * 6000);
          const lvl = { price: +far.toFixed(2), size };
          return bid ? { ...d, bids: [...d.bids, lvl] } : { ...d, asks: [...d.asks, lvl] };
        })}
        onRemove={() => setB((d) => {
          const bid = d.asks.length <= 2 || (d.bids.length > 2 && rnd.current() < 0.5);
          const list = bid ? d.bids : d.asks;
          const gone = Math.floor(rnd.current() * list.length);
          const next = list.filter((_, i) => i !== gone);
          return bid ? { ...d, bids: next } : { ...d, asks: next };
        })}
        onUpdate={() => setB((d) => ({
          bids: d.bids.map((l) => ({ ...l, size: Math.max(100, Math.round(l.size * (0.5 + rnd.current()))) })),
          asks: d.asks.map((l) => ({ ...l, size: Math.max(100, Math.round(l.size * (0.5 + rnd.current()))) })),
        }))}
        onReset={() => setB(book(levels))}
      />
      <DepthChart bids={b.bids} asks={b.asks} scheme={values.scheme as "cn" | "us"} formatSize={(v) => (v >= 10000 ? `${(v / 10000).toFixed(1)}万` : String(v))} ariaLabel="HX 科技盘口深度" />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。挂单量单位：股。</p>
    </div>
  );
}
