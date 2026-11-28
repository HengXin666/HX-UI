import type { DocEntry } from "../types";

export const progress: DocEntry = {
  slug: "progress",
  name: "Progress",
  title: "进度条",
  section: "ui",
  group: "反馈",
  description: "能算出进度时用：上传、导入、配额。算不出时传 value={null}，变成来回滑动的不确定进度。只动 transform，减弱动效时停住。",
  file: "src/components/ui/progress.tsx",
  importFrom: "@/components/ui/progress",
  demo: () => import("./progress.demo"),
  source: () => import("@/components/ui/progress.tsx?raw").then((m) => m.default),
  defaults: { size: "default", tone: "default", indeterminate: false },
  componentDefaults: {},
  presets: [
    { label: "上传", values: { indeterminate: false, size: "default" } },
    { label: "不确定", values: { indeterminate: true } },
    { label: "细条", values: { size: "sm" } },
  ],
  controls: [
    { type: "select", key: "size", label: "粗细", options: [{ value: "sm", label: "细" }, { value: "default", label: "中" }, { value: "lg", label: "粗" }] },
    { type: "select", key: "tone", label: "颜色", options: [{ value: "default", label: "主色" }, { value: "warning", label: "警告" }, { value: "destructive", label: "危险" }] },
    { type: "toggle", key: "indeterminate", label: "不确定" },
  ],
  usage: (v) => `import { Progress } from "@/components/ui/progress";\n\n<Progress value={${v.indeterminate ? "null" : "62"}}${v.size !== "default" ? ` size="${v.size}"` : ""}${v.tone !== "default" ? ` tone="${v.tone}"` : ""} aria-label="上传 合同-2026Q4.pdf" />\n`,
  props: [
    { name: "value", type: "number | null", default: "0", description: "当前值；null 为不确定进度。" },
    { name: "max", type: "number", default: "100", description: "最大值。" },
    { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "4 / 8 / 12px。" },
    { name: "tone", type: '"default" | "success" | "warning" | "destructive"', default: '"default"', description: "颜色；配额快满时用 warning。" },
    { name: "aria-label / aria-labelledby", type: "string", description: "说明这是什么的进度，读屏需要。" },
  ],
};
