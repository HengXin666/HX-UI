import type { DocEntry } from "../types";

export const bullet: DocEntry = {
  slug: "bullet",
  name: "Bullet",
  title: "子弹图",
  section: "ui",
  group: "图表",
  sub: "2D 图表",
  description: "KPI 对目标，一行一个指标：底色是差 / 中 / 好区间，粗条是实际值，竖线是目标，蓝色细线是去年同期。比仪表盘省地方，一屏能放十几个。支持越低越好的指标（退款率、时效）；数据刷新时条和线平滑移动，指标增删整行展开收起。",
  file: "src/data/charts/bullet.tsx",
  importFrom: "@/data",
  demo: () => import("./bullet.demo"),
  source: () => import("@/data/charts/bullet.tsx?raw").then((m) => m.default),
  defaults: { statusColor: true, size: "md" },
  componentDefaults: { statusColor: true, size: "md" },
  presets: [
    { label: "经营看板", values: { statusColor: true, size: "md" } },
    { label: "紧凑 · 单色", values: { statusColor: false, size: "sm" } },
  ],
  controls: [
    { type: "toggle", key: "statusColor", label: "达标变绿" },
    { type: "select", key: "size", label: "尺寸", options: [{ value: "md", label: "标准" }, { value: "sm", label: "紧凑" }] },
  ],
  usage: (v) => `import { Bullet } from "@/data";\n\n<Bullet\n  items={[\n    { label: "GMV", sub: "万元", value: 1842, target: 2000, prior: 1510 },\n    { label: "退款率", value: 4.6, target: 4, better: "lower", format: (v) => \`\${v}%\` },\n  ]}${!v.statusColor ? "\n  statusColor={false}" : ""}${v.size !== "md" ? `\n  size="${v.size}"` : ""}\n/>\n`,
  props: [
    { name: "items", type: "BulletItem[]", description: "每项 { label, sub?, value, target, prior?, ranges?, max?, better?, format? }。按 label 识别，增删有展开收起动画。" },
    { name: "items[].ranges", type: "number[]", default: "目标的 60% / 90%", description: "区间分界，由差到好；越低越好时默认目标的 140% / 110%。" },
    { name: "items[].better", type: '"higher" | "lower"', default: '"higher"', description: "lower 时差区间在右边，低于目标算达标。" },
    { name: "rangeLabels", type: "string[]", default: '["差", "中", "好"]', description: "区间名，用在读屏文本和悬停说明。" },
    { name: "statusColor", type: "boolean", default: "true", description: "达标的实际值条变绿。" },
    { name: "size", type: '"sm" | "md"', default: '"md"', description: "紧凑尺寸适合侧栏。" },
  ],
  stageHeight: 600,
};
