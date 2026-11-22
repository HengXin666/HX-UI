import * as React from "react";
import { ConversionFunnel } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, DataOps, seeded } from "./_chart";

// 演示数据为虚构
type Step = { label: string; value: number };
const NORMAL: Step[] = [{ label: "访问商品页", value: 48210 }, { label: "加入购物车", value: 9120 }, { label: "提交订单", value: 3260 }, { label: "完成支付", value: 2814 }];
const CAMPAIGN: Step[] = [{ label: "访问商品页", value: 126400 }, { label: "加入购物车", value: 38900 }, { label: "提交订单", value: 15200 }, { label: "完成支付", value: 13980 }];
// 可插入的中间步骤, after 表示插在哪一步之后
const EXTRA: { label: string; after: string; ratio: number }[] = [
  { label: "领取优惠券", after: "访问商品页", ratio: 0.42 },
  { label: "进入结算页", after: "加入购物车", ratio: 0.58 },
];
const FLOW = ["访问商品页", "领取优惠券", "加入购物车", "进入结算页", "提交订单", "完成支付"];

export default function ConversionFunnelDemo({ values }: DemoProps) {
  const base = values.campaign ? CAMPAIGN : NORMAL;
  const [steps, setSteps] = React.useState(base);
  React.useEffect(() => setSteps(base), [base]);
  const rnd = React.useRef(seeded(5));
  const first = steps[0], last = steps[steps.length - 1];
  const missing = EXTRA.filter((e) => !steps.some((s) => s.label === e.label));
  return (
    <ChartCard title={values.campaign ? "双 11 当天转化" : "本周购买转化"} value={`${((last.value / first.value) * 100).toFixed(1)}%`} delta={<span className="text-muted-foreground">访问到支付 · {steps.length} 步</span>}>
      <DataOps
        addLabel="插入一步" removeLabel="去掉中间一步" canAdd={missing.length > 0} canRemove={steps.length > 2}
        onAdd={() => setSteps((d) => {
          const e = EXTRA.find((x) => !d.some((s) => s.label === x.label));
          if (!e) return d;
          const prev = d.find((s) => s.label === e.after) ?? d[0];
          const next = [...d, { label: e.label, value: Math.round(prev.value * e.ratio) }];
          return next.sort((a, b) => FLOW.indexOf(a.label) - FLOW.indexOf(b.label));
        })}
        onRemove={() => setSteps((d) => {
          if (d.length <= 2) return d;
          const gone = 1 + Math.floor(rnd.current() * (d.length - 2));
          return d.filter((_, i) => i !== gone);
        })}
        // 更新时保持逐步递减
        onUpdate={() => setSteps((d) => {
          let v = Math.round(d[0].value * (0.8 + rnd.current() * 0.4));
          return d.map((s, i) => { if (i > 0) v = Math.round(v * (0.3 + rnd.current() * 0.6)); return { ...s, value: v }; });
        })}
        onReset={() => setSteps(base)}
      />
      <ConversionFunnel steps={steps} layout={values.layout as "bars" | "funnel"} showRate={Boolean(values.showRate)} />
      <p className="mt-3 text-[11px] text-muted-foreground">演示数据为虚构。</p>
    </ChartCard>
  );
}
