import * as React from "react";
import { FileText, LayoutDashboard, Moon, Plus, Search, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import type { DemoProps } from "../types";

function Items({ run, shortcuts }: { run: (s: string) => void; shortcuts: boolean }) {
  return (
    <CommandList>
      <CommandEmpty>没有找到，换个词试试。</CommandEmpty>
      <CommandGroup heading="跳转">
        <CommandItem onSelect={() => run("打开 仪表盘")}><LayoutDashboard />仪表盘{shortcuts && <CommandShortcut>G D</CommandShortcut>}</CommandItem>
        <CommandItem onSelect={() => run("打开 成员")}><Users />成员{shortcuts && <CommandShortcut>G M</CommandShortcut>}</CommandItem>
        <CommandItem onSelect={() => run("打开 设置")}><Settings />设置{shortcuts && <CommandShortcut>⌘,</CommandShortcut>}</CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="操作">
        <CommandItem onSelect={() => run("新建项目")} keywords={["create", "new", "xinjian"]}><Plus />新建项目{shortcuts && <CommandShortcut>⌘N</CommandShortcut>}</CommandItem>
        <CommandItem onSelect={() => run("切换深色模式")} keywords={["dark", "theme"]}><Moon />切换深色模式</CommandItem>
        <CommandItem onSelect={() => run("打开 2026Q4 对账单.pdf")}><FileText />2026Q4 对账单.pdf</CommandItem>
      </CommandGroup>
    </CommandList>
  );
}

/** 真实场景: 应用顶栏的全局搜索, ⌘K / Ctrl K 打开 */
export default function CommandDemo({ values }: DemoProps) {
  const [open, setOpen] = React.useState(false);
  const run = (s: string) => { setOpen(false); toast(s); };
  const shortcuts = Boolean(values.shortcuts);
  React.useEffect(() => {
    const on = (e: KeyboardEvent) => { if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((v) => !v); } };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  if (values.mode === "inline") {
    return (
      <Command className="w-full max-w-md rounded-2xl border shadow-float">
        <CommandInput placeholder="搜索页面和操作…" />
        <Items run={run} shortcuts={shortcuts} />
      </Command>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex h-10 w-full max-w-sm items-center gap-2 rounded-lg border bg-background/85 px-3 text-sm text-muted-foreground shadow-float backdrop-blur hover:text-foreground">
        <Search className="size-4" /><span className="flex-1 text-left">搜索页面和操作…</span><Kbd>⌘K</Kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="搜索页面和操作…" />
        <Items run={run} shortcuts={shortcuts} />
      </CommandDialog>
    </>
  );
}
