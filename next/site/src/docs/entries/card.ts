import type { DocEntry } from "../types";
import { COLOR_OPTIONS, SOFT_COLOR_OPTIONS } from "./_shared";

export const card: DocEntry = {
  slug: "card",
  name: "Card",
  title: "卡片",
  section: "ui",
  group: "展示",
  description: "内容容器。effect 给它加一层特效：spotlight 让一圈柔光跟着指针走，beam 让一道光沿边框绕圈，用来标出推荐项。",
  file: "src/components/ui/card.tsx",
  importFrom: "@/components/ui/card",
  demo: () => import("./card.demo"),
  source: () => import("@/components/ui/card.tsx?raw").then((m) => m.default),
  defaults: { effect: "spotlight", spotColor: SOFT_COLOR_OPTIONS[0].value, beamColor: "var(--brand)" },
  componentDefaults: {},
  presets: [
    { label: "无特效", values: { effect: "none" } },
    { label: "光斑", values: { effect: "spotlight", spotColor: SOFT_COLOR_OPTIONS[0].value } },
    { label: "白光", values: { effect: "spotlight", spotColor: SOFT_COLOR_OPTIONS[4].value } },
    { label: "推荐项流光", values: { effect: "beam", beamColor: "var(--brand)" } },
  ],
  controls: [
    { type: "select", key: "effect", label: "特效", options: [{ value: "none", label: "无" }, { value: "spotlight", label: "光斑" }, { value: "beam", label: "流光边框" }] },
    { type: "select", key: "spotColor", label: "光斑颜色", options: SOFT_COLOR_OPTIONS },
    { type: "select", key: "beamColor", label: "流光颜色", options: COLOR_OPTIONS },
  ],
  usage: (v) => {
    const color = v.effect === "beam" ? (v.beamColor !== "var(--brand)" ? ` effectColor="${v.beamColor}"` : "") : v.effect === "spotlight" && v.spotColor !== SOFT_COLOR_OPTIONS[0].value ? ` effectColor="${v.spotColor}"` : "";
    const eff = v.effect === "none" ? "" : ` effect="${v.effect}"${color}`;
    return `import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";\n\nexport function Feature() {\n  return (\n    <Card${eff}>\n      <CardHeader>\n        <CardTitle>读屏友好</CardTitle>\n        <CardDescription>每个组件都过 axe 检查。</CardDescription>\n      </CardHeader>\n    </Card>\n  );\n}\n`;
  },
  props: [
    { name: "effect", type: '"none" | "spotlight" | "beam"', default: '"none"', description: "spotlight 只写 CSS 变量不重渲染；beam 用 conic-gradient 加遮罩只露出边框。" },
    { name: "effectColor", type: "string", description: "特效颜色，任意 CSS 颜色；光斑建议带透明度。默认读品牌色令牌。" },
    { name: "CardHeader / CardTitle / CardDescription / CardContent / CardFooter", type: "组件", description: "卡片的各个区域，按需组合。" },
  ],
};
