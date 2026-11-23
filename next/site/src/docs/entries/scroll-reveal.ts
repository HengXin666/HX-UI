import type { DocEntry } from "../types";
import { diffProps } from "./_visual";

const D = { mode: "scrub", splitBy: "words", effect: "fade", highlight: "", stagger: 0.05, duration: 0.8, smoothing: 0, baseOpacity: 0.1, baseRotation: 3, baseOffset: 0, blurStrength: 4, enableBlur: true };

export const scrollReveal: DocEntry = {
  slug: "scroll-reveal",
  name: "ScrollReveal",
  title: "滚动揭字",
  section: "visual",
  group: "滚动",
  description: "大段文字跟着滚动一段一段亮起来，整块从微微倾斜回正，像发布会的报幕。可绑定滚动位置，也可滚进视口播一次；按词、按字或按渲染出来的行揭示，中文按字自动断开。",
  file: "src/scroll/scroll-reveal.tsx",
  importFrom: "@/scroll/scroll-reveal",
  demo: () => import("./scroll-reveal.demo"),
  source: () => import("@/scroll/scroll-reveal.tsx?raw").then((m) => m.default),
  bleed: true,
  stageHeight: 520,
  remountOnChange: true,
  defaults: { ...D, text: "When does a man die? When he is hit by a bullet? No! When he suffers a disease? No! When he ate a soup made out of a poisonous mushroom? No! A man dies when he is forgotten!" },
  componentDefaults: D,
  demoOnly: ["text"],
  presets: [
    { label: "揭示", values: { ...D } },
    { label: "高亮扫过", values: { ...D, highlight: "var(--brand)", baseOpacity: 0.15, enableBlur: false, baseRotation: 0 } },
    { label: "逐行升起", values: { ...D, splitBy: "lines", effect: "rise", baseOpacity: 1, enableBlur: false, baseRotation: 0, stagger: 0.12 } },
    { label: "翻立", values: { ...D, effect: "flip", stagger: 0.1, baseOpacity: 0, baseRotation: 0, smoothing: 0.3 } },
    { label: "进场一次", values: { ...D, mode: "enter", effect: "rise", splitBy: "words", stagger: 0.03, duration: 0.7, baseOpacity: 0, baseRotation: 2 } },
  ],
  controls: [
    { type: "text", key: "text", label: "文字" },
    { type: "select", key: "mode", label: "模式", options: [{ value: "scrub", label: "跟随滚动" }, { value: "enter", label: "进场一次" }] },
    { type: "select", key: "splitBy", label: "拆分", options: [{ value: "words", label: "按词" }, { value: "chars", label: "按字" }, { value: "lines", label: "按行" }] },
    { type: "select", key: "effect", label: "效果", options: [{ value: "fade", label: "变亮" }, { value: "rise", label: "升起" }, { value: "flip", label: "翻立" }, { value: "scale", label: "放大" }] },
    { type: "select", key: "highlight", label: "高亮色", options: [{ value: "", label: "无" }, { value: "var(--brand)", label: "品牌" }, { value: "var(--chart-2)", label: "青" }, { value: "var(--chart-3)", label: "琥珀" }] },
    { type: "number", key: "stagger", label: "错开", min: 0.005, max: 0.3, step: 0.005 },
    { type: "number", key: "duration", label: "时长", min: 0.1, max: 2, step: 0.05, unit: "s" },
    { type: "number", key: "smoothing", label: "跟随延迟", min: 0, max: 1.5, step: 0.05, unit: "s" },
    { type: "number", key: "baseOpacity", label: "初始透明度", min: 0, max: 1, step: 0.01 },
    { type: "number", key: "baseRotation", label: "初始倾斜", min: 0, max: 10, step: 0.5, unit: "°" },
    { type: "number", key: "baseOffset", label: "初始下沉", min: 0, max: 60, step: 1, unit: "px" },
    { type: "number", key: "blurStrength", label: "模糊", min: 0, max: 16, step: 0.5, unit: "px" },
    { type: "toggle", key: "enableBlur", label: "失焦到清晰" },
  ],
  usage: (v) => {
    const p = diffProps(v, D, ["text", "highlight"]);
    if (v.highlight) p.unshift(`highlightColor="${v.highlight}"`);
    return `import { ScrollReveal } from "@hx/ui/scroll/scroll-reveal";\n\n<ScrollReveal${p.length ? `\n  ${p.join("\n  ")}` : ""}\n  containerClassName="text-5xl font-semibold leading-[1.1] tracking-tight"\n>\n  ${v.text}\n</ScrollReveal>`;
  },
  props: [
    { name: "children", type: "ReactNode", description: "要揭示的文字；纯文字会拆开，其它内容整块揭示。" },
    { name: "scrollContainerRef", type: "RefObject<HTMLElement>", default: "整页", description: "在哪个元素里滚动。" },
    { name: "mode", type: '"scrub" | "enter"', default: '"scrub"', description: "跟随滚动位置，或滚进视口播一次。" },
    { name: "splitBy", type: '"words" | "chars" | "lines"', default: '"words"', description: "每一步揭示多大一块；按行时按渲染出来的行分组，尺寸变化时重新分。中文按词时按字断开，标点跟着前一个字。" },
    { name: "effect", type: '"fade" | "rise" | "flip" | "scale"', default: '"fade"', description: "原地变亮、从基线下升起、从平躺立起、从小放大。" },
    { name: "highlightColor", type: "string", default: '""', description: "每段揭示途中先亮成这个颜色，再落回文字色。" },
    { name: "stagger", type: "number", default: "0.05", description: "相邻段的错开程度；越大越是一段一段出，越小越像一道柔和的波。进场模式下是秒。" },
    { name: "duration", type: "number", default: "0.8", description: "进场模式每段的时长，秒。" },
    { name: "smoothing", type: "number", default: "0", description: "揭示追上滚动位置要多少秒；0 直接绑定。" },
    { name: "enableBlur", type: "boolean", default: "true", description: "一开始失焦，揭示时变清晰。" },
    { name: "blurStrength", type: "number", default: "4", description: "初始模糊，px。" },
    { name: "baseOpacity", type: "number", default: "0.1", description: "揭示前的透明度。" },
    { name: "baseRotation", type: "number", default: "3", description: "整块揭示前的倾斜，度。" },
    { name: "baseOffset", type: "number", default: "0", description: "每段从下方多少 px 升上来。" },
    { name: "start", type: "number", default: "1", description: "元素顶部到视口哪里开始揭示，0 顶 1 底。" },
    { name: "end", type: "number", default: "1", description: "元素底部到视口哪里揭示完，0 顶 1 底。" },
    { name: "as", type: '"h1" | "h2" | "h3" | "p" | "div"', default: '"h2"', description: "渲染成哪个标签。" },
    { name: "containerClassName / textClassName / pieceClassName", type: "string", description: "外层、文字层、每一段的 class。" },
    { name: "onProgress", type: "(p: number) => void", description: "揭示进度变化时调用，0–1。" },
  ],
};
