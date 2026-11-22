import type { DocEntry } from "../types";

export const shareTreemap: DocEntry = {
  slug: "share-treemap",
  name: "ShareTreemap",
  title: "矩形树图",
  section: "ui",
  group: "图表",
  sub: "2D 图表",
  description: "面积就是占比，比环形图装得下多得多的项：类目、品牌、SKU 结构。两层数据时同一组同色，格子太小自动不写字。",
  file: "src/data/charts/share-treemap.tsx",
  importFrom: "@/data",
  demo: () => import("./share-treemap.demo"),
  source: () => import("@/data/charts/share-treemap.tsx?raw").then((m) => m.default),
  defaults: { nested: true },
  componentDefaults: {},
  presets: [
    { label: "类目 › 品牌", values: { nested: true } },
    { label: "一层", values: { nested: false } },
  ],
  controls: [{ type: "toggle", key: "nested", label: "两层" }],
  usage: (v) => `import { ShareTreemap } from "@/data";\n\n<ShareTreemap\n  data={${v.nested ? `[\n    { name: "数码", children: [{ name: "手机", value: 4200 }, { name: "耳机", value: 1300 }] },\n    { name: "家居", children: [{ name: "灯具", value: 980 }] },\n  ]` : `[\n    { name: "手机", value: 4200 },\n    { name: "耳机", value: 1300 },\n  ]`}}\n  format={(v) => \`¥\${v}万\`}\n/>\n`,
  props: [
    { name: "data", type: "{ name, value?, children? }[]", description: "一层直接给 value；两层给 children，同组同色。" },
    { name: "format / height", type: "(v) => string / number", default: "千分位 / 300", description: "数字格式和高度。" },
  ],
};
