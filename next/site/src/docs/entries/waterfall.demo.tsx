import * as React from "react";
import { Minus, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { Waterfall, type WaterfallItem } from "@/data";
import { Button } from "@/components/ui/button";
import type { DemoProps } from "../types";
import { ChartCard, seeded } from "./_chart";

// 演示数据为虚构 (万元)
const PROFIT: WaterfallItem[] = [
  { label: "营业收入", value: 1280, type: "start" },
  { label: "营业成本", value: -612 },
  { label: "毛利", type: "total" },
  { label: "销售费用", value: -186 },
  { label: "管理费用", value: -94 },
  { label: "研发费用", value: -128 },
  { label: "其他收益", value: 36 },
  { label: "所得税", value: -61 },
  { label: "净利润", type: "total" },
];
const CASH: WaterfallItem[] = [
  { label: "期初现金", value: 420, type: "start" },
  { label: "经营流入", value: 365 },
  { label: "采购付款", value: -248 },
  { label: "工资社保", value: -132 },
  { label: "设备投资", value: -96 },
  { label: "银行借款", value: 150 },
  { label: "偿还利息", value: -18 },
  { label: "期末现金", type: "total" },
];
const EXTRA = ["汇兑收益", "政府补贴", "资产减值", "广告投放", "渠道返利", "物流费用", "退款损失"];

export default function WaterfallDemo({ values }: DemoProps) {
  const set = values.dataset === "cash" ? CASH : PROFIT;
  const [data, setData] = React.useState(set);
  const rnd = React.useRef(seeded(11));
  const n = React.useRef(0);
  React.useEffect(() => { setData(values.dataset === "cash" ? CASH : PROFIT); n.current = 0; }, [values.dataset]);

  const insertAt = (d: WaterfallItem[]) => Math.max(1, d.length - 1);
  const add = () => setData((d) => {
    const r = rnd.current, label = EXTRA[n.current++ % EXTRA.length];
    const item = { label: d.some((x) => x.label === label) ? `${label} ${n.current}` : label, value: Math.round((r() - 0.55) * 160) || 12 };
    const i = insertAt(d);
    return [...d.slice(0, i), item, ...d.slice(i)];
  });
  const remove = () => setData((d) => {
    const deltas = d.map((x, i) => [x, i] as const).filter(([x, i]) => i > 0 && x.type !== "total" && x.type !== "start");
    if (deltas.length <= 1) return d;
    const [, i] = deltas[deltas.length - 1];
    return d.filter((_, j) => j !== i);
  });
  const shuffle = () => setData((d) => d.map((x) => (x.type ? x : { ...x, value: Math.round((x.value ?? 0) * (0.6 + rnd.current() * 0.8)) })));

  const net = data.reduce((run, x) => (x.type === "start" ? x.value ?? 0 : x.type === "total" ? run : run + (x.value ?? 0)), 0);
  const startV = data[0]?.value ?? 1;
  return (
    <ChartCard
      title={values.dataset === "cash" ? "本季度现金流（万元）" : "Q3 利润拆解（万元）"}
      value={`${net.toLocaleString("zh-CN")} 万`}
      delta={<span className="text-muted-foreground">{values.dataset === "cash" ? "期末现金" : `净利率 ${((net / startV) * 100).toFixed(1)}%`}</span>}
      wide
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={add}><Plus aria-hidden />新增一项</Button>
        <Button size="sm" variant="outline" onClick={remove}><Minus aria-hidden />删除一项</Button>
        <Button size="sm" variant="outline" onClick={shuffle}><RefreshCw aria-hidden />调整金额</Button>
        <Button size="sm" variant="ghost" onClick={() => setData(set)}><RotateCcw aria-hidden />重置</Button>
      </div>
      <Waterfall
        data={data}
        scheme={values.scheme as "finance" | "cn"}
        orientation={values.orientation as "auto" | "vertical" | "horizontal"}
        showValues={!!values.showValues}
        connectors={!!values.connectors}
        unit=" 万"
        ariaLabel={values.dataset === "cash" ? "现金流瀑布图" : "利润拆解瀑布图"}
      />
      <p className="mt-2 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </ChartCard>
  );
}
