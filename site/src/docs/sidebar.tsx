import * as React from "react";
import { ChevronRight, Search } from "lucide-react";
import { m } from "motion/react";
import { cn } from "@/lib/utils";
import { spring } from "@/motion/presets";
import { SECTIONS, sectionOf } from "./sections";
import { entriesOf } from "./registry";
import { href, type Route } from "./router";
import type { SectionId } from "./types";

type Item = { key: string; label: string; en?: string; href: string; active: boolean; group: string; sub?: string; tag?: string };

// 记住用户展开过的组; 默认全部折叠
const STORE = "hx-docs-expanded";
function useExpanded() {
  const [set, setSet] = React.useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(STORE) || "[]")); } catch { return new Set(); }
  });
  const save = (n: Set<string>) => { try { localStorage.setItem(STORE, JSON.stringify([...n])); } catch { /* 隐私模式 */ } return n; };
  const toggle = (k: string) => setSet((old) => { const n = new Set(old); if (n.has(k)) n.delete(k); else n.add(k); return save(n); });
  // 打开某页时自动展开它所在的组, 之后用户仍可手动折叠
  const reveal = React.useCallback((keys: string[]) => setSet((old) => keys.every((k) => old.has(k)) ? old : save(new Set([...old, ...keys]))), []);
  return [set, toggle, reveal] as const;
}

/** 侧栏只列当前分区. 条目超过 12 个才出现筛选框 */
export function Sidebar({ route, section, onNavigate, showSections }: { route: Route; section: SectionId; onNavigate?: () => void; showSections?: boolean }) {
  const [q, setQ] = React.useState("");
  const [expanded, toggle, reveal] = useExpanded();
  const s = sectionOf(section);
  const items: Item[] = entriesOf(section).map((e) => ({ key: e.slug, label: e.title, en: e.en ?? e.name, href: href.entry(e), active: route.name === "component" && route.slug === e.slug, group: e.group, sub: e.sub }));
  const needle = q.trim().toLowerCase();
  const shown = needle ? items.filter((i) => i.label.toLowerCase().includes(needle) || i.key.includes(needle)) : items;
  const groups = s.groups;
  const active = items.find((i) => i.active);
  React.useEffect(() => {
    if (!active) return;
    reveal(active.sub ? [`${section}:${active.group}`, `${section}:${active.group}:${active.sub}`] : [`${section}:${active.group}`]);
  }, [active?.key, section, reveal]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderItem = (i: Item) => (
    <li key={i.key}>
      <a
        href={i.href}
        onClick={onNavigate}
        aria-current={i.active ? "page" : undefined}
        className={cn(
          "group/item relative -ml-px flex h-8 items-center gap-2 border-l border-transparent pr-2 pl-3 text-sm text-muted-foreground transition-[color,border-color,background-color] duration-150 hover:border-foreground/30 hover:text-foreground",
          "aria-[current=page]:font-medium aria-[current=page]:text-foreground",
        )}
      >
        {/* 选中态是一块会滑动的底: 换页时从上一个位置滑过来 */}
        {i.active && (
          <m.span
            layoutId={`sb-active-${section}`}
            transition={spring.snappy}
            aria-hidden
            className="absolute inset-y-0 -left-px right-0 rounded-r-md border-l-2 border-[var(--cat)] bg-[color-mix(in_oklch,var(--cat)_12%,transparent)]"
          />
        )}
        <span className="relative shrink-0 transition-transform duration-150 group-hover/item:translate-x-0.5">{i.label}</span>
        {/* 中文名完整显示, 英文名放不下时截断 */}
        {i.en && <span className="relative min-w-0 flex-1 truncate text-right font-mono text-[11px] text-muted-foreground">{i.en}</span>}
        {i.tag && <span className="relative rounded border px-1 font-mono text-[10px] text-muted-foreground">{i.tag}</span>}
      </a>
    </li>
  );

  return (
    <nav aria-label={s.title} className="flex h-full flex-col gap-3 p-3" style={{ "--cat": s.color } as React.CSSProperties}>
      {showSections && (
        <div className="grid gap-1 border-b pb-3">
          {SECTIONS.map((x) => (
            <a key={x.id} href={href.section(x.id)} onClick={onNavigate} aria-current={x.id === section ? "true" : undefined} className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 aria-[current]:bg-accent aria-[current]:text-foreground">
              <span aria-hidden className="size-1.5 rounded-full" style={{ background: x.color }} />{x.title}
            </a>
          ))}
        </div>
      )}
      <a href={href.section(section)} onClick={onNavigate} aria-current={route.name === "section" ? "page" : undefined} className="flex h-9 items-center justify-between rounded-lg px-2 text-sm font-medium transition-colors duration-150 hover:bg-accent/60 aria-[current=page]:bg-accent">
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
              // 筛选时强制展开; 其余按用户展开状态, 默认折叠
              open={!!needle || expanded.has(`${section}:${g}`)}
              onToggle={() => toggle(`${section}:${g}`)}
            >
              {list.filter((i) => !i.sub).map(renderItem)}
              {[...new Set(list.map((i) => i.sub).filter(Boolean) as string[])].map((sub) => {
                const subList = list.filter((i) => i.sub === sub);
                return (
                  <li key={sub}>
                    <Group
                      level={2}
                      id={`${section}-${g}-${sub}`}
                      title={sub}
                      count={subList.length}
                      open={!!needle || expanded.has(`${section}:${g}:${sub}`)}
                      onToggle={() => toggle(`${section}:${g}:${sub}`)}
                    >
                      {subList.map(renderItem)}
                    </Group>
                  </li>
                );
              })}
            </Group>
          );
        })}
        {section === "pages" && !items.length && <p className="px-2 py-4 text-sm text-muted-foreground">筹备中。</p>}
      </div>
    </nav>
  );
}

/** 分组标题是按钮 (可折叠), 条目挂在左侧竖线下, 一眼分清 "组" 和 "页" */
function Group({ id, title, count, open, onToggle, children, level = 1 }: { id: string; title: string; count: number; open: boolean; onToggle: () => void; children: React.ReactNode; level?: 1 | 2 }) {
  const listId = `grp-${id.replace(/\s+/g, "-")}`;
  return (
    <div className={level === 1 ? "mt-2 first:mt-0" : "mt-0.5"}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={listId}
        className={cn("group flex h-8 w-full items-center gap-1.5 rounded-md px-1.5 text-[13px] text-foreground transition-colors duration-150 hover:bg-accent/60 active:bg-accent", level === 1 ? "font-semibold" : "pl-2.5 font-medium text-foreground/90")}
      >
        <ChevronRight aria-hidden className={cn("size-3.5 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none", open && "rotate-90")} />
        <span className="flex-1 text-left">{title}</span>
        <span className="font-mono text-[11px] font-normal text-muted-foreground">{count}</span>
      </button>
      {/* 高度动画: grid-template-rows 0fr ↔ 1fr, 不用测量高度; 收起时 inert, 键盘和读屏都跳过 */}
      <div
        className={cn("grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
        inert={!open || undefined}
      >
        <div id={listId} className="min-h-0 overflow-hidden">
          <ul className={cn("mt-0.5 mb-1 border-l", level === 1 ? "ml-[13px]" : "ml-[22px]")}>{children}</ul>
        </div>
      </div>
    </div>
  );
}
