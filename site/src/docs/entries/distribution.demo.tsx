import * as React from "react";
import { Minus, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { Distribution, type DistributionGroup } from "@/data";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";
import { ChartCard, seeded } from "./_chart";

// 演示数据为虚构: 对数正态 (客单价), 偏态 (加载耗时)
function gen(kind: string, n: number, r: () => number, shift = 0) {
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  return Array.from({ length: n }, () => kind === "latency"
    ? Math.round(380 + Math.exp(6.1 + shift + normal() * 0.62))
    : Math.round(Math.exp(5.2 + shift + normal() * 0.55)));
}
const CHANNELS: [string, number][] = [["搜索", 0], ["社媒", -0.18], ["直播", -0.32], ["私域", 0.22], ["线下门店", 0.35], ["分销", -0.08]];

export default function DistributionDemo({ values }: DemoProps) {
  const kind = String(values.dataset);
  const box = kind === "channels";
  const rnd = React.useRef(seeded(9));
  const fresh = React.useCallback((k = kind) => {
    rnd.current = seeded(9);
    return { vals: gen(k === "latency" ? "latency" : "amount", 2000, rnd.current), groups: CHANNELS.slice(0, 4).map(([name, s]) => ({ name, values: gen("amount", 400, rnd.current, s) })) };
  }, [kind]);
  const [vals, setVals] = React.useState<number[]>(() => fresh().vals);
  const [groups, setGroups] = React.useState<DistributionGroup[]>(() => fresh().groups);
  React.useEffect(() => { const f = fresh(kind); setVals(f.vals); setGroups(f.groups); }, [kind, fresh]);

  const add = () => box
    ? setGroups((g) => { const c = CHANNELS.find(([n]) => !g.some((x) => x.name === n)); return c ? [...g, { name: c[0], values: gen("amount", 400, rnd.current, c[1]) }] : g; })
    : setVals((v) => [...v, ...gen(kind === "latency" ? "latency" : "amount", 500, rnd.current, 0.25)]);
  const remove = () => box ? setGroups((g) => (g.length > 1 ? g.slice(0, -1) : g)) : setVals((v) => (v.length > 500 ? v.slice(0, -500) : v));
  const resample = () => box
    ? setGroups((g) => g.map((x, i) => ({ ...x, values: gen("amount", 400, rnd.current, (CHANNELS.find(([n]) => n === x.name)?.[1] ?? 0) + (i % 2 ? 0.1 : -0.1) * rnd.current()) })))
    : setVals(gen(kind === "latency" ? "latency" : "amount", vals.length, rnd.current, (rnd.current() - 0.5) * 0.3));
  const reset = () => { const f = fresh(); setVals(f.vals); setGroups(f.groups); };

  const title = box ? "各渠道客单价（元）" : kind === "latency" ? "首屏加载耗时（毫秒）" : "订单客单价分布（元）";
  return (
    <ChartCard title={title} value={box ? `${groups.length} 个渠道` : `${vals.length.toLocaleString("zh-CN")} ${kind === "latency" ? "次访问" : "笔订单"}`} wide>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={add}><Plus aria-hidden />{box ? "新增渠道" : "新增 500 条"}</Button>
        <Button size="sm" variant="outline" onClick={remove}><Minus aria-hidden />{box ? "删除渠道" : "删除 500 条"}</Button>
        <Button size="sm" variant="outline" onClick={resample}><RefreshCw aria-hidden />换一批</Button>
        <Button size="sm" variant="ghost" onClick={reset}><RotateCcw aria-hidden />重置</Button>
      </div>
      <Distribution
        mode={box ? "box" : "histogram"}
        values={vals}
        groups={groups}
        bins={Number(values.bins)}
        markers={!!values.markers}
        boxStrip={!!values.boxStrip}
        outliers={!!values.outliers}
        unit={kind === "latency" ? " ms" : " 元"}
        ariaLabel={title}
      />
      <p className="mt-2 text-[11px] text-muted-foreground">演示数据为随机生成。</p>
    </ChartCard>
  );
}
