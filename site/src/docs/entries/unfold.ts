import { UNFOLD_DEFAULTS } from "@/motion/unfold";
import type { DocEntry, Values } from "../types";

const D = { animation: UNFOLD_DEFAULTS.type, duration: UNFOLD_DEFAULTS.duration, stagger: UNFOLD_DEFAULTS.stagger };

const optionsOf = (v: Values) => {
  const parts = [v.animation !== D.animation ? `type: "${v.animation}"` : "", Number(v.duration) !== D.duration ? `duration: ${Number(v.duration)}` : "", Number(v.stagger) !== D.stagger ? `stagger: ${Number(v.stagger)}` : ""].filter(Boolean);
  return parts.length ? `, { ${parts.join(", ")} }` : "";
};

export const unfold: DocEntry = {
  slug: "unfold",
  name: "useUnfold",
  en: "useUnfold",
  title: "展开动效",
  section: "ui",
  group: "展示",
  description: "给任何「一段行插进来 / 拿走」的列表加上从上到下的展开收起：下方的行平滑让位，新行随让出的空间自上而下依次淡入；收起反过来，播完才移除。Tree 和 Agent 上下文检视器的构成表都用它。只动 transform / opacity，中途打断从当前位置接着走，减弱动效时直接显示。",
  file: "src/motion/use-unfold.ts",
  importFrom: "@hx/ui/motion",
  demo: () => import("./unfold.demo"),
  source: () => import("@/motion/use-unfold.ts?raw").then((m) => m.default),
  defaults: D,
  componentDefaults: {},
  stageHeight: 520,
  presets: [
    { label: "滑入", values: D },
    { label: "淡入", values: { ...D, animation: "fade" } },
    { label: "慢放", values: { ...D, duration: 600, stagger: 40 } },
  ],
  controls: [
    { type: "select", key: "animation", label: "类型", options: [{ value: "slide", label: "滑入" }, { value: "fade", label: "淡入" }, { value: "none", label: "无" }] },
    { type: "number", key: "duration", label: "时长", min: 80, max: 800, step: 20, unit: "ms" },
    { type: "number", key: "stagger", label: "每行加时", min: 0, max: 60, step: 2, unit: "ms" },
  ],
  usage: (v) =>
    `import { useUnfold } from "@hx/ui/motion";\n\n// 一列按显示顺序排的行; 展开 = 一段行插进来, 收起 = 一段行拿走\nexport function Releases({ groups }: { groups: Group[] }) {\n  const [open, setOpen] = React.useState<string | null>(null);\n  const lines = groups.flatMap((g) => [{ key: g.id, g }, ...(open === g.id ? g.items.map((it) => ({ key: \`\${g.id}/\${it.id}\`, it })) : [])]);\n  const { entries, ref } = useUnfold(lines, (l) => l.key${optionsOf(v)});\n  return (\n    <div>\n      {entries.map(({ key, item, exiting }) =>\n        "g" in item ? (\n          <button key={key} ref={ref(key)} type="button" aria-expanded={open === item.g.id} onClick={() => setOpen(open === item.g.id ? null : item.g.id)}>{item.g.title}</button>\n        ) : (\n          // 收起中的行: 不可聚焦, 不被读屏读到\n          <div key={key} ref={ref(key)} inert={exiting} aria-hidden={exiting || undefined}>{item.it.text}</div>\n        )\n      )}\n    </div>\n  );\n}\n`,
  props: [
    { name: "items", type: "T[]", description: "按显示顺序排的行（树的可见行、表格的行、清单项）。行可以分散在不同的父元素里，只要顺序就是显示顺序。" },
    { name: "getKey", type: "(item: T) => string", description: "每行唯一且稳定的 key。" },
    { name: "options", type: '"slide" | "fade" | "none" | UnfoldOptions', default: '"slide"', description: "同 Tree 的 animation：{ type, duration（让出一行的时长，默认 220ms）, stagger（每多一行可见的变化行加的时长，默认 14ms）, maxDuration（总时长封顶，默认 380ms）, easing（CSS cubic-bezier 或关键字）}。" },
    { name: "返回 entries", type: "{ key, item, exiting }[]", description: "要渲染的行：items 加上正在收起离开的行（exiting 为 true，用缓存的 item 渲染）。离开的行请加 inert 和 aria-hidden，动画播完自动移除。" },
    { name: "返回 ref", type: "(key) => (el) => void", description: "挂到每行的根元素上（同一个 key 返回同一个函数）。动画期间这个元素的 transform / opacity 由它接管，行本身不要再写 transform 动画。" },
    { name: "planUnfold / resolveUnfold / mergeUnfoldKeys", type: "纯函数", description: "从 @hx/ui/motion 一并导出的规划逻辑（不依赖 DOM，服务端可 import）：自己驱动动画（canvas、虚拟列表）时用。" },
  ],
};
