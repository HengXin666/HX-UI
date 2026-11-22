import { Bar3D } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, seeded } from "./_chart";

const REGIONS = ["华东", "华南", "华北", "西南", "海外"];
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

export default function Bar3DDemo({ values }: DemoProps) {
  const store = values.data === "orders";
  const data = store ? ORDERS : GMV;
  const total = data.flat().reduce((a, b) => a + b, 0);
  return (
    <ChartCard wide title={store ? "门店订单 · 星期 × 时段" : "GMV · 地区 × 月份"} value={store ? `${total.toLocaleString("zh-CN")} 单` : `${(total / 10000).toFixed(2)} 亿元`}>
      <Bar3D
        values={data}
        xLabels={store ? SLOTS : MONTHS}
        yLabels={store ? DAYS : REGIONS}
        valueLabel={store ? "订单" : "GMV"}
        format={store ? (v) => `${v.toLocaleString("zh-CN")} 单` : (v) => `${v.toLocaleString("zh-CN")} 万元`}
        colorMode={values.colorMode as "value" | "row"}
        gap={Number(values.gap)}
        autoRotate={Boolean(values.autoRotate)}
        label={store ? "门店订单 3D 柱状图" : "GMV 3D 柱状图"}
      />
    </ChartCard>
  );
}
