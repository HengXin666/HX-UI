import type { DocEntry } from "../types";

export const command: DocEntry = {
  slug: "command",
  name: "Command",
  title: "命令面板",
  section: "ui",
  group: "操作",
  description: "⌘K 打开的全局搜索：跳页面、执行操作、找文件。输入即筛选，keywords 让拼音或英文也能搜到；方向键选择，回车执行。也可以直接嵌在页面里当可搜索列表。",
  file: "src/components/ui/command.tsx",
  importFrom: "@/components/ui/command",
  demo: () => import("./command.demo"),
  source: () => import("@/components/ui/command.tsx?raw").then((m) => m.default),
  defaults: { mode: "dialog", shortcuts: true },
  componentDefaults: {},
  presets: [
    { label: "⌘K 弹窗", values: { mode: "dialog" } },
    { label: "嵌入页面", values: { mode: "inline" } },
  ],
  controls: [
    { type: "select", key: "mode", label: "形式", options: [{ value: "dialog", label: "弹窗" }, { value: "inline", label: "嵌入" }] },
    { type: "toggle", key: "shortcuts", label: "快捷键" },
  ],
  usage: (v) => v.mode === "inline"
    ? `import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";\n\nexport function PageSearch() {\n  return (\n    <Command className="rounded-xl border">\n      <CommandInput placeholder="搜索页面和操作…" />\n      <CommandList>\n        <CommandEmpty>没有找到。</CommandEmpty>\n        <CommandGroup heading="跳转">\n          <CommandItem onSelect={() => go("/dashboard")}>仪表盘</CommandItem>\n        </CommandGroup>\n      </CommandList>\n    </Command>\n  );\n}\n`
    : `import * as React from "react";\nimport { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList${v.shortcuts ? ", CommandShortcut" : ""} } from "@/components/ui/command";\n\nexport function CommandMenu() {\n  const [open, setOpen] = React.useState(false);\n  React.useEffect(() => {\n    const on = (e: KeyboardEvent) => {\n      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((v) => !v); }\n    };\n    window.addEventListener("keydown", on);\n    return () => window.removeEventListener("keydown", on);\n  }, []);\n  return (\n    <CommandDialog open={open} onOpenChange={setOpen}>\n      <CommandInput placeholder="搜索页面和操作…" />\n      <CommandList>\n        <CommandEmpty>没有找到。</CommandEmpty>\n        <CommandGroup heading="操作">\n          <CommandItem keywords={["new", "create"]} onSelect={createProject}>新建项目${v.shortcuts ? "<CommandShortcut>⌘N</CommandShortcut>" : ""}</CommandItem>\n        </CommandGroup>\n      </CommandList>\n    </CommandDialog>\n  );\n}\n`,
  props: [
    { name: "CommandDialog.open / onOpenChange", type: "boolean / (open) => void", description: "弹窗形式；title / description 给读屏，默认「命令面板」。" },
    { name: "CommandInput.placeholder", type: "string", description: "输入即筛选。" },
    { name: "CommandItem.onSelect", type: "(value: string) => void", description: "回车或点击时执行。" },
    { name: "CommandItem.keywords", type: "string[]", description: "额外的搜索词，如拼音、英文。" },
    { name: "CommandGroup.heading", type: "ReactNode", description: "分组名。" },
    { name: "CommandEmpty / CommandSeparator / CommandShortcut", type: "组件", description: "无结果提示、分隔线、快捷键提示。" },
    { name: "Command.filter / shouldFilter", type: "函数 / boolean", description: "自定义排序；远程搜索时设 shouldFilter={false}。" },
  ],
};
