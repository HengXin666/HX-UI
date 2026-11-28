import type { DocEntry } from "../types";

export const globeArcs: DocEntry = {
  slug: "globe-arcs",
  name: "GlobeArcs",
  en: "GlobeArcs",
  title: "地球飞线",
  section: "ui",
  group: "图表",
  sub: "3D 图表",
  description: "“从哪到哪” 的流向放到地球上：跨境订单、CDN 回源、航线。陆地是点阵，飞线按大圆弧走、粗细按量，流光从起点跑向终点，端点有脉冲环；悬停一条线会高亮它、其余变淡，并显示读数。减弱动效时不自转、不流动，线直接画满。线路按“起点→终点”配对：新线从起点画到终点，删掉的线从起点收回，量变化时粗细过渡，端点跟着放大或缩掉。",
  file: "src/data/charts3d/globe-arcs.tsx",
  importFrom: "@/data",
  demo: () => import("./globe-arcs.demo"),
  source: () => import("@/data/charts3d/impl/globe-scene.tsx?raw").then((m) => m.default),
  stageHeight: 680,
  defaults: { data: "orders", flow: true, autoRotate: true },
  componentDefaults: { flow: true, autoRotate: true },
  demoOnly: ["data"],
  presets: [
    { label: "跨境订单", values: { data: "orders", flow: true, autoRotate: true } },
    { label: "CDN 回源", values: { data: "cdn", flow: true, autoRotate: true } },
    { label: "静态", values: { flow: false, autoRotate: false } },
  ],
  controls: [
    { type: "select", key: "data", label: "数据", options: [{ value: "orders", label: "跨境订单" }, { value: "cdn", label: "CDN 回源" }] },
    { type: "toggle", key: "flow", label: "流光" },
    { type: "toggle", key: "autoRotate", label: "自动旋转" },
  ],
  usage: (v) => `import { GlobeArcs } from "@/data";\n\n<GlobeArcs\n  arcs={[\n    { from: [31.23, 121.47], to: [34.05, -118.24], fromName: "上海", toName: "洛杉矶", value: 18200 },\n    // …\n  ]}\n  valueLabel="订单"\n  format={(v) => \`\${v} 单\`}${v.flow ? "" : "\n  flow={false}"}${v.autoRotate ? "" : "\n  autoRotate={false}"}\n/>\n`,
  props: [
    { name: "arcs", type: "{ from, to, fromName?, toName?, value?, label? }[]", description: "from / to 是 [纬度, 经度]；value 决定粗细，悬停时显示。" },
    { name: "points", type: "{ at, name }[]", description: "额外标注的城市点。" },
    { name: "valueLabel / format", type: "string / (v) => string", default: '"数值" / 千分位', description: "悬停读数的名称和格式。" },
    { name: "flow / autoRotate", type: "boolean", default: "true / true", description: "流光和自转；减弱动效时都关闭。" },
    { name: "focus", type: "[number, number]", default: "第一条线起点", description: "初始朝向，双击或按 0 回到这里。" },
    { name: "height / label", type: "number / string", default: '460 / "地球飞线"', description: "高度和读屏名称；读屏会读到全部流向列表。" },
  ],
};
