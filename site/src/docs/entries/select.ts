import type { DocEntry } from "../types";

export const select: DocEntry = {
  slug: "select",
  name: "Select",
  title: "选择器",
  section: "ui",
  group: "表单",
  description: "从一组固定选项里选一个。键盘可上下选、可输入首字跳转；选项多时用 SelectGroup 分组。",
  file: "src/components/ui/select.tsx",
  importFrom: "@/components/ui/select",
  demo: () => import("./select.demo"),
  source: () => import("@/components/ui/select.tsx?raw").then((m) => m.default),
  defaults: { size: "default", grouped: true, error: false, disabled: false },
  componentDefaults: {},
  presets: [
    { label: "分组", values: { grouped: true, error: false } },
    { label: "平铺", values: { grouped: false, error: false } },
    { label: "未选择", values: { error: true } },
  ],
  controls: [
    { type: "select", key: "size", label: "尺寸", options: [{ value: "sm", label: "小" }, { value: "default", label: "中" }, { value: "lg", label: "大" }] },
    { type: "toggle", key: "grouped", label: "分组" },
    { type: "toggle", key: "error", label: "错误" },
    { type: "toggle", key: "disabled", label: "禁用" },
  ],
  usage: (v) => {
    const f = [`label="部署区域"`, v.disabled && "disabled", v.error && `error="请选择一个区域。"`].filter(Boolean).join(" ");
    const items = v.grouped
      ? `        <SelectGroup>\n          <SelectLabel>中国大陆</SelectLabel>\n          <SelectItem value="sh">华东 · 上海</SelectItem>\n          <SelectItem value="bj">华北 · 北京</SelectItem>\n        </SelectGroup>\n        <SelectSeparator />\n        <SelectGroup>\n          <SelectLabel>海外</SelectLabel>\n          <SelectItem value="sg">新加坡</SelectItem>\n        </SelectGroup>`
      : `        <SelectItem value="sh">华东 · 上海</SelectItem>\n        <SelectItem value="bj">华北 · 北京</SelectItem>\n        <SelectItem value="sg">新加坡</SelectItem>`;
    const imp = v.grouped ? "Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue" : "Select, SelectContent, SelectItem, SelectTrigger, SelectValue";
    return `import { Field } from "@/components/ui/field";\nimport { ${imp} } from "@/components/ui/select";\n\nexport function RegionSelect() {\n  return (\n    <Field ${f}>\n      <Select>\n        <SelectTrigger${v.size !== "default" ? ` size="${v.size}"` : ""} className="w-full">\n          <SelectValue placeholder="选择区域" />\n        </SelectTrigger>\n        <SelectContent>\n${items}\n        </SelectContent>\n      </Select>\n    </Field>\n  );\n}\n`;
  },
  props: [
    { name: "Select.value / defaultValue", type: "string", description: "受控或非受控的选中值。" },
    { name: "Select.onValueChange", type: "(value: string) => void", description: "选中变化。" },
    { name: "SelectTrigger.size", type: '"sm" | "default" | "lg"', default: '"default"', description: "与 Input 同高，可并排放。" },
    { name: "SelectValue.placeholder", type: "ReactNode", description: "没选时的提示。" },
    { name: "SelectItem.value", type: "string", description: "选项值；disabled 可禁用单项。" },
    { name: "SelectGroup / SelectLabel / SelectSeparator", type: "组件", description: "分组、组名和分隔线。" },
  ],
};
