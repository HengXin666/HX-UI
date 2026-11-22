import type { DocEntry } from "../types";

export const gauge: DocEntry = {
  slug: "gauge",
  name: "Gauge",
  title: "仪表盘",
  section: "ui",
  group: "图表",
  description: "一个指标离目标还有多远：健康分、目标达成率、服务器负载。进度弧或指针两种样式，可按区间变色；数值变化时弧、指针和数字一起弹性过渡，减弱动效时直接到位。读屏按 meter 播报。",
  file: "src/data/charts/gauge.tsx",
  importFrom: "@/data",
  demo: () => import("./gauge.demo"),
  source: () => import("@/data/charts/gauge.tsx?raw").then((m) => m.default),
  defaults: { value: 72, variant: "arc", bands: true, sweep: 240 },
  componentDefaults: { variant: "arc", sweep: 240 },
  presets: [
    { label: "达成率", values: { value: 72, variant: "arc", bands: false, sweep: 240 } },
    { label: "健康分", values: { value: 86, variant: "arc", bands: true, sweep: 270 } },
    { label: "负载", values: { value: 64, variant: "needle", bands: true, sweep: 180 } },
  ],
  controls: [
    { type: "number", key: "value", label: "数值", min: 0, max: 100, step: 1 },
    { type: "select", key: "variant", label: "样式", options: [{ value: "arc", label: "进度弧" }, { value: "needle", label: "指针" }] },
    { type: "toggle", key: "bands", label: "分段变色" },
    { type: "number", key: "sweep", label: "弧度", min: 180, max: 300, step: 10, unit: "°" },
  ],
  usage: (v) => `import { Gauge } from "@/data";\n\n<Gauge\n  value={${v.value}}\n  label="目标达成"${v.variant === "needle" ? `\n  variant="needle"` : ""}${Number(v.sweep) !== 240 ? `\n  sweep={${v.sweep}}` : ""}${v.bands ? `\n  bands={[\n    { to: 40, color: "var(--destructive)" },\n    { to: 70, color: "var(--warning)" },\n    { to: 100, color: "var(--success)" },\n  ]}` : ""}\n  format={(v) => \`\${Math.round(v)}%\`}\n/>\n`,
  props: [
    { name: "value / min / max", type: "number", default: "— / 0 / 100", description: "当前值和范围，超出会被夹住。" },
    { name: "label / format", type: "string / (v) => string", description: "下方说明和中心数字格式。" },
    { name: "variant", type: '"arc" | "needle"', default: '"arc"', description: "进度弧或指针。" },
    { name: "bands", type: "{ to, color }[]", description: "分段颜色：进度弧按当前值所在段变色，指针样式画出全部分段。" },
    { name: "color / sweep / size / thickness", type: "string / number", default: "var(--chart-1) / 240 / 220 / 14", description: "单色、弧的角度、尺寸、粗细。" },
  ],
};
