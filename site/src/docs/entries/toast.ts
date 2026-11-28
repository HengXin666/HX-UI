import type { DocEntry } from "../types";

export const toastEntry: DocEntry = {
  slug: "toast",
  name: "toast",
  title: "轻提示",
  section: "ui",
  group: "反馈",
  description: "操作结果的短提示，不打断用户，几秒后自动消失。可以带「撤销」，也可以跟着一个 Promise 从加载变成成功或失败。应用根部放一次 <Toaster />。",
  file: "src/components/ui/sonner.tsx",
  importFrom: "sonner",
  demo: () => import("./toast.demo"),
  source: () => import("@/components/ui/sonner.tsx?raw").then((m) => m.default),
  defaults: { type: "success", description: true, action: true, duration: 4 },
  componentDefaults: {},
  presets: [
    { label: "可撤销", values: { type: "success", action: true } },
    { label: "异步", values: { type: "promise", action: false } },
    { label: "失败", values: { type: "error", action: false } },
  ],
  controls: [
    { type: "select", key: "type", label: "类型", options: [{ value: "success", label: "成功" }, { value: "error", label: "失败" }, { value: "warning", label: "警告" }, { value: "info", label: "信息" }, { value: "promise", label: "异步" }] },
    { type: "toggle", key: "description", label: "说明" },
    { type: "toggle", key: "action", label: "撤销按钮" },
    { type: "number", key: "duration", label: "停留", min: 2, max: 10, step: 1, unit: "s" },
  ],
  usage: (v) => {
    const opts = [v.description && `description: "tally-web · main"`, Number(v.duration) !== 4 && `duration: ${Number(v.duration) * 1000}`, v.action && v.type !== "promise" && `action: { label: "撤销", onClick: undo }`].filter(Boolean).join(", ");
    const o = opts ? `, { ${opts} }` : "";
    const call = v.type === "promise"
      ? `toast.promise(deploy(), { loading: "正在部署…", success: "部署完成", error: "部署失败"${v.description ? `, description: "tally-web · main"` : ""} })`
      : `toast.${v.type}("${v.type === "error" ? "部署失败" : v.type === "warning" ? "用量已到 80%" : v.type === "info" ? "有新版本可用" : "已归档 3 个项目"}"${o})`;
    return `// 根组件里放一次\nimport { Toaster } from "@/components/ui/sonner";\n<Toaster />\n\n// 任意位置调用\nimport { toast } from "sonner";\n\n${call};\n`;
  },
  props: [
    { name: "toast(msg, opts) / toast.success / error / warning / info", type: "函数", description: "弹出提示，返回 id。" },
    { name: "toast.promise(p, { loading, success, error })", type: "函数", description: "跟着 Promise 自动切换三种状态。" },
    { name: "opts.description", type: "ReactNode", description: "第二行说明。" },
    { name: "opts.action", type: "{ label, onClick }", description: "一个操作按钮，常用于撤销。" },
    { name: "opts.duration", type: "number", default: "4000", description: "停留毫秒；Infinity 不自动消失。" },
    { name: "toast.dismiss(id?)", type: "函数", description: "关掉某条或全部。" },
    { name: "<Toaster position />", type: '"bottom-right" | "top-center" | …', default: '"bottom-right"', description: "全局位置，放在应用根部。" },
  ],
};
