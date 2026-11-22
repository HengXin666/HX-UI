import type { DocEntry } from "../types";

export const sheet: DocEntry = {
  slug: "sheet",
  name: "Sheet",
  title: "抽屉",
  section: "ui",
  group: "反馈",
  description: "从边缘滑出的面板。列表进详情、筛选面板、移动端菜单用它，看完关掉列表还在原处。焦点锁在面板内，Esc 关闭。",
  file: "src/components/ui/sheet.tsx",
  importFrom: "@/components/ui/sheet",
  demo: () => import("./sheet.demo"),
  source: () => import("@/components/ui/sheet.tsx?raw").then((m) => m.default),
  defaults: { side: "right", footer: true },
  componentDefaults: {},
  presets: [
    { label: "右侧详情", values: { side: "right", footer: true } },
    { label: "底部面板", values: { side: "bottom", footer: true } },
    { label: "左侧菜单", values: { side: "left", footer: false } },
  ],
  controls: [
    { type: "select", key: "side", label: "方向", options: [{ value: "right", label: "右" }, { value: "left", label: "左" }, { value: "bottom", label: "下" }, { value: "top", label: "上" }] },
    { type: "toggle", key: "footer", label: "底部按钮" },
  ],
  usage: (v) => `import { Button } from "@/components/ui/button";\nimport { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";\n\nexport function OrderSheet() {\n  return (\n    <Sheet>\n      <SheetTrigger asChild>\n        <Button variant="outline">订单 TL-20518</Button>\n      </SheetTrigger>\n      <SheetContent${v.side !== "right" ? ` side="${v.side}"` : ""}>\n        <SheetHeader>\n          <SheetTitle>订单 TL-20518</SheetTitle>\n          <SheetDescription>林晓 · 2026-11-22 14:32</SheetDescription>\n        </SheetHeader>\n        {/* 详情 */}${v.footer ? `\n        <SheetFooter>\n          <SheetClose asChild><Button variant="outline">关闭</Button></SheetClose>\n          <Button>去发货</Button>\n        </SheetFooter>` : ""}\n      </SheetContent>\n    </Sheet>\n  );\n}\n`,
  props: [
    { name: "Sheet.open / onOpenChange", type: "boolean / (open) => void", description: "受控打开。" },
    { name: "SheetContent.side", type: '"right" | "left" | "bottom" | "top"', default: '"right"', description: "从哪边滑出。" },
    { name: "SheetHeader / SheetTitle / SheetDescription", type: "组件", description: "标题必填（读屏需要），说明可选。" },
    { name: "SheetFooter / SheetClose", type: "组件", description: "底部操作和关闭按钮。" },
  ],
};
