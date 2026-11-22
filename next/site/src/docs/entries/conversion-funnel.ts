import type { DocEntry } from "../types";

export const conversionFunnel: DocEntry = {
  slug: "conversion-funnel",
  name: "ConversionFunnel",
  title: "转化漏斗",
  section: "ui",
  group: "图表",
  description: "从访问到成交每一步还剩多少人：每步人数、占首步的比例、到下一步的转化和流失。条形或漏斗两种布局，数据变化时宽度弹性过渡。",
  file: "src/data/charts/conversion-funnel.tsx",
  importFrom: "@/data",
  demo: () => import("./conversion-funnel.demo"),
  source: () => import("@/data/charts/conversion-funnel.tsx?raw").then((m) => m.default),
  defaults: { layout: "bars", showRate: true, campaign: false },
  componentDefaults: { layout: "bars", showRate: true },
  presets: [
    { label: "条形", values: { layout: "bars", showRate: true } },
    { label: "漏斗", values: { layout: "funnel", showRate: true } },
    { label: "大促期间", values: { campaign: true } },
  ],
  demoOnly: ["campaign"],
  controls: [
    { type: "select", key: "layout", label: "布局", options: [{ value: "bars", label: "条形" }, { value: "funnel", label: "漏斗" }] },
    { type: "toggle", key: "showRate", label: "步间转化" },
    { type: "toggle", key: "campaign", label: "换一组数据" },
  ],
  usage: (v) => `import { ConversionFunnel } from "@/data";\n\n<ConversionFunnel\n  steps={[\n    { label: "访问", value: 48210 },\n    { label: "加购", value: 9120 },\n    { label: "下单", value: 3260 },\n    { label: "支付", value: 2814 },\n  ]}${v.layout === "funnel" ? `\n  layout="funnel"` : ""}${v.showRate ? "" : "\n  showRate={false}"}\n/>\n`,
  props: [
    { name: "steps", type: "{ label, value }[]", description: "按顺序的每一步。" },
    { name: "layout", type: '"bars" | "funnel"', default: '"bars"', description: "条形（信息全）或漏斗形（适合大屏）。" },
    { name: "showRate", type: "boolean", default: "true", description: "显示相邻两步的转化率和流失人数。" },
    { name: "color / format", type: "string / (v) => string", default: "var(--chart-1) / 千分位", description: "颜色和数字格式。" },
  ],
};
