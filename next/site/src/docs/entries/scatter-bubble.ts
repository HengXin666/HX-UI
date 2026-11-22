import type { DocEntry } from "../types";

export const scatterBubble: DocEntry = {
  slug: "scatter-bubble",
  name: "ScatterBubble",
  title: "散点气泡图",
  section: "ui",
  group: "图表",
  sub: "2D 图表",
  description: "两个指标的关系，第三个指标用气泡大小：商品价格对销量、气泡是毛利。悬停显示该点的名字和三个读数。",
  file: "src/data/charts/scatter-bubble.tsx",
  importFrom: "@/data",
  demo: () => import("./scatter-bubble.demo"),
  source: () => import("@/data/charts/scatter-bubble.tsx?raw").then((m) => m.default),
  defaults: { bubble: true, groups: true },
  componentDefaults: {},
  presets: [
    { label: "气泡", values: { bubble: true, groups: true } },
    { label: "散点", values: { bubble: false, groups: false } },
  ],
  controls: [
    { type: "toggle", key: "bubble", label: "气泡大小" },
    { type: "toggle", key: "groups", label: "按类目分组" },
  ],
  usage: (v) => `import { ScatterBubble } from "@/data";\n\n<ScatterBubble\n  groups={[\n    { key: "food", label: "食品", points: [{ x: 39, y: 1820${v.bubble ? ", z: 21000" : ""}, name: "坚果礼盒" }] },\n  ]}\n  xLabel="单价"\n  yLabel="销量"${v.bubble ? `\n  zLabel="毛利"` : ""}\n  xFormatter={(v) => \`¥\${v}\`}\n/>\n`,
  props: [
    { name: "groups", type: "{ key, label, color?, points: { x, y, z?, name? }[] }[]", description: "每组一个颜色，多组时显示图例。" },
    { name: "xLabel / yLabel / zLabel", type: "string", description: "三个指标的名字；给了 zLabel 才按 z 画气泡大小。" },
    { name: "range", type: "[number, number]", default: "[40, 520]", description: "气泡面积范围（像素²）。" },
    { name: "xFormatter / yFormatter / height", type: "(v) => string / number", default: "缩写 / 300", description: "刻度格式和高度。" },
  ],
};
