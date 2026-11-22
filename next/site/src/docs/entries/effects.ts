import type { DocEntry } from "../types";
import { COLOR_OPTIONS, SOFT_COLOR_OPTIONS } from "./_shared";

// 源码按需加载: 每个文件单独成块, 点开代码页才下载
const RAW = import.meta.glob<string>("/src/effects/*.tsx", { query: "?raw", import: "default" });
const src = (p: string) => () => RAW[`/src/effects/${p}.tsx`]();

export const spotlightCard: DocEntry = {
  slug: "spotlight-card",
  name: "SpotlightCard",
  title: "光斑卡片",
  category: "motion",
  description: "指针在卡片上移动时，一圈柔光跟着走。只写两个 CSS 变量，不触发 React 重渲染。",
  file: "src/effects/spotlight-card.tsx",
  importFrom: "@/effects/spotlight-card",
  demo: () => import("./spotlight-card.demo"),
  source: src("spotlight-card"),
  defaults: { color: SOFT_COLOR_OPTIONS[0].value, size: 420 },
  componentDefaults: { size: 420 },
  usageChildren: "<h3>按需加载</h3>\n<p>动画特性包空闲时再加载。</p>",
  presets: [
    { label: "品牌", values: { color: SOFT_COLOR_OPTIONS[0].value, size: 420 } },
    { label: "白光小斑", values: { color: SOFT_COLOR_OPTIONS[4].value, size: 220 } },
    { label: "青色大斑", values: { color: SOFT_COLOR_OPTIONS[1].value, size: 640 } },
  ],
  controls: [
    { type: "select", key: "color", label: "颜色", options: SOFT_COLOR_OPTIONS },
    { type: "number", key: "size", label: "直径", min: 120, max: 900, step: 10, unit: "px" },
  ],
  props: [
    { name: "color", type: "string", default: "var(--brand-soft)", description: "光斑颜色，任意 CSS 颜色；建议带透明度。" },
    { name: "size", type: "number", default: "420", description: "光斑直径，像素。" },
    { name: "className", type: "string", description: "卡片自带圆角、描边和卡片底色，可覆盖。" },
    { name: "...rest", type: "HTMLAttributes<HTMLDivElement>", description: "其余属性透传给外层 div。" },
  ],
};

export const borderBeam: DocEntry = {
  slug: "border-beam",
  name: "BorderBeam",
  title: "流光边框",
  category: "motion",
  description: "一道光沿着父元素的边框绕圈。用 conic-gradient 加遮罩，只露出边框宽度，适合标出推荐项。",
  file: "src/effects/border-beam.tsx",
  importFrom: "@/effects/border-beam",
  demo: () => import("./border-beam.demo"),
  source: src("border-beam"),
  defaults: { duration: 6, color: "var(--brand)", width: 1 },
  componentDefaults: { duration: 6, width: 1, color: "var(--brand)" },
  usage: (v) => {
    const a = [v.duration !== 6 && `duration={${v.duration}}`, v.color !== "var(--brand)" && `color="${v.color}"`, v.width !== 1 && `width={${v.width}}`].filter(Boolean);
    return `import { BorderBeam } from "@/effects/border-beam";\n\nexport function ProPlan() {\n  return (\n    <div className="relative rounded-2xl border p-6">\n      <BorderBeam${a.length ? " " + a.join(" ") : ""} />\n      专业版\n    </div>\n  );\n}\n`;
  },
  presets: [
    { label: "默认", values: { duration: 6, color: "var(--brand)", width: 1 } },
    { label: "快速粗线", values: { duration: 2.5, width: 2 } },
    { label: "琥珀", values: { color: "var(--chart-3)", duration: 8 } },
  ],
  controls: [
    { type: "number", key: "duration", label: "一圈", min: 1, max: 15, step: 0.5, unit: "s" },
    { type: "select", key: "color", label: "颜色", options: COLOR_OPTIONS },
    { type: "number", key: "width", label: "线宽", min: 1, max: 4, step: 1, unit: "px" },
  ],
  props: [
    { name: "duration", type: "number", default: "6", description: "绕一圈的秒数。" },
    { name: "color", type: "string", default: "var(--brand)", description: "光的颜色。" },
    { name: "width", type: "number", default: "1", description: "光线宽度，像素；和父元素边框一致最自然。" },
  ],
};

export const magnetic: DocEntry = {
  slug: "magnetic",
  name: "Magnetic",
  title: "磁吸",
  category: "motion",
  description: "指针靠近时，子元素被轻轻吸过去，离开后弹簧回位。适合页面上唯一的主按钮。",
  file: "src/effects/magnetic.tsx",
  importFrom: "@/effects/magnetic",
  demo: () => import("./magnetic.demo"),
  source: src("magnetic"),
  defaults: { strength: 0.25 },
  componentDefaults: { strength: 0.25 },
  usageChildren: "<Button>开始使用</Button>",
  presets: [
    { label: "轻", values: { strength: 0.15 } },
    { label: "中", values: { strength: 0.25 } },
    { label: "强", values: { strength: 0.5 } },
  ],
  controls: [{ type: "number", key: "strength", label: "吸力", min: 0.05, max: 0.8, step: 0.05 }],
  props: [
    { name: "children", type: "ReactNode", description: "被吸附的元素。" },
    { name: "strength", type: "number", default: "0.25", description: "最大位移占指针偏移的比例。" },
  ],
};

export const tiltCard: DocEntry = {
  slug: "tilt-card",
  name: "TiltCard",
  title: "3D 倾斜",
  category: "motion",
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
  category: "motion",
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

export const backdrop: DocEntry = {
  slug: "backdrop",
  name: "Backdrop",
  title: "区块底纹",
  category: "background",
  description: "铺在区块底下的氛围层：网格、点阵、极光、顶部辉光。只占 absolute 层，不吃交互。",
  file: "src/effects/backdrop.tsx",
  importFrom: "@/effects/backdrop",
  demo: () => import("./backdrop.demo"),
  source: src("backdrop"),
  stageHeight: 460,
  defaults: { variant: "aurora", size: 48 },
  componentDefaults: { variant: "grid" },
  usage: (v) => `import { Backdrop } from "@/effects/backdrop";\n\nexport function Hero() {\n  return (\n    <section className="relative overflow-hidden">\n      <Backdrop variant="${v.variant}"${v.variant === "grid" || v.variant === "dots" ? ` size={${v.size}}` : ""} />\n      <h1 className="relative">一屏一个主角</h1>\n    </section>\n  );\n}\n`,
  presets: [
    { label: "极光", values: { variant: "aurora" } },
    { label: "辉光", values: { variant: "glow" } },
    { label: "网格", values: { variant: "grid", size: 48 } },
    { label: "点阵", values: { variant: "dots", size: 22 } },
  ],
  controls: [
    { type: "select", key: "variant", label: "样式", options: [{ value: "aurora", label: "极光" }, { value: "glow", label: "辉光" }, { value: "grid", label: "网格" }, { value: "dots", label: "点阵" }] },
    { type: "number", key: "size", label: "格距", min: 12, max: 96, step: 2, unit: "px" },
  ],
  props: [
    { name: "variant", type: '"grid" | "dots" | "aurora" | "glow"', default: '"grid"', description: "底纹样式；网格和点阵自带边缘淡出。" },
    { name: "size", type: "number", description: "网格 / 点阵的间距，像素；默认 48 / 22。" },
    { name: "className", type: "string", description: "加在底纹层上。" },
  ],
};

export const shimmerButton: DocEntry = {
  slug: "shimmer-button",
  name: "ShimmerButton",
  title: "流光按钮",
  category: "interaction",
  description: "品牌色底，一道光斜着扫过，按下微缩。一页最多一两个，留给最重要的动作。",
  file: "src/effects/shimmer-button.tsx",
  importFrom: "@/effects/shimmer-button",
  demo: () => import("./shimmer-button.demo"),
  source: src("shimmer-button"),
  defaults: { label: "立即开始", icon: true, size: "md" },
  componentDefaults: {},
  usage: (v) => `import { ShimmerButton } from "@/effects/shimmer-button";\n\nexport function Cta() {\n  return (\n    <ShimmerButton${v.size === "lg" ? ' className="h-14 px-8 text-base"' : ""}>\n      ${v.label}${v.icon ? " <ArrowRight />" : ""}\n    </ShimmerButton>\n  );\n}\n`,
  controls: [
    { type: "text", key: "label", label: "文案" },
    { type: "select", key: "size", label: "尺寸", options: [{ value: "md", label: "中" }, { value: "lg", label: "大" }] },
    { type: "toggle", key: "icon", label: "箭头" },
  ],
  props: [
    { name: "children", type: "ReactNode", description: "按钮内容。" },
    { name: "asChild", type: "boolean", default: "false", description: "把样式给到子元素（如链接）。" },
    { name: "...rest", type: "ButtonHTMLAttributes", description: "其余属性透传给 button；type 默认 button。" },
  ],
};

export const liveDot: DocEntry = {
  slug: "live-dot",
  name: "LiveDot",
  title: "状态点",
  category: "foundation",
  description: "一个小圆点表示状态，实时状态外圈会脉冲。配一行文字用，颜色不单独表达含义。",
  file: "src/effects/live-dot.tsx",
  importFrom: "@/effects/live-dot",
  demo: () => import("./live-dot.demo"),
  source: src("live-dot"),
  defaults: { live: true },
  componentDefaults: { live: true },
  usage: (v) => `import { LiveDot } from "@/effects/live-dot";\n\nexport function Status() {\n  return (\n    <span className="flex items-center gap-2">\n      <LiveDot tone="success"${v.live ? "" : " live={false}"} /> 运行中\n    </span>\n  );\n}\n`,
  controls: [{ type: "toggle", key: "live", label: "脉冲" }],
  props: [
    { name: "tone", type: '"success" | "warning" | "destructive" | "info" | "muted"', default: '"success"', description: "颜色，读主题令牌。" },
    { name: "live", type: "boolean", default: "true", description: "外圈脉冲。" },
    { name: "className", type: "string", description: "加在外层 span 上。" },
  ],
};
