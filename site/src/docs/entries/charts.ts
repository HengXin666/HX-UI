import type { DocEntry } from "../types";

export const charts: DocEntry = {
  slug: "charts",
  name: "AreaTrend · BarCompare · Donut · Sparkline",
  en: "Charts",
  title: "基础图表",
  section: "ui",
  group: "图表",
  sub: "2D 图表",
  description: "看板最常用的四种图：趋势（面积）、对比（柱状）、占比（环形）、迷你走势。颜色取主题令牌，亮暗自动适配；数据变化时按业务键配对：新增的点或扇区长出来，删掉的收回去，其余平滑让位；数据点很多时自动关动画；悬停有提示。用上方操作条试试增删改。基于 Recharts。",
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
    return head + `<${v.type === "area" ? "AreaTrend" : "BarCompare"}\n  data={rows}\n  x="${v.type === "area" ? "m" : "ch"}"\n  animation={{ match: { dataKey: "${v.type === "area" ? "id" : "ch"}" } }}\n  series={${series}}${v.stacked ? "\n  stacked" : ""}${v.type === "bar" && v.horizontal ? "\n  horizontal" : ""}\n/>\n`;
  },
  props: [
    { name: "AreaTrend: data / x / series", type: "object[] / string / { key, label, color? }[]", description: "x 是横轴字段，series 每组一条面积。" },
    { name: "AreaTrend: stacked / valueFormatter / showAxis / height", type: "boolean / (v) => string / boolean / number", default: "false / 缩写 / true / 260", description: "堆叠、纵轴格式、坐标轴、高度。" },
    { name: "BarCompare: data / x / series", type: "同上", description: "分组柱状。" },
    { name: "BarCompare: stacked / horizontal / legend", type: "boolean", default: "false / false / 多组时 true", description: "堆叠、横向、图例。" },
    { name: "Donut: data / center / centerLabel / size", type: "{ key, label, value, color? }[] / string / string / number", default: "— / 合计 / 总计 / 220", description: "环形占比，中心显示总数或自定义文字。增删扇区时按 key 配对；需要颜色跟着扇区走就传 color。" },
    { name: "Sparkline: values / color / height", type: "number[] / string / number", default: "— / var(--brand) / 36", description: "无坐标轴的迷你走势，外层加 role=img 和 aria-label。" },
    { name: "Sparkline: offset / animate", type: "number / boolean", default: "0 / true", description: "offset 是 values[0] 的序号，滑动窗口时每推入一个点加 1，线会平滑左移。" },
    { name: "animation", type: "ChartAnimationOptions", description: "增量动画设置。match: { dataKey } 按业务键配对，增删时进场和退场各自动画；超过 ANIMATION_POINT_LIMIT 个点自动关闭。" },
  ],
};
