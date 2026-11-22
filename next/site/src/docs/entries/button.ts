import type { DocEntry, Values } from "../types";

const q = (v: Values[string]) => JSON.stringify(String(v));
const VARIANTS = [
  { value: "default", label: "实心" },
  { value: "secondary", label: "次要" },
  { value: "outline", label: "描边" },
  { value: "ghost", label: "幽灵" },
  { value: "destructive", label: "危险" },
  { value: "shimmer", label: "流光" },
];

export const button: DocEntry = {
  slug: "button",
  name: "Button",
  title: "按钮",
  section: "ui",
  group: "操作",
  description: "六种样式、四种尺寸。流光样式留给页面上最重要的那个动作；需要提交流程时换成 StatefulButton，进行中自动禁用防重复提交，成功和失败由读屏播报。",
  file: "src/components/ui/button.tsx",
  importFrom: "@/components/ui/button",
  demo: () => import("./button.demo"),
  source: () => import("@/components/ui/button.tsx?raw").then((m) => m.default),
  defaults: { variant: "default", size: "default", label: "保存更改", icon: false, flow: "success", latency: 1200, resetAfter: 1600, pendingLabel: "保存中", successLabel: "已保存" },
  componentDefaults: {},
  presets: [
    { label: "保存（成功）", values: { variant: "default", flow: "success", label: "保存更改", pendingLabel: "保存中", successLabel: "已保存" } },
    { label: "保存（失败）", values: { variant: "default", flow: "error", label: "保存更改", pendingLabel: "保存中", successLabel: "已保存" } },
    { label: "流光主按钮", values: { variant: "shimmer", flow: "none", label: "立即开始", icon: true, size: "lg" } },
    { label: "付款", values: { variant: "shimmer", flow: "success", label: "支付 ¥299", latency: 2200, pendingLabel: "正在支付", successLabel: "支付成功", size: "lg" } },
  ],
  controls: [
    { type: "select", key: "variant", label: "样式", options: VARIANTS },
    { type: "select", key: "size", label: "尺寸", options: [{ value: "sm", label: "小" }, { value: "default", label: "中" }, { value: "lg", label: "大" }] },
    { type: "text", key: "label", label: "文案" },
    { type: "select", key: "flow", label: "提交流程", options: [{ value: "none", label: "无" }, { value: "success", label: "成功" }, { value: "error", label: "失败" }] },
    { type: "toggle", key: "icon", label: "箭头（无流程时）" },
    { type: "number", key: "latency", label: "模拟耗时", min: 300, max: 4000, step: 100, unit: "ms" },
    { type: "number", key: "resetAfter", label: "复原等待", min: 0, max: 4000, step: 100, unit: "ms" },
    { type: "text", key: "pendingLabel", label: "进行中文案" },
    { type: "text", key: "successLabel", label: "成功文案" },
  ],
  usage: (v) => {
    const common = [v.variant !== "default" && `variant=${q(v.variant)}`, v.size !== "default" && `size=${q(v.size)}`].filter(Boolean) as string[];
    if (v.flow === "none") {
      const icon = v.icon ? "\nimport { ArrowRight } from \"lucide-react\";" : "";
      return `import { Button } from "@/components/ui/button";${icon}\n\nexport function Cta() {\n  return (\n    <Button${common.length ? " " + common.join(" ") : ""}>\n      ${v.label}${v.icon ? " <ArrowRight />" : ""}\n    </Button>\n  );\n}\n`;
    }
    const attrs = ["action={() => saveSettings()}", ...common];
    if (v.pendingLabel !== "提交中") attrs.push(`pendingLabel=${q(v.pendingLabel)}`);
    if (v.successLabel !== "已完成") attrs.push(`successLabel=${q(v.successLabel)}`);
    if (v.resetAfter !== 1600) attrs.push(`resetAfter={${v.resetAfter}}`);
    return `import { StatefulButton } from "@/interactions/stateful-button";\n\nexport function SaveButton() {\n  return (\n    <StatefulButton\n${attrs.map((a) => "      " + a).join("\n")}\n    >\n      ${v.label}\n    </StatefulButton>\n  );\n}\n`;
  },
  props: [
    { name: "variant", type: '"default" | "secondary" | "outline" | "ghost" | "destructive" | "link" | "shimmer"', default: '"default"', description: "样式；shimmer 是品牌色底加扫光，减弱动效时不扫。" },
    { name: "size", type: '"xs" | "sm" | "default" | "lg" | "icon"…', default: '"default"', description: "尺寸；icon 系列是正方形图标按钮。" },
    { name: "asChild", type: "boolean", default: "false", description: "把样式给到子元素，例如链接。" },
    { name: "StatefulButton.action", type: "() => Promise<unknown>", description: "提交流程：resolve 显示成功，reject 显示失败，可再点重试。" },
    { name: "StatefulButton.pendingLabel / successLabel / errorLabel", type: "ReactNode", default: '"提交中" / "已完成" / "失败，重试"', description: "三种状态的文案。" },
    { name: "StatefulButton.resetAfter", type: "number", default: "1600", description: "结果停留多久后复原，毫秒；0 表示停在结果上。" },
    { name: "StatefulButton.guard", type: "() => boolean", description: "执行前检查，返回 false 什么都不做（如表单校验没过）。" },
  ],
};
