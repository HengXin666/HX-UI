import type { DocEntry } from "../types";
import { SPIN_VARIANTS } from "@/components/ui/spin";

export const spin: DocEntry = {
  slug: "spin",
  name: "Spin",
  title: "加载",
  section: "ui",
  group: "反馈",
  description: "等待时间不确定、又不到要用骨架屏时用。41 种形态（LDRS），同一界面只用一种；mode=\"rotate\" 只给长时间等待的整块区域。颜色跟随文字色。",
  file: "src/components/ui/spin.tsx",
  importFrom: "@/components/ui/spin",
  demo: () => import("./spin.demo"),
  source: () => import("@/components/ui/spin.tsx?raw").then((m) => m.default),
  defaults: { variant: "quantum", size: 40, mode: "fixed", speed: 1 },
  componentDefaults: { variant: "quantum", size: 24, mode: "fixed", speed: 1 },
  presets: [
    { label: "默认", values: { variant: "quantum", mode: "fixed" } },
    { label: "极简圆环", values: { variant: "ring2", mode: "fixed" } },
    { label: "长等待轮播", values: { mode: "rotate" } },
  ],
  controls: [
    { type: "select", key: "variant", label: "形态", options: SPIN_VARIANTS.map((v) => ({ value: v, label: v })) },
    { type: "number", key: "size", label: "尺寸", min: 16, max: 72, step: 4, unit: "px" },
    { type: "select", key: "mode", label: "模式", options: [{ value: "fixed", label: "固定" }, { value: "rotate", label: "轮播" }] },
    { type: "number", key: "speed", label: "速度", min: 0.5, max: 2, step: 0.1 },
  ],
  usage: (v) => `import { Spin } from "@/components/ui/spin";\n\n<Spin${v.variant !== "quantum" ? ` variant="${v.variant}"` : ""} size={${v.size}}${v.mode !== "fixed" ? ` mode="${v.mode}"` : ""}${Number(v.speed) !== 1 ? ` speed={${v.speed}}` : ""} label="正在生成报表" />\n`,
  props: [
    { name: "variant", type: "SpinVariant", default: '"quantum"', description: "41 种形态之一。" },
    { name: "size", type: '"sm" | "md" | "lg" | "xl" | number', default: '"md"', description: "16 / 24 / 40 / 64px 或任意像素。" },
    { name: "mode", type: '"fixed" | "rotate" | "random"', default: '"fixed"', description: "固定一种，或在候选里轮播。" },
    { name: "interval / rotatePool", type: "number / SpinVariant[]", description: "轮播间隔和候选形态。" },
    { name: "speed", type: "number", default: "1", description: "播放速度倍数。" },
    { name: "color", type: "string", default: "currentColor", description: "颜色，默认跟随文字。" },
    { name: "label", type: "string", description: "给读屏的说明；不给则视为装饰。" },
  ],
};
