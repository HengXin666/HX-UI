import type { DocEntry } from "../types";

// 源码按需加载: 每个文件单独成块, 点开代码页才下载
const RAW = import.meta.glob<string>("/src/effects/*.tsx", { query: "?raw", import: "default" });
const src = (p: string) => () => RAW[`/src/effects/${p}.tsx`]();

export const tiltCard: DocEntry = {
  slug: "tilt-card",
  name: "TiltCard",
  title: "3D 倾斜",
  section: "visual",
  group: "卡片",
  description: "卡片跟着指针在三维里倾斜，可选一层跟随指针的反光。适合商品图、卡券、产品截图。",
  file: "src/effects/tilt-card.tsx",
  importFrom: "@/effects/tilt-card",
  demo: () => import("./tilt-card.demo"),
  source: src("tilt-card"),
  defaults: { max: 12, scale: 1.04, glare: true },
  componentDefaults: { max: 8, scale: 1, glare: false },
  usageChildren: '<img src="/card.png" alt="会员卡" />',
  presets: [
    { label: "卡券", values: { max: 12, scale: 1.04, glare: true } },
    { label: "克制", values: { max: 5, scale: 1, glare: false } },
    { label: "夸张", values: { max: 22, scale: 1.08, glare: true } },
  ],
  controls: [
    { type: "number", key: "max", label: "最大倾角", min: 2, max: 30, step: 1, unit: "°" },
    { type: "number", key: "scale", label: "悬停放大", min: 1, max: 1.15, step: 0.01 },
    { type: "toggle", key: "glare", label: "反光" },
  ],
  props: [
    { name: "children", type: "ReactNode", description: "卡片内容。" },
    { name: "max", type: "number", default: "8", description: "最大倾角，度。" },
    { name: "scale", type: "number", default: "1", description: "悬停时放大到多少。" },
    { name: "glare", type: "boolean", default: "false", description: "跟随指针的高光层。" },
    { name: "className", type: "string", description: "加在倾斜层上；圆角会传给反光层。" },
  ],
};

export const marquee: DocEntry = {
  slug: "marquee",
  name: "Marquee",
  title: "跑马灯",
  section: "ui",
  group: "展示",
  description: "内容复制两份无缝滚动，纯 CSS 动画。横竖都行，悬停暂停，两端淡出。",
  file: "src/effects/marquee.tsx",
  importFrom: "@/effects/marquee",
  demo: () => import("./marquee.demo"),
  source: src("marquee"),
  defaults: { content: "logos", duration: 30, gap: 40, reverse: false, vertical: false, pauseOnHover: true, fade: true },
  componentDefaults: { duration: 40, gap: 40, reverse: false, vertical: false, pauseOnHover: true, fade: true },
  demoOnly: ["content"],
  usageChildren: "{brands.map((b) => <Logo key={b.id} {...b} />)}",
  presets: [
    { label: "品牌墙", values: { content: "logos", vertical: false, duration: 30, gap: 40 } },
    { label: "用户评价", values: { content: "quotes", vertical: false, duration: 45, gap: 16 } },
    { label: "竖向评价", values: { content: "quotes", vertical: true, duration: 25, gap: 12 } },
  ],
  controls: [
    { type: "select", key: "content", label: "内容", options: [{ value: "logos", label: "品牌墙" }, { value: "quotes", label: "用户评价" }] },
    { type: "number", key: "duration", label: "一轮", min: 5, max: 90, step: 1, unit: "s" },
    { type: "number", key: "gap", label: "间距", min: 0, max: 120, step: 4, unit: "px" },
    { type: "toggle", key: "reverse", label: "反向" },
    { type: "toggle", key: "vertical", label: "竖向" },
    { type: "toggle", key: "pauseOnHover", label: "悬停暂停" },
    { type: "toggle", key: "fade", label: "两端淡出" },
  ],
  props: [
    { name: "children", type: "ReactNode", description: "一轮的内容，会自动复制一份接上。" },
    { name: "duration", type: "number", default: "40", description: "滚完一轮的秒数，越大越慢。" },
    { name: "gap", type: "number", default: "40", description: "两项之间的间距，像素。" },
    { name: "reverse", type: "boolean", default: "false", description: "反向滚动。" },
    { name: "vertical", type: "boolean", default: "false", description: "竖向滚动；需要给容器定高。" },
    { name: "pauseOnHover", type: "boolean", default: "true", description: "悬停时暂停。" },
    { name: "fade", type: "boolean", default: "true", description: "两端渐隐。" },
  ],
};
