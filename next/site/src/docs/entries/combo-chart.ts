import type { DocEntry } from "../types";

export const comboChart: DocEntry = {
  slug: "combo-chart",
  name: "ComboChart",
  title: "组合图",
  section: "ui",
  group: "图表",
  sub: "2D 图表",
  description: "柱和线画在一张图里，量用柱、率用线，左右双轴各管各的刻度。经营看板最常见的一张：订单量配转化率、营收配增长率。",
  file: "src/data/charts/combo-chart.tsx",
  importFrom: "@/data",
  demo: () => import("./combo-chart.demo"),
  source: () => import("@/data/charts/combo-chart.tsx?raw").then((m) => m.default),
  defaults: { stacked: false, dualAxis: true, twoBars: true },
  componentDefaults: {},
  presets: [
    { label: "订单与转化", values: { stacked: false, dualAxis: true, twoBars: true } },
    { label: "堆叠", values: { stacked: true, twoBars: true } },
    { label: "单柱单线", values: { twoBars: false } },
  ],
  controls: [
    { type: "toggle", key: "twoBars", label: "两组柱" },
    { type: "toggle", key: "stacked", label: "柱堆叠" },
    { type: "toggle", key: "dualAxis", label: "线用右轴" },
  ],
  usage: (v) => `import { ComboChart } from "@/data";\n\n<ComboChart\n  data={rows}\n  x="day"\n  bars={[${v.twoBars ? `{ key: "new", label: "新客订单" }, { key: "old", label: "老客订单" }` : `{ key: "new", label: "订单" }`}]}\n  lines={[{ key: "cvr", label: "转化率" }]}${v.stacked ? "\n  stacked" : ""}${v.dualAxis ? "" : "\n  dualAxis={false}"}\n  lineFormatter={(v) => \`\${v}%\`}\n/>\n`,
  props: [
    { name: "data / x", type: "object[] / string", description: "行数据和横轴字段。" },
    { name: "bars / lines", type: "{ key, label, color? }[]", description: "柱系列用左轴，线系列默认用右轴。" },
    { name: "stacked", type: "boolean", default: "false", description: "柱堆叠。" },
    { name: "dualAxis", type: "boolean", default: "true", description: "线是否单独用右轴；关掉后和柱共用左轴。" },
    { name: "barFormatter / lineFormatter", type: "(v) => string", default: "缩写", description: "左右轴刻度格式。" },
    { name: "height / animation", type: "number / ChartAnimationOptions", default: "280", description: "高度和增量动画。" },
  ],
};
