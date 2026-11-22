import { useMemo } from "react";
import { Surface3D } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard } from "./_chart";

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

export default function Surface3DDemo({ values }: DemoProps) {
  const s = SETS[String(values.data)] ?? SETS.profit;
  const n = Number(values.resolution);
  const grid = useMemo(() => Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => {
    const x = s.xRange[0] + (c / (n - 1)) * (s.xRange[1] - s.xRange[0]);
    const y = s.yRange[0] + (r / (n - 1)) * (s.yRange[1] - s.yRange[0]);
    return s.f(x, y);
  })), [s, n]);
  const peak = Math.max(...grid.flat());
  return (
    <ChartCard wide title={s.title} value={s.head(peak)}>
      <Surface3D
        values={grid} xRange={s.xRange} yRange={s.yRange} xLabel={s.xLabel} yLabel={s.yLabel} zLabel={s.zLabel}
        format={s.format} wireframe={Boolean(values.wireframe)} autoRotate={Boolean(values.autoRotate)} label={`${s.title} 曲面图`}
      />
    </ChartCard>
  );
}
