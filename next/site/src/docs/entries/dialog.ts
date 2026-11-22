import type { DocEntry } from "../types";

export const dialog: DocEntry = {
  slug: "dialog",
  name: "ConfirmDialog",
  title: "对话框",
  section: "ui",
  group: "反馈",
  description: "打断当前操作、要用户做决定时用。ConfirmDialog 内置异步提交、失败留在原处重试、输入名称才能删除；自由内容用 Dialog 组合。",
  file: "src/components/ui/confirm-dialog.tsx",
  importFrom: "@/components/ui/confirm-dialog",
  demo: () => import("./dialog.demo"),
  source: () => import("@/components/ui/confirm-dialog.tsx?raw").then((m) => m.default),
  defaults: { tone: "destructive", confirmText: true, result: "success", latency: 1200 },
  componentDefaults: {},
  presets: [
    { label: "删除确认", values: { tone: "destructive", confirmText: true, result: "success" } },
    { label: "普通确认", values: { tone: "default", confirmText: false, result: "success" } },
    { label: "提交失败", values: { result: "error" } },
  ],
  demoOnly: ["result", "latency"],
  controls: [
    { type: "select", key: "tone", label: "语气", options: [{ value: "destructive", label: "危险" }, { value: "default", label: "普通" }] },
    { type: "toggle", key: "confirmText", label: "输入确认" },
    { type: "select", key: "result", label: "结果", options: [{ value: "success", label: "成功" }, { value: "error", label: "失败" }] },
    { type: "number", key: "latency", label: "耗时", min: 200, max: 3000, step: 100, unit: "ms" },
  ],
  usage: (v) => `import { Button } from "@/components/ui/button";\nimport { ConfirmDialog } from "@/components/ui/confirm-dialog";\n\nexport function DeleteProject({ onDelete }: { onDelete: () => Promise<void> }) {\n  return (\n    <ConfirmDialog\n      trigger={<Button variant="${v.tone === "destructive" ? "destructive" : "outline"}">删除项目</Button>}\n      title="删除 tally-web？"\n      description="项目下的 38 个看板会一起删除，无法恢复。"${v.tone === "destructive" ? `\n      tone="destructive"` : ""}\n      confirmLabel="删除"${v.confirmText ? `\n      confirmText="tally-web"` : ""}\n      onConfirm={onDelete}\n    />\n  );\n}\n`,
  props: [
    { name: "trigger", type: "ReactElement", description: "打开它的按钮；也可以不给，用 open / onOpenChange 受控。" },
    { name: "title / description", type: "ReactNode", description: "标题和说明，说清楚会发生什么、能不能撤销。" },
    { name: "confirmLabel / cancelLabel", type: "string", default: '"确认" / "取消"', description: "按钮文字，用动词：删除、转移。" },
    { name: "tone", type: '"default" | "destructive"', default: '"default"', description: "危险操作主按钮变红。" },
    { name: "confirmText", type: "string", description: "要求输入这段文字才能确认。" },
    { name: "onConfirm", type: "() => void | Promise", description: "返回 Promise 时按钮转圈且不能关闭；抛错则显示错误、留在对话框。" },
    { name: "open / onOpenChange", type: "boolean / (open) => void", description: "受控打开。" },
    { name: "Dialog 系列", type: "Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter", description: "需要表单等自由内容时直接组合。" },
  ],
};
