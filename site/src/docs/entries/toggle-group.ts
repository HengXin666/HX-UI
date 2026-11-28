import type { DocEntry } from "../types";

export const toggleGroup: DocEntry = {
  slug: "toggle-group",
  name: "ToggleGroup",
  title: "切换按钮组",
  section: "ui",
  group: "操作",
  description: "工具栏里的开关按钮。type=\"multiple\" 可同时按下多个（粗体 + 斜体），type=\"single\" 只能选一个（对齐、视图）。只有图标时必须写 aria-label。",
  file: "src/components/ui/toggle-group.tsx",
  importFrom: "@/components/ui/toggle-group",
  demo: () => import("./toggle-group.demo"),
  source: () => import("@/components/ui/toggle-group.tsx?raw").then((m) => m.default),
  defaults: { variant: "outline", size: "default", labels: true },
  componentDefaults: {},
  presets: [
    { label: "描边", values: { variant: "outline" } },
    { label: "无边框", values: { variant: "default" } },
    { label: "纯图标", values: { labels: false, size: "sm" } },
  ],
  controls: [
    { type: "select", key: "variant", label: "样式", options: [{ value: "outline", label: "描边" }, { value: "default", label: "无边框" }] },
    { type: "select", key: "size", label: "尺寸", options: [{ value: "sm", label: "小" }, { value: "default", label: "中" }, { value: "lg", label: "大" }] },
    { type: "toggle", key: "labels", label: "文字" },
  ],
  usage: (v) => `import { LayoutGrid, List } from "lucide-react";\nimport { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";\n\nexport function ViewSwitch({ view, setView }: { view: string; setView: (v: string) => void }) {\n  return (\n    <ToggleGroup type="single"${v.variant !== "default" ? ` variant="${v.variant}"` : ""}${v.size !== "default" ? ` size="${v.size}"` : ""} value={view} onValueChange={(v) => v && setView(v)} aria-label="视图">\n      <ToggleGroupItem value="grid"${v.labels ? "" : ` aria-label="网格"`}><LayoutGrid />${v.labels ? "网格" : ""}</ToggleGroupItem>\n      <ToggleGroupItem value="list"${v.labels ? "" : ` aria-label="列表"`}><List />${v.labels ? "列表" : ""}</ToggleGroupItem>\n    </ToggleGroup>\n  );\n}\n`,
  props: [
    { name: "type", type: '"single" | "multiple"', description: "单选或多选。" },
    { name: "value / defaultValue / onValueChange", type: "string | string[]", description: "single 时为字符串，multiple 时为数组；single 再点一次会变成空，需要时自己拦住。" },
    { name: "variant", type: '"default" | "outline"', default: '"default"', description: "样式。" },
    { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "尺寸。" },
    { name: "spacing", type: "number", default: "0", description: "按钮间距；0 时连成一组。" },
    { name: "ToggleGroupItem.value", type: "string", description: "按钮的值。" },
  ],
};
