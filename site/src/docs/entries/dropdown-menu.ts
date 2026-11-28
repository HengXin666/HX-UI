import type { DocEntry } from "../types";

export const dropdownMenu: DocEntry = {
  slug: "dropdown-menu",
  name: "DropdownMenu",
  title: "下拉菜单",
  section: "ui",
  group: "操作",
  description: "把一行里放不下的操作收进「更多」。支持分组、快捷键提示、勾选项、单选项和二级菜单；方向键选择，输入首字跳转，Esc 关闭。",
  file: "src/components/ui/dropdown-menu.tsx",
  importFrom: "@/components/ui/dropdown-menu",
  demo: () => import("./dropdown-menu.demo"),
  source: () => import("@/components/ui/dropdown-menu.tsx?raw").then((m) => m.default),
  defaults: { align: "end", label: true, shortcuts: true, sub: true },
  componentDefaults: {},
  presets: [
    { label: "完整", values: { label: true, shortcuts: true, sub: true } },
    { label: "精简", values: { label: false, shortcuts: false, sub: false } },
  ],
  controls: [
    { type: "select", key: "align", label: "对齐", options: [{ value: "end", label: "右" }, { value: "start", label: "左" }, { value: "center", label: "中" }] },
    { type: "toggle", key: "label", label: "分组名" },
    { type: "toggle", key: "shortcuts", label: "快捷键" },
    { type: "toggle", key: "sub", label: "二级菜单" },
  ],
  usage: (v) => `import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";\nimport { Button } from "@/components/ui/button";\nimport { DropdownMenu, DropdownMenuContent, DropdownMenuItem, ${v.label ? "DropdownMenuLabel, " : ""}DropdownMenuSeparator, ${v.shortcuts ? "DropdownMenuShortcut, " : ""}DropdownMenuTrigger } from "@/components/ui/dropdown-menu";\n\nexport function FileActions() {\n  return (\n    <DropdownMenu>\n      <DropdownMenuTrigger asChild>\n        <Button variant="ghost" size="icon" aria-label="更多操作"><MoreHorizontal /></Button>\n      </DropdownMenuTrigger>\n      <DropdownMenuContent${v.align !== "center" ? ` align="${v.align}"` : ""}>${v.label ? "\n        <DropdownMenuLabel>文件</DropdownMenuLabel>" : ""}\n        <DropdownMenuItem onSelect={rename}><Pencil />重命名${v.shortcuts ? "<DropdownMenuShortcut>F2</DropdownMenuShortcut>" : ""}</DropdownMenuItem>\n        <DropdownMenuSeparator />\n        <DropdownMenuItem variant="destructive" onSelect={remove}><Trash2 />删除</DropdownMenuItem>\n      </DropdownMenuContent>\n    </DropdownMenu>\n  );\n}\n`,
  props: [
    { name: "DropdownMenuContent.align / side", type: '"start" | "center" | "end" / "top" | "bottom" …', default: '"center" / "bottom"', description: "相对按钮的位置，空间不够自动翻转。" },
    { name: "DropdownMenuItem.onSelect", type: "(e: Event) => void", description: "选中时调用；e.preventDefault() 可保持菜单打开。" },
    { name: "DropdownMenuItem.variant", type: '"default" | "destructive"', default: '"default"', description: "危险操作标红。" },
    { name: "DropdownMenuCheckboxItem", type: "{ checked, onCheckedChange }", description: "可勾选的项。" },
    { name: "DropdownMenuRadioGroup / RadioItem", type: "{ value, onValueChange }", description: "一组里选一个。" },
    { name: "DropdownMenuSub / SubTrigger / SubContent", type: "组件", description: "二级菜单，→ 键展开。" },
    { name: "DropdownMenuShortcut / Label / Separator / Group", type: "组件", description: "快捷键提示、分组名、分隔线、分组。" },
  ],
};
