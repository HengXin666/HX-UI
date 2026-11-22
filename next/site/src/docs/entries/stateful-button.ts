import type { DocEntry, Values } from "../types";

const q = (v: Values[string]) => JSON.stringify(String(v));

export const statefulButton: DocEntry = {
  slug: "stateful-button",
  name: "StatefulButton",
  title: "有状态按钮",
  category: "interaction",
  description: "保存、提交、付款。一个按钮讲清进行中、成功和失败：进行中自动禁用防重复提交，状态变化由读屏播报。",
  file: "src/interactions/stateful-button/index.tsx",
  importFrom: "@/interactions/stateful-button",
  demo: () => import("./stateful-button.demo"),
  source: () => import("@/interactions/stateful-button/index.tsx?raw").then((m) => m.default),
  defaults: {
    label: "保存更改",
    latency: 1200,
    fail: false,
    resetAfter: 1600,
    size: "default",
    variant: "default",
    pendingLabel: "保存中",
    successLabel: "已保存",
    errorLabel: "失败，重试",
  },
  componentDefaults: { resetAfter: 1600, size: "default", variant: "default", pendingLabel: "提交中", successLabel: "已完成", errorLabel: "失败，重试" },
  presets: [
    { label: "保存成功", values: { label: "保存更改", fail: false, latency: 1200, pendingLabel: "保存中", successLabel: "已保存" } },
    { label: "网络失败", values: { label: "保存更改", fail: true, latency: 1400, pendingLabel: "保存中", successLabel: "已保存" } },
    { label: "付款", values: { label: "支付 ¥299", fail: false, latency: 2200, pendingLabel: "正在支付", successLabel: "支付成功" } },
    { label: "停在结果", values: { resetAfter: 0 } },
  ],
  controls: [
    { type: "text", key: "label", label: "按钮文案" },
    { type: "number", key: "latency", label: "模拟耗时", min: 300, max: 4000, step: 100, unit: "ms" },
    { type: "toggle", key: "fail", label: "模拟失败" },
    { type: "number", key: "resetAfter", label: "复原等待", min: 0, max: 4000, step: 100, unit: "ms" },
    { type: "select", key: "size", label: "尺寸", options: [{ value: "sm", label: "小" }, { value: "default", label: "中" }, { value: "lg", label: "大" }] },
    { type: "select", key: "variant", label: "样式", options: [{ value: "default", label: "实心" }, { value: "secondary", label: "次要" }, { value: "outline", label: "描边" }] },
    { type: "text", key: "pendingLabel", label: "进行中" },
    { type: "text", key: "successLabel", label: "成功" },
    { type: "text", key: "errorLabel", label: "失败" },
  ],
  usage: (v) => {
    const d: Values = { resetAfter: 1600, size: "default", variant: "default", pendingLabel: "提交中", successLabel: "已完成", errorLabel: "失败，重试" };
    const attrs = ["  action={() => saveSettings()}"];
    for (const k of ["size", "variant", "pendingLabel", "successLabel", "errorLabel"]) if (v[k] !== d[k]) attrs.push(`  ${k}=${q(v[k])}`);
    if (v.resetAfter !== d.resetAfter) attrs.push(`  resetAfter={${v.resetAfter}}`);
    return `import { StatefulButton } from "@/interactions/stateful-button";\n\nexport function SaveButton() {\n  return (\n    <StatefulButton\n${attrs.map((a) => "      " + a.trim()).join("\n")}\n    >\n      ${String(v.label)}\n    </StatefulButton>\n  );\n}\n`;
  },
  props: [
    { name: "action", type: "() => Promise<unknown>", description: "点击后执行的任务；resolve 显示成功，reject 显示失败。" },
    { name: "children", type: "ReactNode", description: "待命时的文案。" },
    { name: "pendingLabel", type: "ReactNode", default: '"提交中"', description: "进行中的文案，前面带转圈。" },
    { name: "successLabel", type: "ReactNode", default: '"已完成"', description: "成功的文案，前面带对勾。" },
    { name: "errorLabel", type: "ReactNode", default: '"失败，重试"', description: "失败的文案；按钮变成描边红色，可再点重试。" },
    { name: "resetAfter", type: "number", default: "1600", description: "成功 / 失败停留多久后复原，毫秒；0 表示停在结果上。" },
    { name: "guard", type: "() => boolean", description: "执行前的检查，返回 false 什么都不做（如表单校验没过）。" },
    { name: "size", type: '"xs" | "sm" | "default" | "lg"', default: '"default"', description: "沿用 Button 的尺寸。" },
    { name: "variant", type: '"default" | "secondary" | "outline" | "ghost" | "destructive" | "link"', default: '"default"', description: "沿用 Button 的样式。" },
    { name: "disabled", type: "boolean", default: "false", description: "额外禁用；进行中会自动禁用。" },
  ],
};
