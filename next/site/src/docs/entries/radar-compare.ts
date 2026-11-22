import type { DocEntry } from "../types";

export const radarCompare: DocEntry = {
  slug: "radar-compare",
  name: "RadarCompare",
  title: "雷达图",
  section: "ui",
  group: "图表",
  description: "多维评分放在一张网上比，一眼看出长板短板：竞品对比、门店体检、员工能力模型。网格可选多边形或圆形。",
  file: "src/data/charts/radar-compare.tsx",
  importFrom: "@/data",
  demo: () => import("./radar-compare.demo"),
  source: () => import("@/data/charts/radar-compare.tsx?raw").then((m) => m.default),
  defaults: { grid: "polygon", compare: true },
  componentDefaults: { grid: "polygon" },
  presets: [
    { label: "竞品对比", values: { compare: true, grid: "polygon" } },
    { label: "单个体检", values: { compare: false, grid: "circle" } },
  ],
  controls: [
    { type: "select", key: "grid", label: "网格", options: [{ value: "polygon", label: "多边形" }, { value: "circle", label: "圆形" }] },
    { type: "toggle", key: "compare", label: "两组对比" },
  ],
  usage: (v) => `import { RadarCompare } from "@/data";\n\n<RadarCompare\n  data={scores}\n  axis="dim"\n  series={[${v.compare ? `{ key: "us", label: "我们" }, { key: "rival", label: "竞品 A" }` : `{ key: "us", label: "本店" }`}]}${v.grid === "circle" ? `\n  grid="circle"` : ""}\n  max={100}\n/>\n`,
  props: [
    { name: "data / axis", type: "object[] / string", description: "每行一个维度，axis 是维度名字段。" },
    { name: "series", type: "{ key, label, color? }[]", description: "每组一片区域，第一组填色更深。" },
    { name: "grid", type: '"polygon" | "circle"', default: '"polygon"', description: "网格形状。" },
    { name: "max / size", type: "number", default: "自动 / 300", description: "刻度上限和尺寸。" },
  ],
};
