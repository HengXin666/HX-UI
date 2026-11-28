import * as React from "react";
import { SankeyFlow } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, DataOps, seeded } from "./_chart";

// 演示数据为虚构. 连线用名字写, 渲染前换成下标
type Flow = [string, string, number];
const DEEP: Flow[] = [
  ["搜索", "商品页", 5200], ["搜索", "首页", 1800],
  ["社媒", "活动页", 3600], ["社媒", "商品页", 1200],
  ["直接访问", "首页", 2400],
  ["首页", "商品页", 3100], ["首页", "流失", 1100],
  ["活动页", "商品页", 2500], ["活动页", "流失", 1100],
  ["商品页", "成交", 2814], ["商品页", "流失", 9186],
];
const FLAT: Flow[] = [
  ["搜索", "成交", 1420], ["搜索", "流失", 5580],
  ["社媒", "成交", 860], ["社媒", "流失", 3940],
  ["直接访问", "成交", 534], ["直接访问", "流失", 1866],
];
// 可新增的来源渠道
const NEW_SOURCES: { name: string; deep: Flow[]; flat: Flow[] }[] = [
  { name: "短信", deep: [["短信", "活动页", 1400]], flat: [["短信", "成交", 310], ["短信", "流失", 1090]] },
  { name: "邮件", deep: [["邮件", "首页", 900], ["邮件", "商品页", 500]], flat: [["邮件", "成交", 240], ["邮件", "流失", 1160]] },
];
const SINKS = new Set(["成交", "流失"]);
const toGraph = (flows: Flow[]) => {
  const names = [...new Set(flows.flatMap(([a, b]) => [a, b]))];
  return { nodes: names.map((name) => ({ name })), links: flows.map(([a, b, value]) => ({ source: names.indexOf(a), target: names.indexOf(b), value })) };
};
// 去掉一个来源后, 下游节点的流入变少, 把对应的流出按比例缩下来, 保持守恒
function rebalance(flows: Flow[]): Flow[] {
  let out = flows;
  for (let pass = 0; pass < 3; pass++) {
    const inflow = new Map<string, number>(), outflow = new Map<string, number>();
    out.forEach(([a, b, v]) => { inflow.set(b, (inflow.get(b) ?? 0) + v); outflow.set(a, (outflow.get(a) ?? 0) + v); });
    out = out.map(([a, b, v]) => {
      const i = inflow.get(a), o = outflow.get(a);
      return i !== undefined && o ? [a, b, Math.round((v * i) / o)] as Flow : [a, b, v] as Flow;
    }).filter(([, , v]) => v > 0);
  }
  return out;
}

export default function SankeyFlowDemo({ values }: DemoProps) {
  const deep = Boolean(values.deep);
  const base = deep ? DEEP : FLAT;
  const [flows, setFlows] = React.useState(base);
  React.useEffect(() => setFlows(base), [base]);
  const rnd = React.useRef(seeded(17));
  const sources = [...new Set(flows.map(([a]) => a))].filter((a) => !flows.some(([, b]) => b === a));
  const visitors = flows.filter(([a]) => sources.includes(a)).reduce((s, [, , v]) => s + v, 0);
  const deals = flows.filter(([, b]) => b === "成交").reduce((s, [, , v]) => s + v, 0);
  const addable = NEW_SOURCES.filter((n) => !sources.includes(n.name));
  const g = toGraph(flows);
  return (
    <ChartCard title="本周流量去向" value={`${visitors.toLocaleString("zh-CN")} 访客`} delta={<span className="text-success">成交 {deals.toLocaleString("zh-CN")}</span>} wide>
      <DataOps
        addLabel="新增渠道" removeLabel="去掉一个渠道" canAdd={addable.length > 0} canRemove={sources.length > 1}
        onAdd={() => setFlows((f) => { const n = NEW_SOURCES.find((x) => !f.some(([a]) => a === x.name)); return n ? rebalance([...f, ...(deep ? n.deep : n.flat)]) : f; })}
        onRemove={() => setFlows((f) => {
          const src = [...new Set(f.map(([a]) => a))].filter((a) => !f.some(([, b]) => b === a));
          const gone = src[Math.floor(rnd.current() * src.length)];
          return rebalance(f.filter(([a]) => a !== gone));
        })}
        // 只动来源和最后一层的分流比例, 中间层跟着守恒
        onUpdate={() => setFlows((f) => rebalance(f.map(([a, b, v]) => {
          const isSource = !f.some(([, t]) => t === a);
          return [a, b, isSource || SINKS.has(b) ? Math.round(v * (0.6 + rnd.current() * 0.8)) : v] as Flow;
        })))}
        onReset={() => setFlows(base)}
      />
      <SankeyFlow nodes={g.nodes} links={g.links} ariaLabel="本周流量去向" />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </ChartCard>
  );
}
