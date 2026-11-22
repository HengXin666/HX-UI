import type { DocEntry } from "../types";

export const depthChart: DocEntry = {
  slug: "depth-chart",
  name: "DepthChart",
  title: "深度图",
  section: "ui",
  group: "图表",
  sub: "行情图表",
  description: "买卖盘的累计挂单量，中间是盘口价差，顶上读出买一、卖一、价差和委比。每一档是一级台阶，按价格配对：新挂的档位从地面升起，撤掉的落回地面，挂单量变化时台阶平滑升降，后面的台阶跟着调整累计高度。悬停读出该价位的累计量。",
  file: "src/data/charts/depth-chart.tsx",
  importFrom: "@/data",
  demo: () => import("./depth-chart.demo"),
  source: () => import("@/data/charts/depth-chart.tsx?raw").then((m) => m.default),
  stageHeight: 560,
  defaults: { levels: "20", scheme: "cn" },
  componentDefaults: { scheme: "cn" },
  demoOnly: ["levels"],
  presets: [
    { label: "20 档", values: { levels: "20", scheme: "cn" } },
    { label: "10 档", values: { levels: "10", scheme: "cn" } },
    { label: "买绿卖红", values: { scheme: "us" } },
  ],
  controls: [
    { type: "select", key: "levels", label: "档数", options: [{ value: "10", label: "10 档" }, { value: "20", label: "20 档" }, { value: "40", label: "40 档" }] },
    { type: "select", key: "scheme", label: "配色", options: [{ value: "cn", label: "买红卖绿" }, { value: "us", label: "买绿卖红" }] },
  ],
  usage: (v) => `import { DepthChart } from "@/data";\n\n<DepthChart\n  bids={[{ price: 24.99, size: 1200 }, ...]}\n  asks={[{ price: 25.01, size: 900 }, ...]}${v.scheme === "us" ? `\n  scheme="us"` : ""}\n/>\n`,
  props: [
    { name: "bids / asks", type: "{ price, size }[]", description: "买盘和卖盘，顺序随意；按价格配对做动画，同价位视为同一档。" },
    { name: "scheme", type: '"cn" | "us"', default: '"cn"', description: "cn 买红卖绿，us 买绿卖红。" },
    { name: "precision / formatSize", type: "number / (v) => string", default: "2 / 紧凑数字", description: "价格小数位和挂单量格式。" },
    { name: "height / ariaLabel", type: "number / string", default: '320 / "深度图"', description: "高度和读屏名称；读屏另有每档明细表。" },
  ],
};
