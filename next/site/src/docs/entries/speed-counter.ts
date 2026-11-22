import type { DocEntry } from "../types";
import { FORMAT_CODE, FORMAT_OPTIONS } from "./_shared";

export const speedCounter: DocEntry = {
  slug: "speed-counter",
  name: "SpeedCounter",
  title: "滚动计数",
  category: "text",
  description: "每一位是一根 0 到 9 的竖条，逐位滚动，像机械计数器。高位比低位稍慢，一眼看出变了多少。",
  file: "src/interactions/speed-counter/index.tsx",
  importFrom: "@/interactions/speed-counter",
  demo: () => import("./speed-counter.demo"),
  source: () => import("@/interactions/speed-counter/index.tsx?raw").then((m) => m.default),
  defaults: { value: 2486, format: "decimal", duration: 0.9, step: 137 },
  componentDefaults: { duration: 0.9 },
  presets: [
    { label: "库存", values: { value: 2486, format: "decimal", step: 137 } },
    { label: "金额", values: { value: 52990, format: "currency", step: 1250 } },
    { label: "百分比", values: { value: 42, format: "percent", step: 7 } },
    { label: "慢速", values: { duration: 1.8 } },
  ],
  demoOnly: ["format", "value", "step"],
  controls: [
    { type: "number", key: "value", label: "初值", min: 0, max: 100000, step: 1 },
    { type: "select", key: "format", label: "格式", options: FORMAT_OPTIONS },
    { type: "number", key: "duration", label: "每位时长", min: 0.2, max: 2, step: 0.1, unit: "s" },
    { type: "number", key: "step", label: "按钮步长", min: 1, max: 5000, step: 1 },
  ],
  usage: (v) => {
    const f = FORMAT_CODE[String(v.format)];
    const lines = ["value={stock}", f && `format={${f}}`, v.duration !== 0.9 && `duration={${v.duration}}`].filter(Boolean);
    return `import { SpeedCounter } from "@/interactions/speed-counter";\n\nexport function Stock({ stock }: { stock: number }) {\n  return (\n    <SpeedCounter\n${lines.map((l) => "      " + l).join("\n")}\n      className="text-6xl font-medium"\n    />\n  );\n}\n`;
  },
  props: [
    { name: "value", type: "number", description: "当前值；变化时每一位各自滚到新数字。" },
    { name: "format", type: "Intl.NumberFormatOptions", description: "数字格式；分隔符和符号不滚动。" },
    { name: "locale", type: "string", default: '"zh-CN"', description: "格式化用的地区。" },
    { name: "duration", type: "number", default: "0.9", description: "每一位的滚动时长，秒；高位依次多 0.04 秒。" },
    { name: "className", type: "string", description: "加在外层 span 上；字号决定每一位的高度。" },
  ],
};
