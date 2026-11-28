import type { DocEntry } from "../types";

export const scatter3d: DocEntry = {
  slug: "scatter-3d",
  name: "Scatter3D",
  en: "Scatter3D",
  title: "3D 散点图",
  section: "ui",
  group: "图表",
  sub: "3D 图表",
  description: "三个指标一起看：价格 × 销量 × 评分、延迟 × 吞吐 × 错误率。分组上色，气泡大小还能再编码一个量，每个点落一条细线到地面方便看高度。点按 id 配对：新点原地放大出现，删掉的缩小消失，数值变化时滑到新位置，坐标刻度跟着数据范围平滑调整。悬停高亮并显示读数；拖动旋转、滚轮缩放、方向键转视角。three.js 按需加载，不支持 WebGL 时退回数据表。",
  file: "src/data/charts3d/scatter3d.tsx",
  importFrom: "@/data",
  demo: () => import("./scatter-3d.demo"),
  source: () => import("@/data/charts3d/impl/scatter-scene.tsx?raw").then((m) => m.default),
  stageHeight: 660,
  defaults: { data: "products", stems: true, autoRotate: true },
  componentDefaults: { stems: true, autoRotate: false },
  demoOnly: ["data"],
  presets: [
    { label: "商品 · 价格销量评分", values: { data: "products", stems: true, autoRotate: true } },
    { label: "服务 · 延迟吞吐错误率", values: { data: "services", stems: true, autoRotate: true } },
    { label: "静止 · 无落线", values: { stems: false, autoRotate: false } },
  ],
  controls: [
    { type: "select", key: "data", label: "数据", options: [{ value: "products", label: "商品" }, { value: "services", label: "服务" }] },
    { type: "toggle", key: "stems", label: "落线" },
    { type: "toggle", key: "autoRotate", label: "自动旋转" },
  ],
  usage: (v) => `import { Scatter3D } from "@/data";\n\n<Scatter3D\n  points={[{ id: "sku-1", x: 129, y: 4200, z: 4.7, group: "数码", size: 80 }, ...]}\n  xLabel="价格" yLabel="销量" zLabel="评分"${v.stems ? "" : "\n  stems={false}"}${v.autoRotate ? "\n  autoRotate" : ""}\n/>\n`,
  props: [
    { name: "points", type: "{ id, x, y, z, group?, size?, label? }[]", description: "id 用来配对做增删改动画；group 决定颜色；size 决定气泡大小。" },
    { name: "xLabel / yLabel / zLabel", type: "string", default: '"X" / "Y" / "Z"', description: "三条轴的名字，z 是高度。" },
    { name: "format", type: '(v, axis: "x" | "y" | "z") => string', description: "刻度和提示里的数字格式，按轴区分。" },
    { name: "stems / autoRotate", type: "boolean", default: "true / false", description: "落线和自动旋转（减弱动效时不转）。" },
    { name: "height / label", type: "number / string", default: '440 / "3D 散点图"', description: "高度和读屏名称；读屏另有数据表。" },
  ],
};
