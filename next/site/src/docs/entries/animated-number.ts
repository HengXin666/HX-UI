import type { DocEntry } from "../types";
import { FORMAT_CODE, FORMAT_OPTIONS } from "./_shared";

export const animatedNumber: DocEntry = {
  slug: "animated-number",
  name: "AnimatedNumber",
  title: "弹簧数字",
  category: "text",
  description: "进入视口时从起点滚到目标值，之后数值变化从当前值继续滚。等宽数字不抖，读屏只读终值。",
  file: "src/motion/animated-number.tsx",
  importFrom: "@/motion/animated-number",
  demo: () => import("./animated-number.demo"),
  source: () => import("@/motion/animated-number.tsx?raw").then((m) => m.default),
  defaults: { value: 1284960, format: "currency", duration: 1.2, from: 0 },
  componentDefaults: { duration: 1.2, from: 0 },
  presets: [
    { label: "金额", values: { value: 1284960, format: "currency" } },
    { label: "用户数", values: { value: 3820000, format: "compact" } },
    { label: "转化率", values: { value: 37.4, format: "percent" } },
    { label: "慢速", values: { duration: 2.4 } },
  ],
  demoOnly: ["format", "value"],
  controls: [
    { type: "number", key: "value", label: "目标值", min: 0, max: 5000000, step: 1000 },
    { type: "select", key: "format", label: "格式", options: FORMAT_OPTIONS },
    { type: "number", key: "duration", label: "时长", min: 0.2, max: 3, step: 0.1, unit: "s" },
    { type: "number", key: "from", label: "起点", min: 0, max: 100000, step: 1000 },
  ],
  usage: (v) => {
    const f = FORMAT_CODE[String(v.format)];
    const val = v.format === "percent" ? Number(v.value) / 100 : v.value;
    const lines = [`value={${val}}`, f && `format={${f}}`, v.duration !== 1.2 && `duration={${v.duration}}`, v.from !== 0 && `from={${v.from}}`].filter(Boolean);
    return `import { AnimatedNumber } from "@/motion/animated-number";\n\nexport function Revenue() {\n  return (\n    <AnimatedNumber\n${lines.map((l) => "      " + l).join("\n")}\n      className="text-6xl font-medium"\n    />\n  );\n}\n`;
  },
  props: [
    { name: "value", type: "number", description: "目标值；之后改变会从当前值继续滚动。" },
    { name: "format", type: "Intl.NumberFormatOptions", description: "数字格式，如金额、百分比、缩写。" },
    { name: "locale", type: "string", default: '"zh-CN"', description: "格式化用的地区。" },
    { name: "from", type: "number", default: "0", description: "首次滚动的起点。" },
    { name: "duration", type: "number", default: "1.2", description: "滚动时长，秒。" },
    { name: "className", type: "string", description: "加在外层 span 上。" },
  ],
};
