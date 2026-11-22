import { RadarCompare } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard } from "./_chart";

const SCORES = [
  { dim: "价格", us: 82, rival: 70 },
  { dim: "物流", us: 74, rival: 88 },
  { dim: "售后", us: 90, rival: 65 },
  { dim: "品类", us: 68, rival: 84 },
  { dim: "体验", us: 86, rival: 72 },
  { dim: "口碑", us: 79, rival: 76 },
];

export default function RadarCompareDemo({ values }: DemoProps) {
  const compare = Boolean(values.compare);
  return (
    <ChartCard title={compare ? "店铺六项评分 · 我们 vs 竞品 A" : "门店体检 · 六项评分"}>
      <RadarCompare data={SCORES} axis="dim" max={100} grid={values.grid as "polygon" | "circle"}
        series={compare ? [{ key: "us", label: "我们" }, { key: "rival", label: "竞品 A" }] : [{ key: "us", label: "本店" }]} />
    </ChartCard>
  );
}
