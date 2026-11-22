import * as React from "react";
import { Map3D, type Map3DDatum } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, DataOps, seeded } from "./_chart";

const GMV: Map3DDatum[] = [
  ["广东", 1820], ["浙江", 1460], ["江苏", 1380], ["上海", 1120], ["北京", 980], ["山东", 760], ["福建", 690], ["四川", 610], ["湖北", 540], ["河南", 520],
  ["湖南", 430], ["安徽", 410], ["重庆", 380], ["陕西", 330], ["天津", 290], ["河北", 280], ["辽宁", 250], ["江西", 220], ["云南", 190], ["广西", 180],
].map(([name, value]) => ({ name: name as string, value: value as number }));
const STORES: Map3DDatum[] = [
  ["广东", 412], ["江苏", 365], ["浙江", 340], ["山东", 298], ["四川", 245], ["河南", 230], ["上海", 210], ["湖北", 188], ["北京", 176], ["福建", 160],
  ["湖南", 150], ["河北", 132], ["安徽", 128], ["陕西", 96], ["重庆", 92],
].map(([name, value]) => ({ name: name as string, value: value as number }));
const MORE = ["贵州", "山西", "黑龙江", "吉林", "甘肃", "内蒙古", "新疆", "海南", "宁夏", "青海", "西藏"];

export default function Map3DDemo({ values }: DemoProps) {
  const stores = values.data === "stores";
  const base = stores ? STORES : GMV;
  // 演示数据为虚构
  const [data, setData] = React.useState(base);
  React.useEffect(() => setData(base), [base]);
  const rnd = React.useRef(seeded(23));
  const pool = MORE.concat(base.map((d) => d.name)).filter((n) => !data.some((d) => d.name === n));
  const total = data.reduce((s, d) => s + d.value, 0);
  const fmt = stores ? (v: number) => `${v} 家` : (v: number) => `${v.toLocaleString("zh-CN")} 亿元`;
  return (
    <ChartCard wide title={stores ? "门店数 · 按省份" : "GMV · 按省份"} value={stores ? `${total.toLocaleString("zh-CN")} 家` : `${(total / 10000).toFixed(2)} 万亿元`} delta={<span className="text-muted-foreground">{data.length} 个省份</span>}>
      <DataOps
        addLabel="新增一个省份" removeLabel="去掉一个省份" canAdd={pool.length > 0} canRemove={data.length > 1}
        onAdd={() => setData((d) => (pool[0] ? [...d, { name: pool[0], value: Math.round((stores ? 60 : 160) * (0.6 + rnd.current() * 1.2)) }] : d))}
        onRemove={() => setData((d) => { const gone = Math.floor(rnd.current() * d.length); return d.filter((_, i) => i !== gone); })}
        onUpdate={() => setData((d) => d.map((x) => ({ ...x, value: Math.max(1, Math.round(x.value * (0.5 + rnd.current()))) })))}
        onReset={() => setData(base)}
      />
      <Map3D data={data} metric={stores ? "门店数" : "GMV"} format={fmt} labelTop={Number(values.labelTop)} autoRotate={Boolean(values.autoRotate)} label={stores ? "各省门店数 3D 地图" : "各省 GMV 3D 地图"} />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </ChartCard>
  );
}
