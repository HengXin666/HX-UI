import { ConversionFunnel } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard } from "./_chart";

const NORMAL = [{ label: "访问商品页", value: 48210 }, { label: "加入购物车", value: 9120 }, { label: "提交订单", value: 3260 }, { label: "完成支付", value: 2814 }];
const CAMPAIGN = [{ label: "访问商品页", value: 126400 }, { label: "加入购物车", value: 38900 }, { label: "提交订单", value: 15200 }, { label: "完成支付", value: 13980 }];

export default function ConversionFunnelDemo({ values }: DemoProps) {
  const steps = values.campaign ? CAMPAIGN : NORMAL;
  return (
    <ChartCard title={values.campaign ? "双 11 当天转化" : "本周购买转化"} value={`${((steps[3].value / steps[0].value) * 100).toFixed(1)}%`} delta={<span className="text-muted-foreground">访问到支付</span>}>
      <ConversionFunnel steps={steps} layout={values.layout as "bars" | "funnel"} showRate={Boolean(values.showRate)} />
    </ChartCard>
  );
}
