import * as React from "react";
import { AnimatePresence, m } from "motion/react";
import { Gauge } from "@/data";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import type { DemoProps } from "../types";
import { DataOps, seeded } from "./_chart";

const BANDS = [
  { to: 40, color: "var(--destructive)" },
  { to: 70, color: "var(--warning)" },
  { to: 100, color: "var(--success)" },
];
// 演示数据为虚构: 主表盘看全局, 下面每个大区一块小表盘
type Region = { name: string; v: number };
const REGIONS: Region[] = [{ name: "华东", v: 81 }, { name: "华南", v: 68 }, { name: "华北", v: 57 }];
const MORE: Region[] = [{ name: "西南", v: 44 }, { name: "华中", v: 73 }, { name: "西北", v: 35 }];

export default function GaugeDemo({ values }: DemoProps) {
  const v = Number(values.value);
  const needle = values.variant === "needle";
  const reduced = useReducedMotion();
  const [regions, setRegions] = React.useState(REGIONS);
  const rnd = React.useRef(seeded(13));
  const bands = values.bands ? (needle ? [...BANDS].reverse().map((b, i) => ({ ...b, to: [60, 85, 100][i] })) : BANDS) : undefined;
  const fmt = (n: number) => `${Math.round(n)}%`;
  const item = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 } };
  return (
    <div className="grid w-full max-w-lg justify-items-center rounded-2xl border bg-background/85 p-6 shadow-float backdrop-blur">
      <p className="justify-self-start text-sm text-muted-foreground">{needle ? "集群 CPU 负载" : "11 月营收目标"}</p>
      <Gauge className="mt-4" value={v} label={needle ? "当前负载" : "目标达成"} variant={values.variant as "arc" | "needle"}
        sweep={Number(values.sweep)} bands={bands} format={fmt} />
      <p className="mt-4 text-xs text-muted-foreground tabular-nums">{needle ? `${Math.round(v * 0.64)} / 64 核` : `¥${(v * 0.5).toFixed(1)} 万 / ¥50 万`}</p>
      <div className="mt-5 w-full border-t pt-4">
        <DataOps
          addLabel="新增大区" canAdd={regions.length < REGIONS.length + MORE.length} canRemove={regions.length > 1}
          onAdd={() => setRegions((d) => { const n = [...REGIONS, ...MORE].find((r) => !d.some((x) => x.name === r.name)); return n ? [...d, n] : d; })}
          onRemove={() => setRegions((d) => { const gone = Math.floor(rnd.current() * d.length); return d.filter((_, i) => i !== gone); })}
          onUpdate={() => setRegions((d) => d.map((r) => ({ ...r, v: Math.max(5, Math.min(100, Math.round(r.v + (rnd.current() - 0.5) * 50))) })))}
          onReset={() => setRegions(REGIONS)}
        />
        <ul className="grid grid-cols-3 gap-3" aria-label="各大区">
          <AnimatePresence initial={false} mode="popLayout">
            {regions.map((r) => (
              <m.li key={r.name} data-k={r.name} layout={!reduced} {...item} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="rounded-xl border p-2">
                <Gauge value={r.v} size={96} thickness={12} sweep={Number(values.sweep)} variant={values.variant as "arc" | "needle"} bands={bands} format={fmt} label={r.name} />
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
      <p className="mt-3 justify-self-start text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </div>
  );
}
