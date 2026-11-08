import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, cn } from "@hx/ui";
import { CATEGORIES, COMPONENTS, categoryOf } from "../catalog";
import { CARD, ICON, ICON_XS } from "../constants";
import { Thumb } from "./Thumb";

const SORT = { catalog: "catalog", name: "name", tunable: "tunable" } as const;
type SortId = (typeof SORT)[keyof typeof SORT];
const SORT_LABEL: Record<SortId, string> = { catalog: "目录顺序", name: "名称", tunable: "可调优先" };
const FIELD = "h-9 rounded-xl border border-border/60 bg-muted/30 text-[13px]";
const SLASH = "/";

/** 组件索引, 对标 reactbits /get-started/index: 搜索 (按 / 聚焦), 分类下拉, 排序, 三列缩略卡. */
export function IndexPage({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0].id);
  const [sort, setSort] = useState<SortId>(SORT.catalog);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (event.key !== SLASH || target?.closest("input, textarea, [contenteditable=true]")) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const match = CATEGORIES.find((item) => item.id === category) ?? CATEGORIES[0];
    const list = COMPONENTS.filter(
      (entry) => match.match(entry.group) && (!needle || [entry.label, entry.id, entry.desc, entry.group].some((field) => field.toLowerCase().includes(needle))),
    );
    if (sort === SORT.name) return [...list].sort((a, b) => a.label.localeCompare(b.label, "zh-Hans-CN"));
    if (sort === SORT.tunable) return [...list].sort((a, b) => Number(Boolean(b.spec)) - Number(Boolean(a.spec)));
    return list;
  }, [query, category, sort]);

  return (
    <div className="flex flex-col">
      <h1 className="text-[34px] leading-tight font-bold tracking-[-0.03em] text-foreground">组件</h1>
      <div className="mt-8 flex flex-wrap items-center gap-2.5">
        <label className={cn(FIELD, "flex w-full items-center gap-2 px-3 text-muted-foreground focus-within:border-ring/60 sm:w-[220px]")}>
          <span aria-hidden className={cn(ICON.search, ICON_XS)} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索..."
            aria-label="搜索组件"
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 font-mono text-[11px] leading-5">{SLASH}</kbd>
        </label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="分类" className={cn(FIELD, "h-9 w-[180px] px-3 font-medium")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.id === CATEGORIES[0].id ? "全部组件" : item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(next) => setSort(next as SortId)}>
          <SelectTrigger aria-label="排序" className={cn(FIELD, "h-9 w-[130px] px-3 font-medium")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(SORT).map((id) => (
              <SelectItem key={id} value={id}>
                {SORT_LABEL[id]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-[12px] text-muted-foreground">{items.length} 个</span>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#/${entry.id}`}
              onClick={(event) => {
                if (event.button !== 0 || event.metaKey || event.ctrlKey) return;
                event.preventDefault();
                onGo(entry.id);
              }}
              className={cn(CARD, "group block p-1.5 transition-colors hover:border-ring/50")}
            >
              <div className="relative aspect-[220/188] overflow-hidden rounded-xl bg-background">
                <Thumb entry={entry} />
                {entry.spec ? (
                  <span className="absolute top-2.5 left-2.5 rounded-md bg-primary/20 px-1.5 text-[10.5px] leading-5 font-semibold tracking-wide text-primary">可调</span>
                ) : null}
              </div>
              <div className="px-2.5 pt-3.5 pb-2.5">
                <p className="truncate text-[14.5px] font-semibold text-foreground">{entry.label}</p>
                <p className="mt-1 truncate text-[11px] tracking-[0.08em] text-muted-foreground">
                  {categoryOf(entry.group).label === entry.group ? entry.group : `${categoryOf(entry.group).label} · ${entry.group}`}
                </p>
              </div>
            </a>
          </li>
        ))}
      </ul>
      {items.length === 0 ? <p className="mt-10 text-center text-[13px] text-muted-foreground">没有匹配的组件, 换个关键词试试.</p> : null}
    </div>
  );
}
