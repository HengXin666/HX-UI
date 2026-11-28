import type { DocEntry } from "../types";

export const slider: DocEntry = {
  slug: "slider",
  name: "Slider",
  title: "滑块",
  section: "ui",
  group: "表单",
  description: "在一个范围里取值。传两个值就是区间滑块；thumbLabels 给每个滑块起名，formatValue 让读屏念「¥800」而不是「800」。方向键微调，PageUp/PageDown 大步走。",
  file: "src/components/ui/slider.tsx",
  importFrom: "@/components/ui/slider",
  demo: () => import("./slider.demo"),
  source: () => import("@/components/ui/slider.tsx?raw").then((m) => m.default),
  defaults: { range: true, step: 100, showValue: true, disabled: false },
  componentDefaults: {},
  presets: [
    { label: "价格区间", values: { range: true, step: 100 } },
    { label: "单值", values: { range: false, step: 100 } },
    { label: "细刻度", values: { step: 10 } },
  ],
  controls: [
    { type: "toggle", key: "range", label: "区间" },
    { type: "number", key: "step", label: "步长", min: 10, max: 500, step: 10 },
    { type: "toggle", key: "showValue", label: "显示数值" },
    { type: "toggle", key: "disabled", label: "禁用" },
  ],
  usage: (v) => `import * as React from "react";\nimport { Slider } from "@/components/ui/slider";\n\nexport function PriceFilter() {\n  const [price, setPrice] = React.useState(${v.range ? "[800, 3200]" : "[2400]"});\n  return (\n    <Slider\n      min={0}\n      max={5000}\n      step={${v.step}}\n      value={price}\n      onValueChange={setPrice}\n      aria-label="价格"${v.range ? `\n      thumbLabels={["最低价", "最高价"]}` : ""}\n      formatValue={(n) => \`¥\${n}\`}${v.disabled ? "\n      disabled" : ""}\n    />\n  );\n}\n`,
  props: [
    { name: "value / defaultValue", type: "number[]", description: "一个值是单滑块，两个值是区间。" },
    { name: "onValueChange / onValueCommit", type: "(value: number[]) => void", description: "拖动中 / 松手时。筛选请求放在 onValueCommit。" },
    { name: "min / max / step", type: "number", default: "0 / 100 / 1", description: "范围和步长。" },
    { name: "thumbLabels", type: "string[]", description: "每个滑块的读屏名。" },
    { name: "formatValue", type: "(v: number) => string", description: "读屏念的数值文字。" },
    { name: "minStepsBetweenThumbs", type: "number", default: "0", description: "区间两端最少隔几步。" },
    { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "方向。" },
  ],
};
