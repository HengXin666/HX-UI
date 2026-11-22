import type { DocEntry } from "../types";

export const radioGroup: DocEntry = {
  slug: "radio-group",
  name: "RadioGroup",
  title: "单选",
  section: "ui",
  group: "表单",
  description: "从几个选项里选一个，选项都要露出来比较时用（超过 5 个改用选择器）。RadioGroupCard 是整张可点的卡片样式，适合套餐和配送方式。方向键切换选项。",
  file: "src/components/ui/radio-group.tsx",
  importFrom: "@/components/ui/radio-group",
  demo: () => import("./radio-group.demo"),
  source: () => import("@/components/ui/radio-group.tsx?raw").then((m) => m.default),
  defaults: { style: "card", price: true, disabled: false },
  componentDefaults: {},
  presets: [
    { label: "卡片", values: { style: "card", price: true } },
    { label: "列表", values: { style: "list", price: false } },
    { label: "禁用", values: { disabled: true } },
  ],
  controls: [
    { type: "select", key: "style", label: "样式", options: [{ value: "card", label: "卡片" }, { value: "list", label: "列表" }] },
    { type: "toggle", key: "price", label: "价格" },
    { type: "toggle", key: "disabled", label: "禁用" },
  ],
  usage: (v) => v.style === "card"
    ? `import { RadioGroup, RadioGroupCard } from "@/components/ui/radio-group";\n\nexport function PlanPicker() {\n  return (\n    <RadioGroup defaultValue="pro" aria-label="套餐"${v.disabled ? " disabled" : ""}>\n      <RadioGroupCard value="hobby" title="个人版" description="1 个项目，社区支持。"${v.price ? ` aside="免费"` : ""} />\n      <RadioGroupCard value="pro" title="专业版" description="无限项目，邮件支持。"${v.price ? ` aside="¥99/月"` : ""} />\n    </RadioGroup>\n  );\n}\n`
    : `import { Field } from "@/components/ui/field";\nimport { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";\n\nexport function PlanPicker() {\n  return (\n    <RadioGroup defaultValue="pro" aria-label="套餐"${v.disabled ? " disabled" : ""}>\n      <Field label="个人版" description="1 个项目，社区支持。" orientation="horizontal">\n        <RadioGroupItem value="hobby" />\n      </Field>\n      <Field label="专业版" description="无限项目，邮件支持。" orientation="horizontal">\n        <RadioGroupItem value="pro" />\n      </Field>\n    </RadioGroup>\n  );\n}\n`,
  props: [
    { name: "RadioGroup.value / defaultValue", type: "string", description: "选中的值。" },
    { name: "RadioGroup.onValueChange", type: "(value: string) => void", description: "选中变化。" },
    { name: "RadioGroup.disabled", type: "boolean", default: "false", description: "整组禁用。" },
    { name: "RadioGroupItem.value", type: "string", description: "单个选项的值。" },
    { name: "RadioGroupCard", type: "{ value, title, description?, aside?, disabled? }", description: "卡片式选项：整张可点，选中描边变主色，aside 放价格。" },
  ],
};
