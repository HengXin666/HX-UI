import type { DocEntry } from "../types";

export const heatCalendar: DocEntry = {
  slug: "heat-calendar",
  name: "HeatCalendar",
  title: "热力日历",
  section: "ui",
  group: "图表",
  sub: "2D 图表",
  description: "每天一个格子，颜色深浅就是当天的量：订单、活跃、提交。周一开头、中文月份，格子依次浮现；悬停任一格在下方读数。",
  file: "src/data/charts/heat-calendar.tsx",
  importFrom: "@/data",
  demo: () => import("./heat-calendar.demo"),
  source: () => import("@/data/charts/heat-calendar.tsx?raw").then((m) => m.default),
  defaults: { weeks: 26, levels: 4, color: "var(--chart-1)" },
  componentDefaults: { weeks: 26, levels: 4, color: "var(--chart-1)" },
  presets: [
    { label: "半年", values: { weeks: 26 } },
    { label: "一年", values: { weeks: 52 } },
    { label: "一季度", values: { weeks: 13, levels: 5 } },
  ],
  controls: [
    { type: "number", key: "weeks", label: "周数", min: 8, max: 53, step: 1 },
    { type: "number", key: "levels", label: "色阶", min: 3, max: 6, step: 1 },
    { type: "select", key: "color", label: "颜色", options: [{ value: "var(--chart-1)", label: "品牌" }, { value: "var(--chart-2)", label: "青" }, { value: "var(--chart-5)", label: "绿" }, { value: "var(--chart-4)", label: "品红" }] },
  ],
  usage: (v) => `import { HeatCalendar } from "@/data";\n\n<HeatCalendar\n  values={{ "2026-11-20": 42, "2026-11-21": 58 }}${Number(v.weeks) !== 26 ? `\n  weeks={${v.weeks}}` : ""}${Number(v.levels) !== 4 ? `\n  levels={${v.levels}}` : ""}${v.color !== "var(--chart-1)" ? `\n  color="${v.color}"` : ""}\n  unit=" 单"\n  label="每日订单"\n/>\n`,
  props: [
    { name: "values", type: "Record<YYYY-MM-DD, number>", description: "每天的数值，缺的天按 0。" },
    { name: "end / weeks", type: "Date / number", default: "今天 / 26", description: "结束日和显示的周数。" },
    { name: "levels / color", type: "number / string", default: "4 / var(--chart-1)", description: "色阶档数和主色。" },
    { name: "unit / label", type: "string", default: '"" / 每日热力', description: "读数单位和汇总说明。" },
  ],
};
