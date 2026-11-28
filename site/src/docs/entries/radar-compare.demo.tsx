import * as React from "react";
import { RadarCompare } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, DataOps, seeded } from "./_chart";

// 演示数据为虚构
type Score = { dim: string; us: number; rival: number };
const SCORES: Score[] = [
  { dim: "价格", us: 82, rival: 70 },
  { dim: "物流", us: 74, rival: 88 },
  { dim: "售后", us: 90, rival: 65 },
  { dim: "品类", us: 68, rival: 84 },
  { dim: "体验", us: 86, rival: 72 },
  { dim: "口碑", us: 79, rival: 76 },
];
const MORE: Score[] = [
  { dim: "复购", us: 71, rival: 63 },
  { dim: "内容", us: 64, rival: 81 },
];
const clamp = (v: number) => Math.max(30, Math.min(100, Math.round(v)));

export default function RadarCompareDemo({ values }: DemoProps) {
  const compare = Boolean(values.compare);
  const [rows, setRows] = React.useState(SCORES);
  const rnd = React.useRef(seeded(23));
  const avg = Math.round(rows.reduce((s, r) => s + r.us, 0) / rows.length);
  return (
    <ChartCard title={compare ? `店铺 ${rows.length} 项评分 · 我们 vs 竞品 A` : `门店体检 · ${rows.length} 项评分`} value={`${avg} 分`} delta={<span className="text-muted-foreground">平均</span>}>
      <DataOps
        addLabel="新增维度" canAdd={rows.length < SCORES.length + MORE.length} canRemove={rows.length > 3}
        onAdd={() => setRows((d) => {
          const next = [...SCORES, ...MORE].find((s) => !d.some((x) => x.dim === s.dim));
          if (!next) return d;
          const at = 1 + Math.floor(rnd.current() * d.length);
          return [...d.slice(0, at), next, ...d.slice(at)];
        })}
        onRemove={() => setRows((d) => { const gone = Math.floor(rnd.current() * d.length); return d.filter((_, i) => i !== gone); })}
        onUpdate={() => setRows((d) => d.map((r) => ({ ...r, us: clamp(r.us + (rnd.current() - 0.5) * 30), rival: clamp(r.rival + (rnd.current() - 0.5) * 30) })))}
        onReset={() => setRows(SCORES)}
      />
      <RadarCompare data={rows} axis="dim" max={100} grid={values.grid as "polygon" | "circle"}
        series={compare ? [{ key: "us", label: "我们" }, { key: "rival", label: "竞品 A" }] : [{ key: "us", label: "本店" }]} />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </ChartCard>
  );
}
