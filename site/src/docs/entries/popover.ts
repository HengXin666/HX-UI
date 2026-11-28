import type { DocEntry } from "../types";

export const popover: DocEntry = {
  slug: "popover",
  name: "Popover",
  title: "气泡卡片",
  section: "ui",
  group: "展示",
  description: "点击打开的轻量浮层，可以放输入框、开关、按钮。比对话框轻：不遮挡页面，点外部或 Esc 关闭，焦点回到触发按钮。",
  file: "src/components/ui/popover.tsx",
  importFrom: "@/components/ui/popover",
  demo: () => import("./popover.demo"),
  source: () => import("@/components/ui/popover.tsx?raw").then((m) => m.default),
  defaults: { side: "bottom", align: "center" },
  componentDefaults: {},
  presets: [
    { label: "下方居中", values: { side: "bottom", align: "center" } },
    { label: "右对齐", values: { side: "bottom", align: "end" } },
    { label: "上方", values: { side: "top", align: "center" } },
  ],
  controls: [
    { type: "select", key: "side", label: "方向", options: [{ value: "bottom", label: "下" }, { value: "top", label: "上" }, { value: "left", label: "左" }, { value: "right", label: "右" }] },
    { type: "select", key: "align", label: "对齐", options: [{ value: "center", label: "中" }, { value: "start", label: "起点" }, { value: "end", label: "终点" }] },
  ],
  usage: (v) => `import { Button } from "@/components/ui/button";\nimport { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";\n\nexport function SharePopover() {\n  return (\n    <Popover>\n      <PopoverTrigger asChild>\n        <Button variant="outline">分享</Button>\n      </PopoverTrigger>\n      <PopoverContent${v.side !== "bottom" ? ` side="${v.side}"` : ""}${v.align !== "center" ? ` align="${v.align}"` : ""} className="w-80">\n        <PopoverHeader>\n          <PopoverTitle>分享「2026Q4 对账单」</PopoverTitle>\n          <PopoverDescription>拿到链接的人可以查看。</PopoverDescription>\n        </PopoverHeader>\n        {/* 输入框、开关… */}\n      </PopoverContent>\n    </Popover>\n  );\n}\n`,
  props: [
    { name: "Popover.open / onOpenChange", type: "boolean / (open) => void", description: "受控打开。" },
    { name: "PopoverContent.side / align", type: '"top" | "bottom" | "left" | "right" / "start" | "center" | "end"', default: '"bottom" / "center"', description: "位置，空间不够自动翻转。" },
    { name: "PopoverContent.sideOffset", type: "number", default: "4", description: "离触发元素的距离。" },
    { name: "PopoverHeader / Title / Description", type: "组件", description: "标题和说明。" },
    { name: "PopoverAnchor", type: "组件", description: "让浮层对齐到别的元素。" },
  ],
};
