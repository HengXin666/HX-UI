import type { DocEntry } from "../types";

export const checkbox: DocEntry = {
  slug: "checkbox",
  name: "Checkbox",
  title: "复选框",
  section: "ui",
  group: "表单",
  description: "多选。checked 可以是 \"indeterminate\"，用来做部分选中的「全部」；配 Field orientation=\"horizontal\" 时点标签也能勾选。",
  file: "src/components/ui/checkbox.tsx",
  importFrom: "@/components/ui/checkbox",
  demo: () => import("./checkbox.demo"),
  source: () => import("@/components/ui/checkbox.tsx?raw").then((m) => m.default),
  defaults: { selectAll: true, descriptions: true, disabled: false },
  componentDefaults: {},
  presets: [
    { label: "带全选", values: { selectAll: true, descriptions: true } },
    { label: "精简", values: { selectAll: false, descriptions: false } },
    { label: "禁用", values: { disabled: true } },
  ],
  controls: [
    { type: "toggle", key: "selectAll", label: "全选" },
    { type: "toggle", key: "descriptions", label: "说明" },
    { type: "toggle", key: "disabled", label: "禁用" },
  ],
  usage: (v) => `import { Checkbox } from "@/components/ui/checkbox";\nimport { Field } from "@/components/ui/field";\n\nexport function NotifyDeploy() {\n  return (\n    <Field label="部署结果"${v.descriptions ? ` description="成功或失败都会通知。"` : ""} orientation="horizontal"${v.disabled ? " disabled" : ""}>\n      <Checkbox defaultChecked />\n    </Field>\n  );\n}\n`,
  props: [
    { name: "checked / defaultChecked", type: 'boolean | "indeterminate"', description: "选中状态；indeterminate 显示为部分选中。" },
    { name: "onCheckedChange", type: '(checked: boolean | "indeterminate") => void', description: "状态变化。" },
    { name: "disabled", type: "boolean", default: "false", description: "禁用；放在 Field 里时跟随 Field.disabled。" },
    { name: "name / value / required", type: "string / boolean", description: "放进原生表单时提交用。" },
  ],
};
