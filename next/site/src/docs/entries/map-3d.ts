import type { DocEntry } from "../types";

export const map3d: DocEntry = {
  slug: "map-3d",
  name: "Map3D",
  en: "Map3D",
  title: "3D 地图",
  section: "ui",
  group: "图表",
  sub: "3D 图表",
  description: "省份按数值挤出成柱体，高度和颜色都表示量：各省 GMV、门店数、用户数。省份按名字配对：新增数据的省份从地面升起，去掉数据的落回地面变灰，数值变化时高度和颜色过渡，前几名的名字跟着柱顶走。悬停高亮并显示读数；拖动旋转、滚轮缩放、方向键转视角。地图数据和 three.js 都按需加载；不支持 WebGL 时退回数据表。",
  file: "src/data/charts3d/map3d.tsx",
  importFrom: "@/data",
  demo: () => import("./map-3d.demo"),
  source: () => import("@/data/charts3d/impl/map3d-scene.tsx?raw").then((m) => m.default),
  stageHeight: 660,
  defaults: { data: "gmv", labelTop: "5", autoRotate: false },
  componentDefaults: { labelTop: "5", autoRotate: false },
  demoOnly: ["data"],
  presets: [
    { label: "各省 GMV", values: { data: "gmv", labelTop: "5" } },
    { label: "门店数", values: { data: "stores", labelTop: "3" } },
    { label: "自动旋转", values: { autoRotate: true } },
  ],
  controls: [
    { type: "select", key: "data", label: "数据", options: [{ value: "gmv", label: "GMV" }, { value: "stores", label: "门店数" }] },
    { type: "select", key: "labelTop", label: "标名字", options: [{ value: "0", label: "不标" }, { value: "3", label: "前 3" }, { value: "5", label: "前 5" }, { value: "10", label: "前 10" }] },
    { type: "toggle", key: "autoRotate", label: "自动旋转" },
  ],
  usage: (v) => `import { Map3D } from "@/data";\n\n<Map3D\n  data={[{ name: "广东", value: 1820 }, { name: "浙江", value: 1460 }, ...]}\n  metric="GMV"\n  format={(v) => \`\${v} 亿元\`}${v.labelTop !== "5" ? `\n  labelTop={${v.labelTop}}` : ""}${v.autoRotate ? "\n  autoRotate" : ""}\n/>\n`,
  props: [
    { name: "data", type: "{ name, value }[]", description: "省份名写全称或简称都行；没给数据的省份平铺成灰色。" },
    { name: "metric / format", type: "string / (v) => string", default: '"数值" / 千分位', description: "指标名和数字格式，用在提示和读屏表格里。" },
    { name: "labelTop", type: "number", default: "5", description: "柱顶标出前 N 名的省份简称。" },
    { name: "autoRotate / height / label", type: "boolean / number / string", default: 'false / 460 / "3D 地图"', description: "自动旋转、高度、读屏名称。" },
  ],
};
