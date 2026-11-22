import type { DocEntry } from "../types";

export const tooltip: DocEntry = {
  slug: "tooltip",
  name: "Tooltip",
  title: "提示气泡",
  section: "ui",
  group: "展示",
  description: "悬停或键盘聚焦时的一句说明，给只有图标的按钮用。里面只放文字和快捷键，不放可点的东西（那用气泡卡片）。触屏上不会出现，所以按钮本身要有 aria-label。",
  file: "src/components/ui/tooltip.tsx",
  importFrom: "@/components/ui/tooltip",
  demo: () => import("./tooltip.demo"),
  source: () => import("@/components/ui/tooltip.tsx?raw").then((m) => m.default),
  defaults: { side: "top", delay: 300, shortcut: true },
  componentDefaults: {},
  presets: [
    { label: "带快捷键", values: { shortcut: true } },
    { label: "只有文字", values: { shortcut: false } },
    { label: "下方", values: { side: "bottom" } },
  ],
  controls: [
    { type: "select", key: "side", label: "方向", options: [{ value: "top", label: "上" }, { value: "bottom", label: "下" }, { value: "left", label: "左" }, { value: "right", label: "右" }] },
    { type: "number", key: "delay", label: "延迟", min: 0, max: 1000, step: 50, unit: "ms" },
    { type: "toggle", key: "shortcut", label: "快捷键" },
  ],
  usage: (v) => `import { Bold } from "lucide-react";\nimport { Button } from "@/components/ui/button";\n${v.shortcut ? `import { Kbd } from "@/components/ui/kbd";\n` : ""}import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";\n\n// 应用根部包一次 TooltipProvider\nexport function BoldButton() {\n  return (\n    <TooltipProvider delayDuration={${v.delay}}>\n      <Tooltip>\n        <TooltipTrigger asChild>\n          <Button variant="ghost" size="icon" aria-label="粗体"><Bold /></Button>\n        </TooltipTrigger>\n        <TooltipContent${v.side !== "top" ? ` side="${v.side}"` : ""}>粗体${v.shortcut ? " <Kbd>⌘B</Kbd>" : ""}</TooltipContent>\n      </Tooltip>\n    </TooltipProvider>\n  );\n}\n`,
  props: [
    { name: "TooltipProvider.delayDuration", type: "number", default: "0", description: "悬停多久出现；一组按钮之间移动时不再等待。" },
    { name: "TooltipContent.side / align", type: '"top" | "bottom" | "left" | "right"', default: '"top"', description: "方向，空间不够自动翻转。" },
    { name: "TooltipContent.sideOffset", type: "number", default: "0", description: "离触发元素的距离。" },
    { name: "Tooltip.open / onOpenChange", type: "boolean", description: "受控显示。" },
  ],
};
