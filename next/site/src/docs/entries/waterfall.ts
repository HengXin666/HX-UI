import type { DocEntry } from "../types";

export const waterfall: DocEntry = {
  slug: "waterfall",
  name: "Waterfall",
  title: "瀑布图",
  section: "ui",
  group: "图表",
  sub: "2D 图表",
  description: "利润怎么从收入一步步变成净利，预算、现金流的增减从哪来。每根柱子接着上一根的台阶，合计柱从 0 起；增删项目时新柱子从台阶上长出来，其余柱子平移让位。窄屏自动横过来。",
  file: "src/data/charts/waterfall.tsx",
  importFrom: "@/data",
  demo: () => import("./waterfall.demo"),
  source: () => import("@/data/charts/waterfall.tsx?raw").then((m) => m.default),
  defaults: { dataset: "profit", scheme: "finance", orientation: "auto", showValues: true, connectors: true },
  componentDefaults: { scheme: "finance", orientation: "auto", showValues: true, connectors: true },
  demoOnly: ["dataset"],
  presets: [
    { label: "利润拆解", values: { dataset: "profit", scheme: "finance", orientation: "auto", showValues: true, connectors: true } },
    { label: "现金流 · 横向", values: { dataset: "cash", scheme: "finance", orientation: "horizontal", showValues: true, connectors: true } },
    { label: "A 股配色", values: { dataset: "profit", scheme: "cn", orientation: "auto", showValues: true, connectors: true } },
  ],
  controls: [
    { type: "select", key: "dataset", label: "数据", options: [{ value: "profit", label: "利润拆解" }, { value: "cash", label: "现金流" }] },
    { type: "select", key: "scheme", label: "涨跌配色", options: [{ value: "finance", label: "涨绿跌红" }, { value: "cn", label: "涨红跌绿" }] },
    { type: "select", key: "orientation", label: "方向", options: [{ value: "auto", label: "自动" }, { value: "vertical", label: "竖向" }, { value: "horizontal", label: "横向" }] },
    { type: "toggle", key: "showValues", label: "柱顶数值" },
    { type: "toggle", key: "connectors", label: "台阶连线" },
  ],
  usage: (v) => `import { Waterfall } from "@/data";\n\n<Waterfall\n  data={[\n    { label: "营业收入", value: 1280, type: "start" },\n    { label: "营业成本", value: -612 },\n    { label: "毛利", type: "total" },\n    { label: "费用", value: -408 },\n    { label: "净利润", type: "total" },\n  ]}${v.scheme !== "finance" ? `\n  scheme="${v.scheme}"` : ""}${v.orientation !== "auto" ? `\n  orientation="${v.orientation}"` : ""}${!v.showValues ? "\n  showValues={false}" : ""}${!v.connectors ? "\n  connectors={false}" : ""}\n  unit=" 万"\n/>\n`,
  props: [
    { name: "data", type: '{ label, value?, type?: "start" | "delta" | "total" }[]', description: "start 设定期初，delta 是增减额（不写 type 默认），total 自动算到此为止的合计。换一份数组即可增删，带进退场动画。" },
    { name: "scheme", type: '"finance" | "cn"', default: '"finance"', description: "finance 涨绿跌红，cn 涨红跌绿。" },
    { name: "orientation", type: '"auto" | "vertical" | "horizontal"', default: '"auto"', description: "auto 在宽度小于 520px 时横过来，类目名不再挤。" },
    { name: "showValues / connectors", type: "boolean", default: "true / true", description: "柱顶数值、台阶虚线。" },
    { name: "format / unit / height", type: "(v) => string / string / number", default: "千分位 / 空 / 320", description: "数字格式、单位、竖向时的高度（横向按项数自动撑高）。" },
  ],
  stageHeight: 600,
};
