import { useEffect, useMemo, useRef, useState } from "react";
import { Surface3D } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, DataOps, seeded } from "./_chart";

type Set = { title: string; xLabel: string; yLabel: string; zLabel: string; xRange: [number, number]; yRange: [number, number]; f: (x: number, y: number) => number; format: (v: number) => string; head: (peak: number) => string };
const SETS: Record<string, Set> = {
  profit: {
    title: "定价 × 折扣 → 月利润", xLabel: "定价", yLabel: "折扣", zLabel: "月利润", xRange: [59, 199], yRange: [0, 40],
    // 销量随到手价下降; 折扣在 12% 左右最能拉动转化, 再大就是白让利. 利润 = 销量 x (到手价 - 成本 45)
    f: (p, d) => { const net = p * (1 - d / 100); const lift = 1 + 0.9 * (d / 12) * Math.exp(1 - d / 12); const units = 3400 * Math.exp(-net / 55) * lift; return Math.max(0, units * (net - 45)) / 10000; },
    format: (v) => `${v.toFixed(1)} 万元`, head: (v) => `峰值 ${v.toFixed(1)} 万元`,
  },
  latency: {
    title: "并发 × 缓存命中率 → P99 延迟", xLabel: "并发", yLabel: "命中率", zLabel: "P99", xRange: [100, 2000], yRange: [50, 99],
    f: (c, h) => 40 + (c / 2000) ** 2.2 * 900 * (1 - (h - 50) / 55) + Math.exp(-((c - 1400) ** 2) / 90000) * 120 * (1 - (h - 50) / 60),
    format: (v) => `${Math.round(v)} ms`, head: (v) => `最差 ${Math.round(v)} ms`,
  },
  wave: {
    title: "双峰地形", xLabel: "X", yLabel: "Y", zLabel: "Z", xRange: [-3, 3], yRange: [-3, 3],
    f: (x, y) => 3 * (1 - x) ** 2 * Math.exp(-(x ** 2) - (y + 1) ** 2) - 10 * (x / 5 - x ** 3 - y ** 5) * Math.exp(-(x ** 2) - y ** 2) - Math.exp(-((x + 1) ** 2) - y ** 2) / 3,
    format: (v) => v.toFixed(2), head: (v) => `最高 ${v.toFixed(2)}`,
  },
};

/** 叠加在曲面上的局部峰 (或谷), 坐标和宽度都按 0..1 归一 */
type Bump = { id: number; u: number; v: number; amp: number; w: number };

export default function Surface3DDemo({ values }: DemoProps) {
  const s = SETS[String(values.data)] ?? SETS.profit;
  const n = Number(values.resolution);
  // 演示数据为虚构: 新增 = 叠加一个局部峰, 删除 = 移除一个峰, 更新 = 整体和各峰幅度变化; 曲面高度逐帧过渡
  const [bumps, setBumps] = useState<Bump[]>([]);
  const [gain, setGain] = useState(1);
  useEffect(() => { setBumps([]); setGain(1); }, [s]);
  const rnd = useRef(seeded(53));
  const nextId = useRef(1);
  const base = useMemo(() => Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => {
    const x = s.xRange[0] + (c / (n - 1)) * (s.xRange[1] - s.xRange[0]);
    const y = s.yRange[0] + (r / (n - 1)) * (s.yRange[1] - s.yRange[0]);
    return s.f(x, y);
  })), [s, n]);
  const range = useMemo(() => { const f = base.flat(); return Math.max(...f) - Math.min(...f) || 1; }, [base]);
  const grid = useMemo(() => base.map((row, r) => row.map((v, c) => {
    const u = c / (n - 1), w = r / (n - 1);
    return v * gain + bumps.reduce((acc, b) => acc + b.amp * range * Math.exp(-((u - b.u) ** 2 + (w - b.v) ** 2) / (2 * b.w * b.w)), 0);
  })), [base, bumps, gain, range, n]);
  const peak = Math.max(...grid.flat());
  return (
    <ChartCard wide title={s.title} value={s.head(peak)} delta={bumps.length ? <span className="text-muted-foreground">叠加 {bumps.length} 个峰</span> : undefined}>
      <DataOps
        addLabel="叠加一个峰" removeLabel="移除一个峰" canAdd={bumps.length < 5} canRemove={bumps.length > 0}
        onAdd={() => setBumps((b) => [...b, { id: nextId.current++, u: 0.15 + rnd.current() * 0.7, v: 0.15 + rnd.current() * 0.7, amp: 0.25 + rnd.current() * 0.35, w: 0.07 + rnd.current() * 0.06 }])}
        onRemove={() => setBumps((b) => { const gone = Math.floor(rnd.current() * b.length); return b.filter((_, i) => i !== gone); })}
        onUpdate={() => { setGain(0.7 + rnd.current() * 0.6); setBumps((b) => b.map((x) => ({ ...x, amp: 0.15 + rnd.current() * 0.5 }))); }}
        onReset={() => { setBumps([]); setGain(1); }}
      />
      <Surface3D
        values={grid} xRange={s.xRange} yRange={s.yRange} xLabel={s.xLabel} yLabel={s.yLabel} zLabel={s.zLabel}
        format={s.format} wireframe={Boolean(values.wireframe)} autoRotate={Boolean(values.autoRotate)} label={`${s.title} 曲面图`}
      />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </ChartCard>
  );
}
