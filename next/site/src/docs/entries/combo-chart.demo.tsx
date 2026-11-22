import * as React from "react";
import { ComboChart } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, DataOps, seeded } from "./_chart";

// 演示数据为虚构. id 是天序号, 动画按它配对: 滑动窗口时柱和线整体左移
type Row = { id: number; day: string; new: number; old: number; cvr: number };
const dayLabel = (id: number) => { const d = new Date(Date.UTC(2026, 10, 16 + id)); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };
const NEW = [312, 288, 341, 402, 377, 520, 611];
const OLD = [198, 210, 187, 236, 244, 301, 352];
const CVR = [2.8, 2.6, 3.0, 3.4, 3.2, 4.1, 4.6];
const ROWS: Row[] = NEW.map((n, id) => ({ id, day: dayLabel(id), new: n, old: OLD[id], cvr: CVR[id] }));

export default function ComboChartDemo({ values }: DemoProps) {
  const [rows, setRows] = React.useState(ROWS);
  const rnd = React.useRef(seeded(11));
  const j = (v: number, k: number) => v * (1 - k + rnd.current() * k * 2);
  const last = rows[rows.length - 1];
  const orders = last.new + (values.twoBars ? last.old : 0);
  return (
    <ChartCard title={`近 ${rows.length} 天订单与转化率`} value={`${orders.toLocaleString("zh-CN")} 单`} delta={<span className="text-success">转化 {last.cvr}%</span>}>
      <DataOps
        addLabel="追加一天" removeLabel="移除最早一天" canRemove={rows.length > 3}
        onAdd={() => setRows((d) => {
          const l = d[d.length - 1]; const id = l.id + 1;
          return [...d, { id, day: dayLabel(id), new: Math.round(j(l.new, 0.2)), old: Math.round(j(l.old, 0.2)), cvr: Math.round(j(l.cvr, 0.15) * 10) / 10 }];
        })}
        onRemove={() => setRows((d) => d.slice(1))}
        onUpdate={() => setRows((d) => d.map((r) => ({ ...r, new: Math.round(j(r.new, 0.3)), old: Math.round(j(r.old, 0.3)), cvr: Math.round(j(r.cvr, 0.25) * 10) / 10 })))}
        onReset={() => setRows(ROWS)}
      />
      <ComboChart data={rows} x="day" stacked={Boolean(values.stacked)} dualAxis={Boolean(values.dualAxis)}
        animation={{ match: { dataKey: "id" } }}
        bars={values.twoBars ? [{ key: "new", label: "新客订单" }, { key: "old", label: "老客订单" }] : [{ key: "new", label: "订单" }]}
        lines={[{ key: "cvr", label: "转化率" }]} lineFormatter={(v) => `${v}%`} />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </ChartCard>
  );
}
