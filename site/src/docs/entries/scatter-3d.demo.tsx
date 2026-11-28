import * as React from "react";
import { Scatter3D, type Scatter3DPoint } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, DataOps, seeded } from "./_chart";

const CATS = ["数码", "家居", "服饰"];
const r = seeded(91);
// 商品: 价格越高销量越低, 评分和价格弱相关; 大小 = 毛利
const PRODUCTS: Scatter3DPoint[] = Array.from({ length: 36 }, (_, i) => {
  const g = i % 3, price = Math.round([60, 25, 18][g] * (1 + r() * 8));
  return { id: `sku-${i + 1}`, label: `${CATS[g]} ${String(i + 1).padStart(2, "0")}`, group: CATS[g], x: price, y: Math.round(9000 / Math.sqrt(price) * (0.5 + r())), z: +(3.6 + r() * 1.3 + (price > 200 ? 0.2 : 0)).toFixed(1), size: Math.round(price * (0.2 + r() * 0.3)) };
});
const SVC = ["网关", "订单", "支付", "搜索"];
const SERVICES: Scatter3DPoint[] = Array.from({ length: 28 }, (_, i) => {
  const g = i % 4, qps = Math.round(200 + r() * 4800);
  return { id: `svc-${i + 1}`, label: `${SVC[g]}-${Math.floor(i / 4) + 1}`, group: SVC[g], x: Math.round(20 + qps / 60 + r() * 60), y: qps, z: +(0.1 + (qps / 5000) ** 2 * 2 + r() * 0.4).toFixed(2), size: 1 };
});
const SETS = {
  products: { title: "商品 · 价格 × 销量 × 评分", x: "价格", y: "月销量", z: "评分", fmt: (v: number, a: string) => (a === "x" ? `¥${v}` : a === "z" ? v.toFixed(1) : v.toLocaleString("zh-CN")) },
  services: { title: "服务 · P99 延迟 × QPS × 错误率", x: "P99 ms", y: "QPS", z: "错误率 %", fmt: (v: number, a: string) => (a === "z" ? `${v.toFixed(2)}%` : v.toLocaleString("zh-CN")) },
};

export default function Scatter3DDemo({ values }: DemoProps) {
  const key = values.data === "services" ? "services" : "products";
  const base = key === "services" ? SERVICES : PRODUCTS;
  const s = SETS[key];
  // 演示数据为虚构
  const [pts, setPts] = React.useState(base);
  React.useEffect(() => setPts(base), [base]);
  const rnd = React.useRef(seeded(17));
  const next = React.useRef(100);
  const groups = [...new Set(base.map((p) => p.group!))];
  return (
    <ChartCard wide title={s.title} value={`${pts.length} 个点`}>
      <DataOps
        addLabel="新增 3 个点" removeLabel="删除 3 个点" canRemove={pts.length > 6}
        onAdd={() => setPts((d) => [...d, ...Array.from({ length: 3 }, () => {
          const t = d[Math.floor(rnd.current() * d.length)];
          const id = `${key}-n${next.current++}`;
          return { ...t, id, label: `${t.group} 新${id.slice(-3)}`, x: Math.round(t.x * (0.7 + rnd.current() * 0.6)), y: Math.round(t.y * (0.7 + rnd.current() * 0.6)), z: +(t.z * (0.85 + rnd.current() * 0.3)).toFixed(2) };
        })])}
        onRemove={() => setPts((d) => { const out = [...d]; for (let k = 0; k < 3; k++) out.splice(Math.floor(rnd.current() * out.length), 1); return out; })}
        onUpdate={() => setPts((d) => d.map((p) => ({ ...p, y: Math.round(p.y * (0.6 + rnd.current() * 0.8)), z: +(p.z * (0.9 + rnd.current() * 0.2)).toFixed(2) })))}
        onReset={() => setPts(base)}
      />
      <ul className="mb-2 flex flex-wrap gap-3 text-xs text-muted-foreground" aria-label="分组">
        {groups.map((g, i) => <li key={g} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: `var(--chart-${(i % 5) + 1})` }} />{g}</li>)}
      </ul>
      <Scatter3D points={pts} xLabel={s.x} yLabel={s.y} zLabel={s.z} format={s.fmt} stems={Boolean(values.stems)} autoRotate={Boolean(values.autoRotate)} label={`${s.title} 3D 散点图`} />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </ChartCard>
  );
}
