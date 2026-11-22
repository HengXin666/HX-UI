import * as React from "react";
import { ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTIONS, sectionOf } from "./sections";
import { entriesOf } from "./registry";
import { href, type Route } from "./router";
import type { SectionId } from "./types";

type Item = { key: string; label: string; en?: string; href: string; active: boolean; group: string; tag?: string };

const STORE = "hx-docs-collapsed";
function useCollapsed() {
  const [set, setSet] = React.useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(STORE) || "[]")); } catch { return new Set(); }
  });
  const toggle = (k: string) => setSet((old) => {
    const n = new Set(old); if (n.has(k)) n.delete(k); else n.add(k);
    try { localStorage.setItem(STORE, JSON.stringify([...n])); } catch { /* 隐私模式 */ }
    return n;
  });
  return [set, toggle] as const;
}

/** 侧栏只列当前分区. 条目超过 12 个才出现筛选框 */
export function Sidebar({ route, section, onNavigate, showSections }: { route: Route; section: SectionId; onNavigate?: () => void; showSections?: boolean }) {
  const [q, setQ] = React.useState("");
  const [collapsed, toggle] = useCollapsed();
  const s = sectionOf(section);
  const items: Item[] = entriesOf(section).map((e) => ({ key: e.slug, label: e.title, en: e.name, href: href.entry(e), active: route.name === "component" && route.slug === e.slug, group: e.group }));
  if (section === "ui") items.push({ key: "foundation", label: "更多基础件", href: href.foundation, active: route.name === "foundation", group: "未整理", tag: "待拆分" });
  const needle = q.trim().toLowerCase();
  const shown = needle ? items.filter((i) => i.label.toLowerCase().includes(needle) || i.key.includes(needle)) : items;
  const groups = [...s.groups, "未整理"];

  return (
    <nav aria-label={s.title} className="flex h-full flex-col gap-3 p-3" style={{ "--cat": s.color } as React.CSSProperties}>
      {showSections && (
        <div className="grid gap-1 border-b pb-3">
          {SECTIONS.map((x) => (
            <a key={x.id} href={href.section(x.id)} onClick={onNavigate} aria-current={x.id === section ? "true" : undefined} className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground aria-[current]:bg-accent aria-[current]:text-foreground">
              <span aria-hidden className="size-1.5 rounded-full" style={{ background: x.color }} />{x.title}
            </a>
          ))}
        </div>
      )}
      <a href={href.section(section)} onClick={onNavigate} aria-current={route.name === "section" ? "page" : undefined} className="flex h-9 items-center justify-between rounded-lg px-2 text-sm font-medium hover:bg-accent/60 aria-[current=page]:bg-accent">
        {s.title}总览<span className="font-mono text-xs text-muted-foreground">{entriesOf(section).length}</span>
      </a>
      {items.length > 12 && (
        <label className="relative block">
          <span className="sr-only">筛选</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="筛选…" className="h-9 w-full rounded-lg border bg-transparent pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
        </label>
      )}
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-6">
        {groups.map((g) => {
          const list = shown.filter((i) => i.group === g);
          if (!list.length) return null;
          return (
            <Group
              key={g}
              id={`${section}-${g}`}
              title={g}
              count={list.length}
              // 筛选时或当前页在组里时强制展开
              open={!!needle || list.some((i) => i.active) || !collapsed.has(`${section}:${g}`)}
              onToggle={() => toggle(`${section}:${g}`)}
            >
              {list.map((i) => (
                <li key={i.key}>
                  <a
                    href={i.href}
                    onClick={onNavigate}
                    aria-current={i.active ? "page" : undefined}
                    className={cn(
                      "relative -ml-px flex h-8 items-center gap-2 border-l border-transparent pr-2 pl-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground",
                      "aria-[current=page]:border-[var(--cat)] aria-[current=page]:bg-[color-mix(in_oklch,var(--cat)_12%,transparent)] aria-[current=page]:font-medium aria-[current=page]:text-foreground",
                    )}
                  >
                    <span className="flex-1 truncate">{i.label}</span>
                    {i.en && <span className="font-mono text-[11px] text-muted-foreground">{i.en}</span>}
                    {i.tag && <span className="rounded border px-1 font-mono text-[10px] text-muted-foreground">{i.tag}</span>}
                  </a>
                </li>
              ))}
            </Group>
          );
        })}
        {section === "pages" && !items.length && <p className="px-2 py-4 text-sm text-muted-foreground">筹备中。</p>}
      </div>
    </nav>
  );
}

/** 分组标题是按钮 (可折叠), 条目挂在左侧竖线下, 一眼分清 "组" 和 "页" */
function Group({ id, title, count, open, onToggle, children }: { id: string; title: string; count: number; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  const listId = `grp-${id}`;
  return (
    <div className="mt-2 first:mt-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={listId}
        className="group flex h-8 w-full items-center gap-1.5 rounded-md px-1.5 text-[13px] font-semibold text-foreground hover:bg-accent/60"
      >
        <ChevronRight aria-hidden className={cn("size-3.5 text-muted-foreground transition-transform motion-reduce:transition-none", open && "rotate-90")} />
        <span className="flex-1 text-left">{title}</span>
        <span className="font-mono text-[11px] font-normal text-muted-foreground">{count}</span>
      </button>
      <ul id={listId} hidden={!open} className="mt-0.5 mb-1 ml-[13px] border-l">
        {children}
      </ul>
    </div>
  );
}
