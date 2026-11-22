import type { DocEntry } from "../types";

export const shareTreemap: DocEntry = {
  slug: "share-treemap",
  name: "ShareTreemap",
  title: "矩形树图",
  section: "ui",
  group: "图表",
  sub: "2D 图表",
  description: "面积就是占比，比环形图装得下多得多的项：类目、品牌、SKU 结构。两层数据时同一组同色，格子太小自动不写字。数据变化时按名字配对：留下的格子滑到新位置并改大小，新格子原地放大出现，删掉的缩小淡出；悬停或 Tab 聚焦看读数。",
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
    { name: "data", type: "{ name, value?, children?, color? }[]", description: "一层直接给 value；两层给 children，同组同色。名字是动画配对的键，同组内不要重名。" },
    { name: "format / height", type: "(v) => string / number", default: "千分位 / 300", description: "数字格式和高度。" },
    { name: "ariaLabel", type: "string", default: "矩形树图", description: "整张图的读屏名称；每个格子读出名称、数值和占比。" },
  ],
};
