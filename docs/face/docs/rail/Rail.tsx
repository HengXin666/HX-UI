import { useEffect, useId, useMemo, useRef, useState, type JSX } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput, ToggleGroup, ToggleGroupItem, cn } from "@hx/ui";
import { CATALOG, CATALOG_GROUPS, CATEGORIES, COMPONENTS, categoryOf, type CategoryId } from "../catalog";
import { CARD, ICON, ICON_SM, ICON_XS, INDEX_ID } from "../constants";

/** 普通左键单击才走站内路由, 带修饰键时交给浏览器开新标签. */
function plainClick(event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/** 分组展开与收起: 行高从 0fr 过渡到 1fr 并淡入, 减弱动效时直接切换. */
const FOLD = "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none";

/**
 * 左栏圆角卡: 浏览全部, 分类图标页签, 过滤输入, 按 catalog 分组的可折叠列表. 卡本身吸顶, 只有列表滚动;
 * 默认只展开当前页所在组, 换页时那组自动展开, 当前项进入视口中部. 过滤时命中的组全部展开.
 */
export function Rail({ active, onGo }: { readonly active: string; readonly onGo: (id: string) => void }): JSX.Element {
  const activeEntry = CATALOG.find((entry) => entry.id === active);
  const [category, setCategory] = useState<CategoryId>("all");
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const foldId = useId();
  const activeGroup = activeEntry?.group;
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(activeGroup ? [activeGroup] : []));
  const filtering = query.trim() !== "";
  const isOpen = (group: string): boolean => filtering || open.has(group);
  const activeOpen = activeGroup !== undefined && open.has(activeGroup);
  const toggle = (group: string): void =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  useEffect(() => {
    if (activeGroup) setOpen((prev) => (prev.has(activeGroup) ? prev : new Set(prev).add(activeGroup)));
  }, [activeGroup]);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const current = CATEGORIES.find((item) => item.id === category) ?? CATEGORIES[0];
    return CATALOG_GROUPS.map((group) => ({
      group,
      items: CATALOG.filter(
        (entry) =>
          entry.group === group &&
          current.match(group) &&
          (!needle || entry.label.toLowerCase().includes(needle) || entry.id.includes(needle)),
      ),
    })).filter((section) => section.items.length > 0);
  }, [category, query]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>("[aria-current=page]");
    const list = listRef.current;
    if (node && list) list.scrollTop = node.offsetTop - list.clientHeight / 2;
  }, [active, activeOpen]);

  return (
    <div className={cn(CARD, "flex h-full min-h-0 flex-col p-3.5")}>
      <a
        href={`#/${INDEX_ID}`}
        onClick={(event) => {
          if (!plainClick(event)) return;
          event.preventDefault();
          onGo(INDEX_ID);
        }}
        aria-current={active === INDEX_ID ? "page" : undefined}
        className="flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-muted/50 px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
      >
        <span aria-hidden className={cn(ICON.grid, ICON_XS)} />
        {active === INDEX_ID ? "正在浏览全部组件" : "浏览全部组件"}
      </a>

      <ToggleGroup
        type="single"
        spacing={0.5}
        value={category}
        onValueChange={(next) => {
          if (next) setCategory(next as CategoryId);
        }}
        aria-label="组件分类"
        className="mt-3 w-full rounded-xl border border-border/60 p-1"
      >
        {CATEGORIES.map((item) => (
          <ToggleGroupItem
            key={item.id}
            value={item.id}
            ripple={false}
            aria-label={item.label}
            title={item.label}
            className="grid h-8 min-w-0 flex-1 place-items-center px-0 text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground active:translate-y-0 data-[state=on]:bg-muted data-[state=on]:text-foreground"
          >
            <span aria-hidden className={cn(item.icon, ICON_SM)} />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <InputGroup className="mt-3 h-9 gap-2 rounded-xl border-border/60 px-3 text-muted-foreground hover:border-border/60 dark:bg-transparent">
        <InputGroupAddon className="p-0">
          <span aria-hidden className={cn(ICON.search, ICON_XS)} />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`过滤 ${COMPONENTS.length} 个组件...`}
          aria-label="过滤组件"
          className="px-0 text-[12px] text-foreground md:text-[12px]"
        />
      </InputGroup>

      <div ref={listRef} className="relative mt-4 min-h-0 flex-1 overflow-y-auto pr-1 [mask-image:linear-gradient(to_bottom,transparent,var(--foreground)_24px,var(--foreground)_calc(100%-32px),transparent)]">
        <nav aria-label="组件目录" className="flex flex-col gap-1 py-3">
          {groups.map(({ group, items }, index) => {
            const expanded = isOpen(group);
            const panel = `${foldId}-${index}`;
            return (
              <div key={group}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panel}
                  onClick={() => toggle(group)}
                  className="flex w-full items-center justify-between gap-2 py-1.5 text-left text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="truncate">{group}</span>
                  <span
                    aria-hidden
                    className={cn(ICON.down, ICON_XS, "transition-transform duration-200 ease-out motion-reduce:transition-none", !expanded && "-rotate-90")}
                  />
                </button>
                <div id={panel} inert={!expanded} className={cn(FOLD, expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                  <ul className="flex min-h-0 flex-col overflow-hidden">
                    {items.map((entry) => (
                      <li key={entry.id}>
                        <a
                          href={`#/${entry.id}`}
                          aria-current={entry.id === active ? "page" : undefined}
                          onClick={(event) => {
                            if (!plainClick(event)) return;
                            event.preventDefault();
                            onGo(entry.id);
                          }}
                          className="block truncate py-[7px] text-[13.5px] text-foreground/90 transition-colors hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-primary"
                        >
                          {entry.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
          {groups.length === 0 ? <p className="text-[12px] text-muted-foreground">没有匹配的组件</p> : null}
        </nav>
      </div>
      {activeEntry ? <span className="sr-only">当前分类 {categoryOf(activeEntry.group).label}</span> : null}
    </div>
  );
}
