import * as React from "react";
import { Minus, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { Bullet, type BulletItem } from "@/data";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";
import { ChartCard, seeded } from "./_chart";

const pctF = (v: number) => `${v.toFixed(1)}%`;
// 演示数据为虚构
const BASE: BulletItem[] = [
  { label: "GMV", sub: "万元 · 本月", value: 1842, target: 2000, prior: 1510 },
  { label: "新客数", sub: "人", value: 12680, target: 11000, prior: 9400 },
  { label: "复购率", sub: "30 天", value: 31.4, target: 35, prior: 28.2, format: pctF, max: 50 },
  { label: "客单价", sub: "元", value: 236, target: 220, prior: 214 },
  { label: "退款率", sub: "越低越好", value: 4.6, target: 4, prior: 5.3, better: "lower", format: pctF, max: 9 },
];
const MORE: BulletItem[] = [
  { label: "直播转化", sub: "成交 / 观看", value: 3.1, target: 3.5, prior: 2.4, format: pctF, max: 6 },
  { label: "履约时效", sub: "小时 · 越低越好", value: 26, target: 24, prior: 31, better: "lower" },
  { label: "好评率", sub: "%", value: 97.2, target: 96, prior: 95.8, format: pctF, max: 100, ranges: [90, 95] },
];

export default function BulletDemo({ values }: DemoProps) {
  const [items, setItems] = React.useState(BASE);
  const rnd = React.useRef(seeded(5));
  const add = () => setItems((d) => { const n = MORE.find((x) => !d.some((y) => y.label === x.label)); return n ? [...d, n] : d; });
  const remove = () => setItems((d) => (d.length > 1 ? d.slice(0, -1) : d));
  const refresh = () => setItems((d) => d.map((x) => ({ ...x, value: Math.round(x.value * (0.82 + rnd.current() * 0.3) * 10) / 10 })));
  const met = items.filter((x) => (x.better === "lower" ? x.value <= x.target : x.value >= x.target)).length;
  return (
    <ChartCard title="本月经营指标" value={`${met} / ${items.length} 达标`} wide>
      <div className="mb-2 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={add}><Plus aria-hidden />新增指标</Button>
        <Button size="sm" variant="outline" onClick={remove}><Minus aria-hidden />删除指标</Button>
        <Button size="sm" variant="outline" onClick={refresh}><RefreshCw aria-hidden />刷新数据</Button>
        <Button size="sm" variant="ghost" onClick={() => setItems(BASE)}><RotateCcw aria-hidden />重置</Button>
      </div>
      <Bullet items={items} statusColor={!!values.statusColor} size={values.size as "sm" | "md"} />
      <p className="mt-2 text-[11px] text-muted-foreground">演示数据为虚构。悬停一行看区间说明。</p>
    </ChartCard>
  );
}
