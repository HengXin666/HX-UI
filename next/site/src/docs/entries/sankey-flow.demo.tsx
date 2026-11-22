import { SankeyFlow } from "@/data";
import type { DemoProps } from "../types";
import { ChartCard } from "./_chart";

const DEEP = {
  nodes: [{ name: "搜索" }, { name: "社媒" }, { name: "直接访问" }, { name: "首页" }, { name: "活动页" }, { name: "商品页" }, { name: "成交" }, { name: "流失" }],
  links: [
    { source: 0, target: 5, value: 5200 }, { source: 0, target: 3, value: 1800 },
    { source: 1, target: 4, value: 3600 }, { source: 1, target: 5, value: 1200 },
    { source: 2, target: 3, value: 2400 },
    { source: 3, target: 5, value: 3100 }, { source: 3, target: 7, value: 1100 },
    { source: 4, target: 5, value: 2500 }, { source: 4, target: 7, value: 1100 },
    { source: 5, target: 6, value: 2814 }, { source: 5, target: 7, value: 9186 },
  ],
};
const FLAT = {
  nodes: [{ name: "搜索" }, { name: "社媒" }, { name: "直接访问" }, { name: "成交" }, { name: "流失" }],
  links: [
    { source: 0, target: 3, value: 1420 }, { source: 0, target: 4, value: 5580 },
    { source: 1, target: 3, value: 860 }, { source: 1, target: 4, value: 3940 },
    { source: 2, target: 3, value: 534 }, { source: 2, target: 4, value: 1866 },
  ],
};

export default function SankeyFlowDemo({ values }: DemoProps) {
  const d = values.deep ? DEEP : FLAT;
  return (
    <ChartCard title="本周流量去向" value="14,200 访客" delta={<span className="text-success">成交 2,814</span>} wide>
      <SankeyFlow key={values.deep ? "d" : "f"} nodes={d.nodes} links={d.links} />
    </ChartCard>
  );
}
