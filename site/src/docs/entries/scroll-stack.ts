import type { DocEntry } from "../types";
import { diffProps } from "./_visual";

const D = { itemDistance: 100, itemStackDistance: 24, stackPosition: 15, itemScale: 0.05, baseScale: 0.8, dimAmount: 0.2, blurAmount: 0, tiltAmount: 0, rotationAmount: 0, holdDistance: 200, smoothScroll: true, snap: false };

export const scrollStack: DocEntry = {
  slug: "scroll-stack",
  name: "ScrollStack",
  title: "滚动叠卡",
  section: "visual",
  group: "滚动",
  description: "往下滚，卡片一张张钉住并叠在一起，被压住的卡片缩小、变暗，也可以虚化、后仰或像一叠纸那样左右错开。可以在自己的容器里滚，也可以跟随整页。",
  file: "src/scroll/scroll-stack.tsx",
  importFrom: "@/scroll/scroll-stack",
  demo: () => import("./scroll-stack.demo"),
  source: () => import("@/scroll/scroll-stack.tsx?raw").then((m) => m.default),
  bleed: true,
  stageHeight: 520,
  remountOnChange: false,
  defaults: { ...D, itemDistance: 40, itemStackDistance: 22, stackPosition: 12, dimAmount: 0.25, toast: true },
  componentDefaults: D,
  demoOnly: ["toast"],
  presets: [
    { label: "叠放", values: { itemDistance: 40, itemStackDistance: 22, stackPosition: 12, itemScale: 0.05, baseScale: 0.8, dimAmount: 0.25, blurAmount: 0, tiltAmount: 0, rotationAmount: 0 } },
    { label: "景深", values: { itemDistance: 60, itemStackDistance: 14, stackPosition: 10, itemScale: 0.06, baseScale: 0.75, dimAmount: 0.35, blurAmount: 2.5, tiltAmount: 0, rotationAmount: 0 } },
    { label: "后仰", values: { itemDistance: 60, itemStackDistance: 30, stackPosition: 14, itemScale: 0.03, baseScale: 0.85, dimAmount: 0.2, blurAmount: 0, tiltAmount: 14, rotationAmount: 0 } },
    { label: "散落纸堆", values: { itemDistance: 50, itemStackDistance: 6, stackPosition: 16, itemScale: 0.02, baseScale: 0.9, dimAmount: 0.15, blurAmount: 0, tiltAmount: 0, rotationAmount: 4 } },
    { label: "完全重合", values: { itemDistance: 40, itemStackDistance: 0, stackPosition: 12, itemScale: 0.04, baseScale: 0.8, dimAmount: 0.4, blurAmount: 0, tiltAmount: 0, rotationAmount: 0 } },
  ],
  controls: [
    { type: "number", key: "itemDistance", label: "卡片间距", min: 0, max: 300, step: 5, unit: "px" },
    { type: "number", key: "itemStackDistance", label: "叠放错位", min: 0, max: 60, step: 1, unit: "px" },
    { type: "number", key: "stackPosition", label: "钉住位置", min: 0, max: 50, step: 1, unit: "%" },
    { type: "number", key: "itemScale", label: "逐张缩小", min: 0, max: 0.2, step: 0.005 },
    { type: "number", key: "baseScale", label: "最小缩放", min: 0.4, max: 1, step: 0.01 },
    { type: "number", key: "dimAmount", label: "逐张变暗", min: 0, max: 0.6, step: 0.01 },
    { type: "number", key: "blurAmount", label: "逐张模糊", min: 0, max: 8, step: 0.25, unit: "px" },
    { type: "number", key: "tiltAmount", label: "后仰", min: 0, max: 30, step: 1, unit: "°" },
    { type: "number", key: "rotationAmount", label: "错开旋转", min: 0, max: 10, step: 0.5, unit: "°" },
    { type: "number", key: "holdDistance", label: "叠好后停留", min: 0, max: 600, step: 20, unit: "px" },
    { type: "toggle", key: "smoothScroll", label: "平滑滚轮" },
    { type: "toggle", key: "snap", label: "自动吸附" },
    { type: "toggle", key: "toast", label: "叠完提示" },
  ],
  usage: (v) => {
    const p = diffProps(v, D, ["toast", "stackPosition"]);
    if (v.stackPosition !== D.stackPosition) p.push(`stackPosition="${v.stackPosition}%"`);
    return `import { ScrollStack, ScrollStackItem } from "@hx/ui/scroll/scroll-stack";\n\n<div className="h-[600px]">\n  <ScrollStack${p.length ? `\n    ${p.join("\n    ")}\n  ` : ""}>\n    <ScrollStackItem itemClassName="h-72 bg-card border">第一张</ScrollStackItem>\n    <ScrollStackItem itemClassName="h-72 bg-card border">第二张</ScrollStackItem>\n    <ScrollStackItem itemClassName="h-72 bg-card border">第三张</ScrollStackItem>\n  </ScrollStack>\n</div>`;
  },
  props: [
    { name: "children", type: "ReactNode", description: "要叠的卡片，一般是 ScrollStackItem。" },
    { name: "itemDistance", type: "number", default: "100", description: "叠起来之前卡片之间的距离，px；越大每张之间滚得越久。" },
    { name: "itemStackDistance", type: "number", default: "24", description: "叠好后每张比上一张低多少，px；0 完全重合。" },
    { name: "stackPosition", type: "number | string", default: '"15%"', description: "离视口或容器顶部多远开始钉住；数字是 px，也可写百分比。" },
    { name: "itemScale", type: "number", default: "0.05", description: "上面每压一张，下面这张缩小多少。" },
    { name: "baseScale", type: "number", default: "0.8", description: "被压住的卡片最小缩到多少。" },
    { name: "dimAmount", type: "number", default: "0.2", description: "上面每压一张，下面这张暗多少，0–1。" },
    { name: "blurAmount", type: "number", default: "0", description: "上面每压一张，下面这张模糊多少，px。" },
    { name: "tiltAmount", type: "number", default: "0", description: "被压住的卡片往后仰多少度。" },
    { name: "rotationAmount", type: "number", default: "0", description: "被压住的卡片左右交替转多少度，像一叠随手放的纸。" },
    { name: "holdDistance", type: "number", default: "200", description: "全部叠好后再钉住多久才一起滚走，px。" },
    { name: "smoothScroll", type: "boolean", default: "true", description: "鼠标滚轮平滑滚动；触屏、键盘、滚动条保持原生。容器滚到头时滚轮还给页面。" },
    { name: "snap", type: "boolean", default: "false", description: "停在两张之间时，自动滑到最近的一张。" },
    { name: "useWindowScroll", type: "boolean", default: "false", description: "跟随整页滚动；父级不要 overflow: hidden。" },
    { name: "onStackComplete", type: "() => void", description: "最后一张落到位时调用。" },
    { name: "aria-label", type: "string", default: "\"滚动卡片\"", description: "容器自己滚动时的无障碍名称；容器可用 Tab 聚焦后方向键滚动。" },
    { name: "className", type: "string", description: "滚动容器的 class。" },
    { name: "innerClassName", type: "string", description: "卡片列的 class，控制宽度和留白。" },
    { name: "ScrollStackItem.itemClassName", type: "string", description: "卡片自己的尺寸、颜色和内容；也接受 div 的所有属性。" },
  ],
};
