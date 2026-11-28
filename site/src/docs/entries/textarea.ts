import type { DocEntry } from "../types";

export const textarea: DocEntry = {
  slug: "textarea",
  name: "Textarea",
  title: "多行输入",
  section: "ui",
  group: "表单",
  description: "多行文本。默认随内容长高（field-sizing），用 min-h / max-h 限定范围；字数放在 Field 的 aside 里。",
  file: "src/components/ui/textarea.tsx",
  importFrom: "@/components/ui/textarea",
  demo: () => import("./textarea.demo"),
  source: () => import("@/components/ui/textarea.tsx?raw").then((m) => m.default),
  defaults: { autoGrow: true, counter: true, maxLength: 200, error: false },
  componentDefaults: {},
  presets: [
    { label: "自动增高", values: { autoGrow: true } },
    { label: "固定高度", values: { autoGrow: false } },
    { label: "字数很紧", values: { maxLength: 20, counter: true } },
  ],
  demoOnly: ["error"],
  controls: [
    { type: "toggle", key: "autoGrow", label: "自动增高" },
    { type: "toggle", key: "counter", label: "字数" },
    { type: "number", key: "maxLength", label: "字数上限", min: 10, max: 500, step: 10 },
  ],
  usage: (v) => {
    const cls = v.autoGrow ? `className="min-h-24 max-h-60"` : `className="h-28 resize-none [field-sizing:fixed]"`;
    const aside = v.counter ? `\n      aside={\`\${text.length}/${v.maxLength}\`}\n      error={text.length > ${v.maxLength} ? "超出字数" : undefined}` : "";
    return `import * as React from "react";\nimport { Field } from "@/components/ui/field";\nimport { Textarea } from "@/components/ui/textarea";\n\nexport function Feedback() {\n  const [text, setText] = React.useState("");\n  return (\n    <Field\n      label="问题描述"${aside}\n    >\n      <Textarea value={text} onChange={(e) => setText(e.target.value)} ${cls} />\n    </Field>\n  );\n}\n`;
  },
  props: [
    { name: "className", type: "string", description: "min-h / max-h 控制自动增高的范围；加 [field-sizing:fixed] 关掉自动增高。" },
    { name: "...textarea", type: "ComponentProps<\"textarea\">", description: "原生 textarea 的全部属性。" },
  ],
};
