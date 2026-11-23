import type { DocEntry } from "../types";
import { diffProps } from "./_visual";

export const SPARK_COLORS: Record<string, { label: string; value: string | string[] }> = {
  white: { label: "前景色", value: "var(--foreground)" },
  brand: { label: "品牌", value: "var(--brand)" },
  party: { label: "彩色", value: ["#f43f5e", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"] },
  gold: { label: "金", value: ["#fde68a", "#f59e0b"] },
};
const D = { color: "white", shape: "line", easing: "ease-out", layer: "front", sparkCount: 8, sparkSize: 14, sparkWidth: 2, sparkRadius: 30, duration: 500, randomness: 0.2, gravity: 0, spread: 360, direction: 0, glow: 0, ring: false };

export const clickSpark: DocEntry = {
  slug: "click-spark",
  name: "ClickSpark",
  title: "点击火花",
  section: "visual",
  group: "交互",
  description: "包住任何内容，点一下就从点击处迸出一簇火花。可以画在内容后面，让火花从按钮边缘迸出；也能用 ref 从代码触发，比如点赞成功时。键盘触发按钮时从按钮中心迸出。",
  file: "src/effects/click-spark.tsx",
  importFrom: "@/effects/click-spark",
  demo: () => import("./click-spark.demo"),
  source: () => import("@/effects/click-spark.tsx?raw").then((m) => m.default),
  bleed: true,
  remountOnChange: false,
  defaults: { ...D, demo: "buttons" },
  componentDefaults: D,
  demoOnly: ["demo"],
  presets: [
    { label: "经典", values: { ...D } },
    { label: "彗星", values: { ...D, shape: "streak", color: "brand", sparkCount: 10, sparkRadius: 46, sparkSize: 10, duration: 650, glow: 0.6, ring: true } },
    { label: "彩纸", values: { ...D, shape: "dot", color: "party", sparkCount: 14, sparkRadius: 52, gravity: 1.2, randomness: 0.7, duration: 800 } },
    { label: "星星", values: { ...D, shape: "star", color: "gold", sparkCount: 6, sparkSize: 18, sparkRadius: 40, easing: "spring", glow: 0.8 } },
    { label: "向上喷泉", values: { ...D, shape: "line", color: "brand", spread: 70, direction: 0, sparkCount: 9, sparkRadius: 56, gravity: 1.6, randomness: 0.5, layer: "back" } },
  ],
  controls: [
    { type: "select", key: "demo", label: "演示", options: [{ value: "buttons", label: "按钮" }, { value: "area", label: "整块区域" }] },
    { type: "select", key: "color", label: "颜色", options: Object.entries(SPARK_COLORS).map(([value, c]) => ({ value, label: c.label })) },
    { type: "select", key: "shape", label: "形状", options: [{ value: "line", label: "短线" }, { value: "streak", label: "彗星" }, { value: "dot", label: "圆点" }, { value: "star", label: "星星" }] },
    { type: "select", key: "easing", label: "缓动", options: [{ value: "ease-out", label: "减速" }, { value: "ease-in-out", label: "缓入缓出" }, { value: "ease-in", label: "加速" }, { value: "linear", label: "匀速" }, { value: "spring", label: "弹簧" }] },
    { type: "select", key: "layer", label: "层级", options: [{ value: "front", label: "内容上方" }, { value: "back", label: "内容后面" }] },
    { type: "number", key: "sparkCount", label: "数量", min: 1, max: 32, step: 1 },
    { type: "number", key: "sparkSize", label: "长度", min: 2, max: 40, step: 1, unit: "px" },
    { type: "number", key: "sparkWidth", label: "粗细", min: 0.5, max: 6, step: 0.5, unit: "px" },
    { type: "number", key: "sparkRadius", label: "距离", min: 8, max: 120, step: 1, unit: "px" },
    { type: "number", key: "duration", label: "时长", min: 150, max: 1500, step: 10, unit: "ms" },
    { type: "number", key: "randomness", label: "随机", min: 0, max: 1, step: 0.05 },
    { type: "number", key: "gravity", label: "重力", min: 0, max: 2, step: 0.05 },
    { type: "number", key: "spread", label: "张角", min: 10, max: 360, step: 5, unit: "°" },
    { type: "number", key: "direction", label: "朝向", min: -180, max: 180, step: 5, unit: "°" },
    { type: "number", key: "glow", label: "光晕", min: 0, max: 1, step: 0.05 },
    { type: "toggle", key: "ring", label: "扩散环" },
  ],
  usage: (v) => {
    const p = diffProps(v, D, ["color", "demo"]);
    const c = SPARK_COLORS[String(v.color)].value;
    p.unshift(Array.isArray(c) ? `sparkColor={[${c.map((x) => `"${x}"`).join(", ")}]}` : `sparkColor="${c}"`);
    return `import { ClickSpark } from "@hx/ui/effects/click-spark";\n\n<ClickSpark${p.length ? `\n  ${p.join("\n  ")}\n` : ""}>\n  <Button>点赞</Button>\n</ClickSpark>`;
  },
  props: [
    { name: "sparkColor", type: "string | string[]", default: '"#fff"', description: "火花颜色；传数组时每簇轮着用。支持 var(--token)。" },
    { name: "shape", type: '"line" | "streak" | "dot" | "star"', default: '"line"', description: "短划线、带拖尾的彗星、圆点、闪烁的星。" },
    { name: "sparkCount", type: "number", default: "8", description: "每簇几根。" },
    { name: "sparkSize", type: "number", default: "14", description: "每根长度，px。" },
    { name: "sparkWidth", type: "number", default: "2", description: "每根粗细，px。" },
    { name: "sparkRadius", type: "number", default: "30", description: "飞多远，px。" },
    { name: "duration", type: "number", default: "500", description: "一簇的时长，毫秒。" },
    { name: "easing", type: '"ease-out" | "ease-in-out" | "ease-in" | "linear" | "spring"', default: '"ease-out"', description: "怎么减速；spring 冲过头再回来。" },
    { name: "randomness", type: "number", default: "0.2", description: "角度、长度、距离的随机程度；0 是完美星形。" },
    { name: "gravity", type: "number", default: "0", description: "往下坠的力，0–2。" },
    { name: "spread", type: "number", default: "360", description: "扇形张角，度；360 一整圈。" },
    { name: "direction", type: "number", default: "0", description: "扇形朝向，度；0 朝上，90 朝右。" },
    { name: "glow", type: "number", default: "0", description: "火花周围的柔光，0–1。" },
    { name: "ring", type: "boolean", default: "false", description: "再加一圈从点击处扩散的细环。" },
    { name: "layer", type: '"front" | "back"', default: '"front"', description: "画在内容上方，或内容后面让火花从边缘迸出。" },
    { name: "extraScale", type: "number", default: "1", description: "飞行距离倍数。" },
    { name: "disabled", type: "boolean", default: "false", description: "停止响应点击。" },
    { name: "ref", type: "{ spark(x?, y?) }", description: "从代码放一簇；x、y 是相对左上角的 px，不给就在中心。" },
    { name: "className / canvasClassName / style", type: "string / string / CSSProperties", description: "包裹层与画布的样式。" },
    { name: "children", type: "ReactNode", description: "被包裹的内容；点在里面任何地方都会迸火花，火花可以溢出边界。" },
  ],
};
