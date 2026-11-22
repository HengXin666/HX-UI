import type { DocEntry } from "../types";

export const sankeyFlow: DocEntry = {
  slug: "sankey-flow",
  name: "SankeyFlow",
  title: "桑基图",
  section: "ui",
  group: "图表",
  sub: "2D 图表",
  description: "流量从哪来、到哪去：渠道 → 落地页 → 成交，或者预算一层层怎么分下去。连线粗细就是量，按层上色；悬停或 Tab 聚焦节点会高亮它的上下游。数据变化时节点按名字、连线按起点→终点配对：位置和粗细平滑过渡，新渠道淡入，去掉的淡出。",
  file: "src/data/charts/sankey-flow.tsx",
  importFrom: "@/data",
  demo: () => import("./sankey-flow.demo"),
  source: () => import("@/data/charts/sankey-flow.tsx?raw").then((m) => m.default),
  defaults: { deep: true },
  componentDefaults: {},
  presets: [
    { label: "渠道 → 成交", values: { deep: true } },
    { label: "两层", values: { deep: false } },
  ],
  controls: [{ type: "toggle", key: "deep", label: "三层" }],
  usage: () => `import { SankeyFlow } from "@/data";\n\n<SankeyFlow\n  nodes={[{ name: "搜索" }, { name: "社媒" }, { name: "商品页" }, { name: "成交" }]}\n  links={[\n    { source: 0, target: 2, value: 5200 },\n    { source: 1, target: 2, value: 3100 },\n    { source: 2, target: 3, value: 1800 },\n  ]}\n/>\n`,
  props: [
    { name: "nodes", type: "{ name }[]", description: "节点，层级由连线自动推出。名字是动画配对的键，不要重名；没有连线的节点不画。" },
    { name: "links", type: "{ source, target, value }[]", description: "source / target 是 nodes 的下标。" },
    { name: "format / height", type: "(v) => string / number", default: "千分位 / 320", description: "数字格式和高度。" },
    { name: "ariaLabel", type: "string", default: "桑基图", description: "整张图的读屏名称；每个节点和连线都能聚焦并读出数值。" },
  ],
};
