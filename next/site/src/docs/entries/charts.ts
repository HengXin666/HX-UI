import type { DocEntry } from "../types";

export const charts: DocEntry = {
  slug: "charts",
  name: "AreaTrend · BarCompare · Donut · Sparkline",
  en: "Charts",
  title: "图表",
  section: "ui",
  group: "数据",
  description: "看板最常用的四种图：趋势（面积）、对比（柱状）、占比（环形）、迷你走势。颜色取主题令牌，亮暗自动适配；数据变化时增量动画，数据点很多时自动关动画；悬停有提示。基于 Recharts。",
  file: "src/data/charts/area-trend.tsx",
  importFrom: "@/data",
  demo: () => import("./charts.demo"),
  source: () => import("@/data/charts/area-trend.tsx?raw").then((m) => m.default),
  defaults: { type: "area", compare: true, stacked: false, horizontal: false },
  componentDefaults: {},
  presets: [
    { label: "营收趋势", values: { type: "area", compare: true } },
    { label: "渠道对比", values: { type: "bar", compare: true, horizontal: false } },
    { label: "渠道占比", values: { type: "donut" } },
    { label: "指标卡", values: { type: "sparkline" } },
  ],
  controls: [
    { type: "select", key: "type", label: "类型", options: [{ value: "area", label: "趋势" }, { value: "bar", label: "对比" }, { value: "donut", label: "占比" }, { value: "sparkline", label: "迷你" }] },
    { type: "toggle", key: "compare", label: "两组数据" },
    { type: "toggle", key: "stacked", label: "堆叠" },
    { type: "toggle", key: "horizontal", label: "横向柱" },
  ],
  usage: (v) => {
    const head = `import { ${v.type === "area" ? "AreaTrend" : v.type === "bar" ? "BarCompare" : v.type === "donut" ? "Donut" : "Sparkline"} } from "@/data";\n\n`;
    if (v.type === "donut") return head + `<Donut\n  data={[\n    { key: "web", label: "官网", value: 41 },\n    { key: "mini", label: "小程序", value: 30 },\n  ]}\n  center="¥31.2 万"\n  centerLabel="本月营收"\n/>\n`;
    if (v.type === "sparkline") return head + `<Sparkline values={[182, 205, 198, 241, 268, 312]} color="var(--chart-1)" />\n`;
    const series = v.compare ? (v.type === "area" ? `[{ key: "rev", label: "营收" }, { key: "cost", label: "成本" }]` : `[{ key: "now", label: "本月" }, { key: "prev", label: "上月" }]`) : (v.type === "area" ? `[{ key: "rev", label: "营收" }]` : `[{ key: "now", label: "本月" }]`);
    return head + `<${v.type === "area" ? "AreaTrend" : "BarCompare"}\n  data={rows}\n  x="${v.type === "area" ? "m" : "ch"}"\n  series={${series}}${v.stacked ? "\n  stacked" : ""}${v.type === "bar" && v.horizontal ? "\n  horizontal" : ""}\n/>\n`;
  },
  props: [
    { name: "AreaTrend: data / x / series", type: "object[] / string / { key, label, color? }[]", description: "x 是横轴字段，series 每组一条面积。" },
    { name: "AreaTrend: stacked / valueFormatter / showAxis / height", type: "boolean / (v) => string / boolean / number", default: "false / 缩写 / true / 260", description: "堆叠、纵轴格式、坐标轴、高度。" },
    { name: "BarCompare: data / x / series", type: "同上", description: "分组柱状。" },
    { name: "BarCompare: stacked / horizontal / legend", type: "boolean", default: "false / false / 多组时 true", description: "堆叠、横向、图例。" },
    { name: "Donut: data / center / centerLabel / size", type: "{ key, label, value }[] / string / string / number", default: "— / 合计 / 总计 / 220", description: "环形占比，中心显示总数或自定义文字。" },
    { name: "Sparkline: values / color / height", type: "number[] / string / number", default: "— / var(--brand) / 36", description: "无坐标轴的迷你走势，外层加 role=img 和 aria-label。" },
    { name: "animation", type: "ChartAnimationOptions", description: "增量动画设置；超过 ANIMATION_POINT_LIMIT 个点自动关闭。" },
  ],
};
