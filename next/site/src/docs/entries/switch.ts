import type { DocEntry } from "../types";

export const switchEntry: DocEntry = {
  slug: "switch",
  name: "Switch",
  title: "开关",
  section: "ui",
  group: "表单",
  description: "立即生效的二选一，比如设置项。需要点「保存」才生效的选项用复选框。",
  file: "src/components/ui/switch.tsx",
  importFrom: "@/components/ui/switch",
  demo: () => import("./switch.demo"),
  source: () => import("@/components/ui/switch.tsx?raw").then((m) => m.default),
  defaults: { size: "default", descriptions: true, disabled: false },
  componentDefaults: {},
  presets: [
    { label: "设置列表", values: { size: "default", descriptions: true, disabled: false } },
    { label: "紧凑", values: { size: "sm", descriptions: false } },
    { label: "禁用", values: { disabled: true } },
  ],
  controls: [
    { type: "select", key: "size", label: "尺寸", options: [{ value: "sm", label: "小" }, { value: "default", label: "中" }] },
    { type: "toggle", key: "descriptions", label: "说明" },
    { type: "toggle", key: "disabled", label: "禁用" },
  ],
  usage: (v) => `import { Label } from "@/components/ui/label";\nimport { Switch } from "@/components/ui/switch";\n\nexport function TwoFactor() {\n  return (\n    <div className="flex items-center justify-between gap-6">\n      <div className="grid gap-1">\n        <Label htmlFor="2fa">两步验证</Label>${v.descriptions ? `\n        <p id="2fa-d" className="text-sm text-muted-foreground">登录时额外输入验证码。</p>` : ""}\n      </div>\n      <Switch id="2fa"${v.size !== "default" ? ` size="${v.size}"` : ""}${v.descriptions ? ` aria-describedby="2fa-d"` : ""}${v.disabled ? " disabled" : ""} defaultChecked />\n    </div>\n  );\n}\n`,
  props: [
    { name: "checked / defaultChecked", type: "boolean", description: "开或关。" },
    { name: "onCheckedChange", type: "(checked: boolean) => void", description: "切换时调用；在这里直接保存设置。" },
    { name: "size", type: '"sm" | "default"', default: '"default"', description: "尺寸。" },
    { name: "disabled", type: "boolean", default: "false", description: "禁用；放在 Field 里时跟随 Field.disabled。" },
  ],
};
