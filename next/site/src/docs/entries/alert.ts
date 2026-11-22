import type { DocEntry } from "../types";

export const alert: DocEntry = {
  slug: "alert",
  name: "Alert",
  title: "警告条",
  section: "ui",
  group: "反馈",
  description: "页面里常驻的提醒，直到问题解决才消失：用量将超、付款失败、计划维护。warning / destructive 会被读屏立即播报，其余礼貌播报。",
  file: "src/components/ui/alert.tsx",
  importFrom: "@/components/ui/alert",
  demo: () => import("./alert.demo"),
  source: () => import("@/components/ui/alert.tsx?raw").then((m) => m.default),
  defaults: { variant: "warning", icon: true, action: true },
  componentDefaults: {},
  presets: [
    { label: "用量提醒", values: { variant: "warning" } },
    { label: "付款失败", values: { variant: "destructive" } },
    { label: "维护通知", values: { variant: "info" } },
    { label: "成功", values: { variant: "success" } },
  ],
  controls: [
    { type: "select", key: "variant", label: "类型", options: [{ value: "default", label: "默认" }, { value: "info", label: "信息" }, { value: "success", label: "成功" }, { value: "warning", label: "警告" }, { value: "destructive", label: "危险" }] },
    { type: "toggle", key: "icon", label: "图标" },
    { type: "toggle", key: "action", label: "操作" },
  ],
  usage: (v) => `import { TriangleAlert } from "lucide-react";\nimport { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";\nimport { Button } from "@/components/ui/button";\n\nexport function UsageAlert() {\n  return (\n    <Alert${v.variant !== "default" ? ` variant="${v.variant}"` : ""}>${v.icon ? "\n      <TriangleAlert />" : ""}\n      <AlertTitle>本月用量已到 82%</AlertTitle>\n      <AlertDescription>按目前速度，预计 11 月 27 日超出套餐额度。</AlertDescription>${v.action ? `\n      <AlertAction>\n        <Button size="sm" variant="outline">升级套餐</Button>\n      </AlertAction>` : ""}\n    </Alert>\n  );\n}\n`,
  props: [
    { name: "variant", type: '"default" | "info" | "success" | "warning" | "destructive"', default: '"default"', description: "颜色和读屏播报方式。" },
    { name: "children: <svg>", type: "图标", description: "第一个子元素放图标，会自动对齐并着色。" },
    { name: "AlertTitle / AlertDescription", type: "组件", description: "标题一句话说清楚，说明给原因和时间。" },
    { name: "AlertAction", type: "组件", description: "下方操作区，放一两个按钮。" },
  ],
};
