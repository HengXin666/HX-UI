import type { DocEntry } from "../types";

export const datePicker: DocEntry = {
  slug: "date-picker",
  name: "DatePicker",
  title: "日期选择",
  section: "ui",
  group: "表单",
  description: "点开日历选日期，中文星期和月份。DatePicker 选一天，选完自动关闭；DateRangePicker 选一段，带「最近 7 天」这类快捷区间和双月日历。可清除，可禁用过去的日期，放进 Field 自动连好标签。",
  file: "src/components/ui/date-picker.tsx",
  importFrom: "@/components/ui/date-picker",
  demo: () => import("./date-picker.demo"),
  source: () => import("@/components/ui/date-picker.tsx?raw").then((m) => m.default),
  defaults: { mode: "single", noPast: true, presets: true, months: 2 },
  componentDefaults: {},
  presets: [
    { label: "单日", values: { mode: "single" } },
    { label: "区间", values: { mode: "range", presets: true } },
  ],
  controls: [
    { type: "select", key: "mode", label: "模式", options: [{ value: "single", label: "单日" }, { value: "range", label: "区间" }] },
    { type: "toggle", key: "noPast", label: "禁用过去" },
    { type: "toggle", key: "presets", label: "快捷区间" },
    { type: "number", key: "months", label: "月份数", min: 1, max: 2, step: 1 },
  ],
  usage: (v) => v.mode === "range"
    ? `import * as React from "react";\nimport { Field } from "@/components/ui/field";\nimport { DateRangePicker, type DateRange } from "@/components/ui/date-picker";\n\nexport function ReportRange() {\n  const [range, setRange] = React.useState<DateRange>();\n  return (\n    <Field label="时间范围">\n      <DateRangePicker value={range} onChange={setRange}${v.presets ? "" : " presets={[]}"}${Number(v.months) !== 2 ? ` months={${v.months}}` : ""} />\n    </Field>\n  );\n}\n`
    : `import * as React from "react";\nimport { Field } from "@/components/ui/field";\nimport { DatePicker } from "@/components/ui/date-picker";\n\nexport function InstallDate() {\n  const [date, setDate] = React.useState<Date>();\n  return (\n    <Field label="上门日期" required>\n      <DatePicker value={date} onChange={setDate}${v.noPast ? " disabledDays={{ before: new Date() }}" : ""} />\n    </Field>\n  );\n}\n`,
  props: [
    { name: "value / onChange", type: "Date | DateRange", description: "选中的日期或区间。" },
    { name: "placeholder", type: "string", default: '"选择日期"', description: "没选时的文字。" },
    { name: "disabledDays", type: "Matcher", description: "不可选的日期，如 { before: new Date() }、{ dayOfWeek: [0, 6] }。" },
    { name: "clearable", type: "boolean", default: "true", description: "右侧显示清除按钮。" },
    { name: "presets (区间)", type: "{ label, range: () => DateRange }[]", default: "RANGE_PRESETS", description: "快捷区间；传 [] 关闭。" },
    { name: "months (区间)", type: "number", default: "2", description: "并排几个月。" },
    { name: "Calendar", type: "组件", description: "只要日历本身时直接用，默认中文。" },
  ],
};
