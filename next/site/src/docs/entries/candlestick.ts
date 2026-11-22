import type { DocEntry } from "../types";

export const candlestick: DocEntry = {
  slug: "candlestick",
  name: "Candlestick",
  title: "K",
  section: "ui",
  group: "图表",
  description: "线图",
  file: "src/data/charts/candlestick.tsx",
  importFrom: "@/data",
  demo: () => import("./candlestick.demo"),
  source: () => import("@/data/charts/candlestick.tsx?raw").then((m) => m.default),
  defaults: { scheme: "cn", ma: "5,10", showVolume: true },
  componentDefaults: { scheme: "cn", showVolume: true },
  presets: [
    { label: "A 股", values: { scheme: "cn", ma: "5,10", showVolume: true } },
    { label: "美股", values: { scheme: "us", ma: "5,20" } },
    { label: "纯 K 线", values: { ma: "none", showVolume: false } },
  ],
  controls: [
    { type: "select", key: "scheme", label: "配色", options: [{ value: "cn", label: "红涨绿跌" }, { value: "us", label: "绿涨红跌" }] },
    { type: "select", key: "ma", label: "均线", options: [{ value: "none", label: "无" }, { value: "5", label: "MA5" }, { value: "5,10", label: "MA5 · MA10" }, { value: "5,20", label: "MA5 · MA20" }] },
    { type: "toggle", key: "showVolume", label: "成交量" },
  ],
  usage: (v) => `import { Candlestick } from "@/data";\n\n<Candlestick\n  data={candles} // { t, open, high, low, close, volume? }[]${v.scheme === "us" ? `\n  scheme="us"` : ""}\n  ma={[${v.ma === "none" ? "" : v.ma}]}${v.showVolume ? "" : "\n  showVolume={false}"}\n/>\n`,
  props: [
    { name: "data", type: "{ t, open, high, low, close, volume? }[]", description: "每根 K 线。" },
    { name: "scheme", type: '"cn" | "us"', default: '"cn"', description: "cn 红涨绿跌，us 绿涨红跌。" },
    { name: "ma", type: "number[]", default: "[5]", description: "均线周期。" },
    { name: "showVolume / format / height", type: "boolean / (v) => string / number", default: "true / 两位小数 / 320", description: "成交量柱、价格格式、高度。" },
  ],
};
