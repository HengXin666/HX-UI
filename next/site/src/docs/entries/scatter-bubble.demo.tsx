import { ScatterBubble, type ScatterGroup } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard, seeded } from "./_chart";

const r = seeded(7);
const make = (names: string[], px: number, py: number) => names.map((name) => {
  const x = Math.round(px * (0.5 + r()));
  const y = Math.round(py * (1.4 - x / (px * 1.6)) * (0.6 + r() * 0.8));
  return { name, x, y, z: Math.round(x * y * (0.2 + r() * 0.3)) };
});
const GROUPS: ScatterGroup[] = [
  { key: "food", label: "食品", points: make(["坚果礼盒", "挂耳咖啡", "燕麦片", "牛肉干", "蜂蜜", "红茶", "果干"], 60, 2400) },
  { key: "home", label: "家居", points: make(["香薰", "抱枕", "台灯", "收纳盒", "保温杯", "床品四件套"], 160, 900) },
  { key: "digital", label: "数码", points: make(["耳机", "充电宝", "数据线", "键盘", "鼠标"], 260, 700) },
];

export default function ScatterBubbleDemo({ values }: DemoProps) {
  const groups = values.groups ? GROUPS : [{ key: "all", label: "商品", points: GROUPS.flatMap((g) => g.points) }];
  const pts = values.bubble ? groups : groups.map((g) => ({ ...g, points: g.points.map(({ z: _z, ...p }) => p) }));
  return (
    <ChartCard title="商品单价 vs 月销量" value="18 个 SKU" delta={values.bubble ? <span className="text-muted-foreground">气泡 = 毛利</span> : undefined}>
      <ScatterBubble groups={pts} xLabel="单价" yLabel="销量" zLabel={values.bubble ? "毛利" : undefined} xFormatter={(v) => `¥${v}`} />
    </ChartCard>
  );
}
