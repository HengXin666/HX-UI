import type { DocEntry } from "../types";

export const rose: DocEntry = {
  slug: "rose",
  name: "Rose",
  title: "南丁格尔玫瑰图",
  section: "ui",
  group: "图表",
  sub: "2D 图表",
  description: "周期性或方位类数据：各月销售、风向频率、24 小时分布。每个类目一片等角扇形，长度表示大小，可以堆叠多个系列。默认按面积映射（半径取平方根），不会把大值放大成平方倍。增删类目时其余扇形转到新角度让位，新扇形从内圈长出来；图例开关系列时那一层伸缩。",
  file: "src/data/charts/rose.tsx",
  importFrom: "@/data",
  demo: () => import("./rose.demo"),
  source: () => import("@/data/charts/rose.tsx?raw").then((m) => m.default),
  defaults: { dataset: "sales", scale: "area", innerRadius: "0.16", showLabels: true },
  componentDefaults: { scale: "area", innerRadius: "0.16", showLabels: true },
  demoOnly: ["dataset"],
  presets: [
    { label: "月度销售", values: { dataset: "sales", scale: "area", innerRadius: "0.16", showLabels: true } },
    { label: "风向玫瑰", values: { dataset: "wind", scale: "area", innerRadius: "0", showLabels: true } },
    { label: "半径映射", values: { dataset: "sales", scale: "radius", innerRadius: "0.3", showLabels: true } },
  ],
  controls: [
    { type: "select", key: "dataset", label: "数据", options: [{ value: "sales", label: "月度销售" }, { value: "wind", label: "风向频率" }] },
    { type: "select", key: "scale", label: "映射", options: [{ value: "area", label: "面积（推荐）" }, { value: "radius", label: "半径" }] },
    { type: "select", key: "innerRadius", label: "内圈", options: [{ value: "0", label: "无" }, { value: "0.16", label: "小" }, { value: "0.3", label: "大" }] },
    { type: "toggle", key: "showLabels", label: "类目名" },
  ],
  usage: (v) => `import { Rose } from "@/data";\n\n<Rose\n  data={[\n    { label: "1月", store: 102, online: 140, live: 38 },\n    { label: "2月", store: 96, online: 151, live: 45 },\n    { label: "3月", store: 118, online: 172, live: 61 },\n  ]}\n  series={[\n    { key: "store", name: "门店" },\n    { key: "online", name: "线上" },\n    { key: "live", name: "直播" },\n  ]}${v.scale !== "area" ? `\n  scale="${v.scale}"` : ""}${v.innerRadius !== "0.16" ? `\n  innerRadius={${v.innerRadius}}` : ""}${!v.showLabels ? "\n  showLabels={false}" : ""}\n  unit=" 万"\n/>\n`,
  props: [
    { name: "data", type: "{ label, [seriesKey]: number }[]", description: "每个类目一行，按 label 对应做补间；换一份数组即可增删改。" },
    { name: "series", type: "{ key, name, color? }[]", description: "堆叠的系列，从内到外。只有一个就是普通玫瑰图，多个时显示可开关的图例。" },
    { name: "scale", type: '"area" | "radius"', default: '"area"', description: "area：扇形面积和数值成正比，读数诚实；radius：半径成正比，差异更显眼但会夸大。" },
    { name: "innerRadius", type: "number", default: "0.16", description: "中间留空的比例（0–0.6），类目多时留空能让小扇形不挤在圆心。" },
    { name: "showLabels / legend", type: "boolean", default: "true / true", description: "外圈类目名（太密时隔一个写一个）、系列图例。" },
    { name: "size / format / unit", type: "number / (v) => string / string", default: "440 / 千分位 / 空", description: "直径上限（按容器宽度自动缩）、数字格式、单位。" },
  ],
  stageHeight: 720,
};
