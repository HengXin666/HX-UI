import type { DocEntry } from "../types";

export const sunburst: DocEntry = {
  slug: "sunburst",
  name: "Sunburst",
  title: "旭日图",
  section: "ui",
  group: "图表",
  sub: "2D 图表",
  description: "多层级占比：区域 › 省市 › 区县，产品 › 服务 › 用途。一圈是一层，角度是占比。点扇区下钻、点圆心或面包屑返回，过渡是同一批扇区展开收拢，看得清从哪来到哪去。数据增删时新扇区从缝里长出来，被删的收拢消失，其余挪位让开。",
  file: "src/data/charts/sunburst.tsx",
  importFrom: "@/data",
  demo: () => import("./sunburst.demo"),
  source: () => import("@/data/charts/sunburst.tsx?raw").then((m) => m.default),
  defaults: { dataset: "sales", maxDepth: "3", showLabels: true, sort: true },
  componentDefaults: { maxDepth: "3", showLabels: true, sort: true },
  demoOnly: ["dataset"],
  presets: [
    { label: "区域销售", values: { dataset: "sales", maxDepth: "3", showLabels: true, sort: true } },
    { label: "云成本 · 两圈", values: { dataset: "cloud", maxDepth: "2", showLabels: true, sort: true } },
    { label: "云成本 · 三圈", values: { dataset: "cloud", maxDepth: "3", showLabels: true, sort: true } },
  ],
  controls: [
    { type: "select", key: "dataset", label: "数据", options: [{ value: "sales", label: "区域销售" }, { value: "cloud", label: "云成本" }] },
    { type: "select", key: "maxDepth", label: "显示圈数", options: [{ value: "2", label: "2 圈" }, { value: "3", label: "3 圈" }] },
    { type: "toggle", key: "showLabels", label: "扇区名称" },
    { type: "toggle", key: "sort", label: "按值排序" },
  ],
  usage: (v) => `import { Sunburst } from "@/data";\n\n<Sunburst\n  data={{\n    name: "全国",\n    children: [\n      { name: "华东", children: [\n        { name: "上海", children: [{ name: "浦东", value: 412 }, { name: "徐汇", value: 238 }] },\n      ] },\n      { name: "华南", children: [{ name: "深圳", value: 456 }] },\n    ],\n  }}${v.maxDepth !== "3" ? `\n  maxDepth={${v.maxDepth}}` : ""}${!v.showLabels ? "\n  showLabels={false}" : ""}${!v.sort ? "\n  sort={false}" : ""}\n  unit=" 万"\n  onDrill={(path) => console.log(path)}\n/>\n`,
  props: [
    { name: "data", type: "{ name, value?, children? }", description: "树。叶子写 value，上级自动求和；根本身显示在圆心。换一棵树即可增删改，扇区按路径（名字链）对应做补间。" },
    { name: "maxDepth", type: "number", default: "3", description: "同时显示几圈；下钻后外圈继续往里补。" },
    { name: "showLabels", type: "boolean", default: "true", description: "扇区内写名字，弧长和圈宽放得下才写，放不下截断。" },
    { name: "sort", type: "boolean", default: "true", description: "同级按值从大到小。数值更新后顺序变化，扇区会转到新位置。" },
    { name: "onDrill", type: "(path: string[]) => void", description: "下钻 / 返回后回调当前路径，空数组是根。" },
    { name: "size / format / unit", type: "number / (v) => string / string", default: "420 / 千分位 / 空", description: "直径上限（按容器宽度自动缩）、数字格式、单位。" },
  ],
  stageHeight: 720,
};
