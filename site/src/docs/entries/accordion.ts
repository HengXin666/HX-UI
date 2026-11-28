import type { DocEntry } from "../types";

export const accordion: DocEntry = {
  slug: "accordion",
  name: "Accordion",
  title: "折叠面板",
  section: "ui",
  group: "展示",
  description: "一组可展开的段落，常见问题、设置分组用。展开收起有高度动画；single 一次只开一个，multiple 可同时开多个。上下键在标题间移动。",
  file: "src/components/ui/accordion.tsx",
  importFrom: "@/components/ui/accordion",
  demo: () => import("./accordion.demo"),
  source: () => import("@/components/ui/accordion.tsx?raw").then((m) => m.default),
  defaults: { type: "single", collapsible: true },
  componentDefaults: {},
  remountOnChange: true,
  presets: [
    { label: "一次一个", values: { type: "single", collapsible: true } },
    { label: "可多开", values: { type: "multiple" } },
  ],
  controls: [
    { type: "select", key: "type", label: "模式", options: [{ value: "single", label: "单开" }, { value: "multiple", label: "多开" }] },
    { type: "toggle", key: "collapsible", label: "可全部收起" },
  ],
  usage: (v) => `import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";\n\nexport function Faq() {\n  return (\n    <Accordion type="${v.type}"${v.type === "single" && v.collapsible ? " collapsible" : ""}>\n      <AccordionItem value="cancel">\n        <AccordionTrigger>可以随时取消订阅吗？</AccordionTrigger>\n        <AccordionContent>可以。取消后用到当前计费周期结束。</AccordionContent>\n      </AccordionItem>\n    </Accordion>\n  );\n}\n`,
  props: [
    { name: "type", type: '"single" | "multiple"', description: "一次开一个或多个。" },
    { name: "collapsible", type: "boolean", default: "false", description: "single 时允许全部收起。" },
    { name: "value / defaultValue / onValueChange", type: "string | string[]", description: "展开的项。" },
    { name: "AccordionItem.value / disabled", type: "string / boolean", description: "每项的值。" },
    { name: "AccordionTrigger.level", type: "2 | 3 | 4 | 5 | 6", default: "3", description: "标题层级，按页面大纲选。" },
    { name: "AccordionTrigger / AccordionContent", type: "组件", description: "标题（自带箭头）和内容。" },
  ],
};
