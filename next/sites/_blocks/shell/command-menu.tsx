import * as React from "react";
import { Search } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

export interface CommandEntry {
  id: string;
  label: string;
  group?: string;
  icon?: React.ComponentType<{ className?: string }>;
  keywords?: string[];
  onSelect: () => void;
}

/** ⌘K / Ctrl+K 命令面板 + 触发按钮. */
export function CommandMenu({ entries, placeholder = "搜索页面与操作…", className }: { entries: CommandEntry[]; placeholder?: string; className?: string }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  const groups = React.useMemo(() => {
    const m = new Map<string, CommandEntry[]>();
    for (const e of entries) m.set(e.group ?? "", [...(m.get(e.group ?? "") ?? []), e]);
    return [...m];
  }, [entries]);
  const mac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("inline-flex h-9 w-full max-w-64 items-center gap-2 rounded-lg border bg-background/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent", className)}
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">搜索…</span>
        <Kbd>{mac ? "⌘" : "Ctrl"} K</Kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={placeholder} />
        <CommandList>
          <CommandEmpty>没有匹配项</CommandEmpty>
          {groups.map(([g, items]) => (
            <CommandGroup key={g} heading={g || undefined}>
              {items.map((it) => (
                <CommandItem
                  key={it.id}
                  value={[it.label, ...(it.keywords ?? [])].join(" ")}
                  onSelect={() => {
                    setOpen(false);
                    it.onSelect();
                  }}
                >
                  {it.icon && <it.icon className="size-4" />}
                  {it.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
