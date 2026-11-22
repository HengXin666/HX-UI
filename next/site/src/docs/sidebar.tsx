import * as React from "react";
import { Box, LayoutGrid, Layers, MousePointerClick, Search, Type, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "./categories";
import { ENTRIES } from "./registry";
import { href, type Route } from "./router";
import type { CategoryId } from "./types";

const ICONS: Record<CategoryId, React.ComponentType<{ className?: string }>> = {
  text: Type,
  motion: Wand2,
  background: Layers,
  interaction: MousePointerClick,
  foundation: Box,
};

type Item = { key: string; label: string; href: string; active: boolean; category: CategoryId; tag?: string };

export function Sidebar({ route, onNavigate }: { route: Route; onNavigate?: () => void }) {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState<CategoryId | null>(null);
  const input = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items: Item[] = [
    ...ENTRIES.map((e) => ({ key: e.slug, label: e.title, sub: e.name, href: href.component(e.slug), active: route.name === "component" && route.slug === e.slug, category: e.category })),
    { key: "foundation", label: "基础件合集", href: href.foundation, active: route.name === "foundation", category: "foundation" as const, tag: "待拆分" },
  ];
  const needle = q.trim().toLowerCase();
  const shown = items.filter((i) => (!cat || i.category === cat) && (!needle || i.label.toLowerCase().includes(needle) || i.key.includes(needle)));

  return (
    <nav aria-label="组件" className="flex h-full flex-col gap-3 p-3">
      <a
        href={href.overview}
        onClick={onNavigate}
        aria-current={route.name === "overview" ? "page" : undefined}
        className="flex h-9 items-center gap-2 rounded-lg border bg-card/60 px-3 text-sm font-medium hover:bg-accent aria-[current=page]:bg-accent"
      >
        <LayoutGrid className="size-4" />全部组件
      </a>
      <div role="group" aria-label="按分类筛选" className="grid grid-cols-5 gap-1 rounded-lg border p-1">
        {CATEGORIES.map((c) => {
          const Icon = ICONS[c.id];
          return (
            <button
              key={c.id}
              type="button"
              title={c.title}
              aria-label={c.title}
              aria-pressed={cat === c.id}
              onClick={() => setCat((v) => (v === c.id ? null : c.id))}
              style={{ "--cat": c.color } as React.CSSProperties}
              className="grid h-8 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-[color-mix(in_oklch,var(--cat)_18%,transparent)] aria-pressed:text-[var(--cat-ink)]"
            >
              <Icon className="size-4" />
            </button>
          );
        })}
      </div>
      <label className="relative block">
        <span className="sr-only">筛选组件</span>
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`筛选 ${items.length} 个组件…`}
          className="h-9 w-full rounded-lg border bg-transparent pr-9 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border px-1.5 font-mono text-[10px] text-muted-foreground">/</kbd>
      </label>
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-6">
        {CATEGORIES.map((c) => {
          const list = shown.filter((i) => i.category === c.id);
          if (!list.length) return null;
          return (
            <div key={c.id} className="mt-4 first:mt-1" style={{ "--cat": c.color } as React.CSSProperties}>
              <p className="mb-1 flex items-center gap-2 px-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                <span aria-hidden className="size-1.5 rounded-full bg-[var(--cat)]" />{c.no} {c.title}
              </p>
              <ul>
                {list.map((i) => (
                  <li key={i.key}>
                    <a
                      href={i.href}
                      onClick={onNavigate}
                      aria-current={i.active ? "page" : undefined}
                      className={cn(
                        "relative flex h-8 items-center justify-between rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
                        "aria-[current=page]:bg-[color-mix(in_oklch,var(--cat)_14%,transparent)] aria-[current=page]:text-foreground",
                      )}
                    >
                      {i.active && <span aria-hidden className="absolute inset-y-1.5 -left-1 w-0.5 rounded-full bg-[var(--cat)]" />}
                      {i.label}
                      {i.tag && <span className="rounded border px-1 font-mono text-[10px] text-muted-foreground">{i.tag}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {!shown.length && <p className="px-2 py-6 text-sm text-muted-foreground">没有匹配「{q}」的组件。</p>}
      </div>
    </nav>
  );
}
