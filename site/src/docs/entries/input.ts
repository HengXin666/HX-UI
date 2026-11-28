import type { DocEntry } from "../types";

export const input: DocEntry = {
  slug: "input",
  name: "Input",
  title: "输入框",
  section: "ui",
  group: "表单",
  description: "单行输入。放进 Field 自动连好标签、说明和错误；leading / trailing 在框内放图标、前缀或按钮。",
  file: "src/components/ui/input.tsx",
  importFrom: "@/components/ui/input",
  demo: () => import("./input.demo"),
  source: () => import("@/components/ui/input.tsx?raw").then((m) => m.default),
  defaults: { size: "default", icons: true, required: true, error: false, disabled: false },
  componentDefaults: {},
  presets: [
    { label: "默认", values: { error: false, disabled: false } },
    { label: "校验失败", values: { error: true, disabled: false } },
    { label: "禁用", values: { disabled: true, error: false } },
    { label: "大号", values: { size: "lg" } },
  ],
  controls: [
    { type: "select", key: "size", label: "尺寸", options: [{ value: "sm", label: "小" }, { value: "default", label: "中" }, { value: "lg", label: "大" }] },
    { type: "toggle", key: "icons", label: "图标" },
    { type: "toggle", key: "required", label: "必填" },
    { type: "toggle", key: "error", label: "错误" },
    { type: "toggle", key: "disabled", label: "禁用" },
  ],
  usage: (v) => {
    const field = [`label="工作邮箱"`, v.required && "required", v.disabled && "disabled", v.error && `error="这个邮箱已经注册过了。"`].filter(Boolean).join(" ");
    const inp = [v.size !== "default" && `size="${v.size}"`, `type="email"`, `placeholder="you@company.com"`, v.icons && "leading={<Mail />}"].filter(Boolean).join(" ");
    return `import { Mail } from "lucide-react";\nimport { Field } from "@/components/ui/field";\nimport { Input } from "@/components/ui/input";\n\nexport function EmailField() {\n  return (\n    <Field ${field}>\n      <Input ${inp} />\n    </Field>\n  );\n}\n`;
  },
  props: [
    { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: "高度 32 / 36 / 44px。" },
    { name: "leading", type: "ReactNode", description: "框内左侧：图标或文字前缀，不拦截点击。" },
    { name: "trailing", type: "ReactNode", description: "框内右侧：单位、快捷键或按钮（如显示密码）。" },
    { name: "...input", type: "ComponentProps<\"input\">", description: "原生 input 的全部属性。" },
    { name: "Field.label / description / error", type: "ReactNode", description: "标签、说明、错误；错误出现时控件 aria-invalid 并由读屏播报。" },
    { name: "Field.required / disabled", type: "boolean", default: "false", description: "必填星号和 aria-required；禁用会传给里面的控件。" },
    { name: "Field.aside", type: "ReactNode", description: "标签右侧的附加内容，如字数或「忘记密码」。" },
    { name: "Field.orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: "horizontal 给复选框、单个开关用：控件在前，标签在后。" },
  ],
};
