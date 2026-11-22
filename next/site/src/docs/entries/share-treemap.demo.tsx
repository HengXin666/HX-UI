import { ShareTreemap, type TreemapNode } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard } from "./_chart";

const NESTED: TreemapNode[] = [
  { name: "数码", children: [{ name: "手机", value: 4200 }, { name: "耳机", value: 1300 }, { name: "平板", value: 1650 }, { name: "配件", value: 620 }] },
  { name: "家居", children: [{ name: "灯具", value: 980 }, { name: "床品", value: 1420 }, { name: "收纳", value: 540 }] },
  { name: "食品", children: [{ name: "零食", value: 1180 }, { name: "咖啡", value: 760 }, { name: "茶饮", value: 430 }] },
  { name: "美妆", children: [{ name: "护肤", value: 1560 }, { name: "彩妆", value: 690 }] },
  { name: "运动", children: [{ name: "跑鞋", value: 880 }, { name: "服饰", value: 520 }] },
];
const FLAT = NESTED.flatMap((g) => g.children!).sort((a, b) => b.value! - a.value!);

export default function ShareTreemapDemo({ values }: DemoProps) {
  return (
    <ChartCard title="11 月各类目 GMV" value="¥1.89 亿" wide>
      <ShareTreemap data={values.nested ? NESTED : FLAT} format={(v) => `¥${v}万`} />
    </ChartCard>
  );
}
