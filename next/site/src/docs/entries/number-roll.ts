import type { DocEntry } from "../types";
import { FORMAT_CODE, FORMAT_OPTIONS } from "./_shared";

export const numberRoll: DocEntry = {
  slug: "number-roll",
  name: "NumberRoll",
  title: "数字滚动",
  section: "visual",
  group: "文字",
  description: "两种手感：spring 整个数从起点弹到目标值，适合首屏大数字；digits 每一位各自滚动，像机械计数器，适合会频繁变化的金额和库存。读屏只读终值。",
  file: "src/text/number-roll.tsx",
  importFrom: "@/text/number-roll",
  demo: () => import("./number-roll.demo"),
  source: () => import("@/text/number-roll.tsx?raw").then((m) => m.default),
  defaults: { mode: "spring", value: 1284960, format: "currency", duration: 1.2, step: 48600 },
  componentDefaults: {},
  presets: [
    { label: "首屏金额", values: { mode: "spring", value: 1284960, format: "currency", duration: 1.2, step: 48600 } },
    { label: "库存计数", values: { mode: "digits", value: 2486, format: "decimal", duration: 0.9, step: 137 } },
    { label: "用户数", values: { mode: "spring", value: 3820000, format: "compact", duration: 1.6, step: 120000 } },
    { label: "转化率", values: { mode: "digits", value: 37, format: "percent", duration: 0.9, step: 3 } },
  ],
  demoOnly: ["value", "step"],
  controls: [
    { type: "select", key: "mode", label: "手感", options: [{ value: "spring", label: "整体弹动" }, { value: "digits", label: "逐位滚动" }] },
    { type: "select", key: "format", label: "格式", options: FORMAT_OPTIONS },
    { type: "number", key: "duration", label: "时长", min: 0.2, max: 3, step: 0.1, unit: "s" },
    { type: "number", key: "value", label: "初值", min: 0, max: 5000000, step: 1 },
    { type: "number", key: "step", label: "按钮步长", min: 1, max: 500000, step: 1 },
  ],
  usage: (v) => {
    const f = FORMAT_CODE[String(v.format)];
    const dflt = v.mode === "digits" ? 0.9 : 1.2;
    const lines = ["value={revenue}", v.mode !== "spring" && `mode="${v.mode}"`, f && `format={${f}}`, v.duration !== dflt && `duration={${v.duration}}`].filter(Boolean);
    return `import { NumberRoll } from "@/text/number-roll";\n\nexport function Revenue({ revenue }: { revenue: number }) {\n  return (\n    <NumberRoll\n${lines.map((l) => "      " + l).join("\n")}\n      className="text-6xl font-medium"\n    />\n  );\n}\n`;
  },
  props: [
    { name: "value", type: "number", description: "目标值；变化时从当前值继续滚，不重播。" },
    { name: "mode", type: '"spring" | "digits"', default: '"spring"', description: "spring 整体弹动并在进入视口时开始；digits 逐位滚动，高位依次慢一点。" },
    { name: "format", type: "Intl.NumberFormatOptions", description: "数字格式；分隔符和符号不滚动。" },
    { name: "locale", type: "string", default: '"zh-CN"', description: "格式化用的地区。" },
    { name: "duration", type: "number", default: "1.2 / 0.9", description: "spring 是整体时长，digits 是每一位的时长，秒。" },
    { name: "from", type: "number", default: "0", description: "仅 spring：首次滚动的起点。" },
    { name: "className", type: "string", description: "字号决定 digits 模式每一位的高度。" },
  ],
};
