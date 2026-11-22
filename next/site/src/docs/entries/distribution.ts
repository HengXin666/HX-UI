import type { DocEntry } from "../types";

export const distribution: DocEntry = {
  slug: "distribution",
  name: "Distribution",
  title: "直方图 · 箱线图",
  en: "Distribution",
  section: "ui",
  group: "图表",
  sub: "2D 图表",
  description: "看数据长什么样，而不只是一个平均数：客单价集中在哪、加载耗时的长尾有多长。直方图顶上带一条箱线，标出中位数、均值和 P90；切到箱线图可以横向对比几个渠道或版本，离群点单独画。数据增减时柱子长高变矮，新分组从中位数处展开。",
  file: "src/data/charts/distribution.tsx",
  importFrom: "@/data",
  demo: () => import("./distribution.demo"),
  source: () => import("@/data/charts/distribution.tsx?raw").then((m) => m.default),
  defaults: { dataset: "amount", bins: 24, markers: true, boxStrip: true, outliers: true },
  componentDefaults: { bins: 24, markers: true, boxStrip: true, outliers: true },
  demoOnly: ["dataset"],
  presets: [
    { label: "客单价", values: { dataset: "amount", bins: 24, markers: true, boxStrip: true, outliers: true } },
    { label: "加载耗时", values: { dataset: "latency", bins: 40, markers: true, boxStrip: true, outliers: true } },
    { label: "渠道对比 · 箱线", values: { dataset: "channels", bins: 24, markers: true, boxStrip: true, outliers: true } },
  ],
  controls: [
    { type: "select", key: "dataset", label: "数据", options: [{ value: "amount", label: "客单价（直方图）" }, { value: "latency", label: "加载耗时（直方图）" }, { value: "channels", label: "各渠道（箱线图）" }] },
    { type: "number", key: "bins", label: "分档", min: 8, max: 60, step: 4 },
    { type: "toggle", key: "markers", label: "中位数 / 均值 / P90" },
    { type: "toggle", key: "boxStrip", label: "顶部箱线" },
    { type: "toggle", key: "outliers", label: "离群点" },
  ],
  usage: (v) => v.dataset === "channels"
    ? `import { Distribution } from "@/data";\n\n<Distribution\n  mode="box"\n  groups={[\n    { name: "搜索", values: searchOrders },\n    { name: "直播", values: liveOrders },\n  ]}${!v.outliers ? "\n  outliers={false}" : ""}\n  unit=" 元"\n/>\n`
    : `import { Distribution } from "@/data";\n\n<Distribution\n  values={orderAmounts}${Number(v.bins) !== 24 ? `\n  bins={${v.bins}}` : ""}${!v.markers ? "\n  markers={false}" : ""}${!v.boxStrip ? "\n  boxStrip={false}" : ""}\n  unit=" 元"\n/>\n`,
  props: [
    { name: "mode", type: '"histogram" | "box"', default: '"histogram"', description: "直方图看一组；箱线图对比多组。" },
    { name: "values", type: "number[]", description: "直方图的原始数据，组件里自己分档、算分位数。" },
    { name: "groups", type: "{ name, values }[]", description: "箱线图的分组，按 name 识别，增删有动画。" },
    { name: "bins", type: "number", default: "24", description: "大约分几档，会对齐到好看的边界。" },
    { name: "markers / boxStrip / outliers", type: "boolean", default: "true", description: "中位数 / 均值 / P90 标线，直方图顶部箱线，箱线图离群点（须线取 1.5 倍四分位距）。" },
    { name: "clip", type: "number", default: "0.99", description: "长尾截断：横轴只画到 P99，更大的值并成最后一档「x+」，不让一两个极端值把主体压扁。1 表示不截断。" },
    { name: "domain", type: "[min, max]", description: "固定横轴范围，多张图对齐时用。" },
    { name: "format / unit / height", type: "(v) => string / string / number", default: "千分位 / 空 / 300", description: "数字格式、单位、高度。" },
  ],
  stageHeight: 640,
};
