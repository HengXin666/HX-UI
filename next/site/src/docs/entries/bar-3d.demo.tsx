import * as React from "react";
import { Bar3D } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, DataOps, seeded } from "./_chart";

const REGIONS = ["华东", "华南", "华北", "西南", "海外"];
// 可新增的地区, 体量和已有地区同一量级
const MORE_REGIONS: [string, number][] = [["华中", 220], ["东北", 140], ["西北", 100]];
const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const SLOTS = ["0点", "2点", "4点", "6点", "8点", "10点", "12点", "14点", "16点", "18点", "20点", "22点"];

const r = seeded(31);
// 地区 x 月份 GMV (万元): 各区体量不同, 双 11 和年末冲高
const GMV = REGIONS.map((_, i) => MONTHS.map((_, m) => Math.round([420, 330, 260, 180, 120][i] * (1 + 0.06 * m + (m === 10 ? 0.9 : 0) + (m === 11 ? 0.45 : 0) + (m === 1 ? -0.25 : 0)) * (0.9 + r() * 0.2))));
// 星期 x 时段订单数: 午间和晚间高峰, 周末整体抬高
const ORDERS = DAYS.map((_, d) => SLOTS.map((_, s) => {
  const h = s * 2;
  const curve = Math.exp(-((h - 12.5) ** 2) / 8) * 0.8 + Math.exp(-((h - 20.5) ** 2) / 6) + 0.08;
  return Math.round(curve * (d >= 5 ? 1.35 : 1) * 900 * (0.88 + r() * 0.24));
}));

type Rows = { names: string[]; values: number[][] };
const BASE: Record<string, Rows> = { gmv: { names: REGIONS, values: GMV }, orders: { names: DAYS, values: ORDERS } };

export default function Bar3DDemo({ values }: DemoProps) {
  const store = values.data === "orders";
  const base = BASE[store ? "orders" : "gmv"];
  // 演示数据为虚构: 增删的是行 (地区 / 星期), 列 (月份 / 时段) 不变
  const [rows, setRows] = React.useState(base);
  React.useEffect(() => setRows(base), [base]);
  const rnd = React.useRef(seeded(41));
  const order = store ? DAYS : [...REGIONS, ...MORE_REGIONS.map(([n]) => n)];
  const pool = store ? DAYS.filter((d) => !rows.names.includes(d)) : MORE_REGIONS.map(([n]) => n).filter((n) => !rows.names.includes(n)).concat(REGIONS.filter((n) => !rows.names.includes(n)));
  const makeRow = (name: string) => {
    if (store) return ORDERS[DAYS.indexOf(name)];
    const i = REGIONS.indexOf(name);
    if (i >= 0) return GMV[i];
    const scale = MORE_REGIONS.find(([n]) => n === name)![1];
    return MONTHS.map((_, m) => Math.round(scale * (1 + 0.06 * m + (m === 10 ? 0.9 : 0) + (m === 11 ? 0.45 : 0)) * (0.9 + rnd.current() * 0.2)));
  };
  const total = rows.values.flat().reduce((a, b) => a + b, 0);
  return (
    <ChartCard wide title={store ? "门店订单 · 星期 × 时段" : "GMV · 地区 × 月份"} value={store ? `${total.toLocaleString("zh-CN")} 单` : `${(total / 10000).toFixed(2)} 亿元`}>
      <DataOps
        addLabel={store ? "加回一天" : "新增地区"} removeLabel={store ? "去掉一天" : "删除一个地区"} canAdd={pool.length > 0} canRemove={rows.names.length > 1}
        onAdd={() => setRows((d) => {
          const name = pool[0]; if (!name) return d;
          const names = [...d.names, name].sort((a, b) => order.indexOf(a) - order.indexOf(b));
          const map = new Map(d.names.map((n, i) => [n, d.values[i]])); map.set(name, makeRow(name));
          return { names, values: names.map((n) => map.get(n)!) };
        })}
        onRemove={() => setRows((d) => { const gone = Math.floor(rnd.current() * d.names.length); return { names: d.names.filter((_, i) => i !== gone), values: d.values.filter((_, i) => i !== gone) }; })}
        onUpdate={() => setRows((d) => ({ ...d, values: d.values.map((row) => row.map((v) => Math.round(v * (0.6 + rnd.current() * 0.8)))) }))}
        onReset={() => setRows(base)}
      />
      <Bar3D
        values={rows.values}
        xLabels={store ? SLOTS : MONTHS}
        yLabels={rows.names}
        valueLabel={store ? "订单" : "GMV"}
        format={store ? (v) => `${v.toLocaleString("zh-CN")} 单` : (v) => `${v.toLocaleString("zh-CN")} 万元`}
        colorMode={values.colorMode as "value" | "row"}
        gap={Number(values.gap)}
        autoRotate={Boolean(values.autoRotate)}
        label={store ? "门店订单 3D 柱状图" : "GMV 3D 柱状图"}
      />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </ChartCard>
  );
}
