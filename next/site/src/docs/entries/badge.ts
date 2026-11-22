import type { DocEntry } from "../types";

export const badge: DocEntry = {
  slug: "badge",
  name: "Badge",
  title: "徽标",
  section: "ui",
  group: "展示",
  description: "短标签和状态。dot 加一个状态点，live 让它外圈脉冲表示实时；颜色只是辅助，文字要说清状态。",
  file: "src/components/ui/badge.tsx",
  importFrom: "@/components/ui/badge",
  demo: () => import("./badge.demo"),
  source: () => import("@/components/ui/badge.tsx?raw").then((m) => m.default),
  defaults: { variant: "outline", dot: true, live: true },
  componentDefaults: {},
  presets: [
    { label: "实时状态", values: { variant: "outline", dot: true, live: true } },
    { label: "静态状态", values: { variant: "outline", dot: true, live: false } },
    { label: "纯标签", values: { variant: "secondary", dot: false, live: false } },
  ],
  controls: [
    { type: "select", key: "variant", label: "样式", options: [{ value: "outline", label: "描边" }, { value: "secondary", label: "次要" }, { value: "default", label: "实心" }] },
    { type: "toggle", key: "dot", label: "状态点" },
    { type: "toggle", key: "live", label: "脉冲" },
  ],
  usage: (v) => {
    const a = [v.variant !== "default" && `variant="${v.variant}"`, v.dot && `dot="success"`, v.dot && v.live && "live"].filter(Boolean);
    return `import { Badge } from "@/components/ui/badge";\n\nexport function Status() {\n  return <Badge${a.length ? " " + a.join(" ") : ""}>运行中</Badge>;\n}\n`;
  },
  props: [
    { name: "variant", type: '"default" | "secondary" | "destructive" | "outline" | "ghost" | "link"', default: '"default"', description: "样式。" },
    { name: "dot", type: '"success" | "warning" | "destructive" | "info" | "muted"', description: "前置状态点，颜色读主题令牌。" },
    { name: "live", type: "boolean", default: "false", description: "状态点外圈脉冲；减弱动效时不脉冲。" },
    { name: "asChild", type: "boolean", default: "false", description: "把样式给到子元素，例如链接；此时不画状态点。" },
  ],
};
