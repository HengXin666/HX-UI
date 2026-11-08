import type { JSX, ReactNode } from "react";
import { cn } from "@hx/ui";
import { categoryOf, type CatalogEntry } from "../catalog";
import { CARD, ICON, ICON_XS, PKG, SECTION_DESC, SECTION_TITLE } from "../constants";

/** 页头: 标题, 描述, 分类标签. 对标 reactbits 组件页 54px 粗标题. */
export function PageHead({ entry, children }: { readonly entry: CatalogEntry; readonly children?: ReactNode }): JSX.Element {
  const category = categoryOf(entry.group);
  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-foreground md:text-[44px]">{entry.label}</h1>
        {children}
      </div>
      <p className="max-w-[68ch] text-[14.5px] leading-relaxed text-muted-foreground">{entry.desc}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 text-[12px] text-muted-foreground">
          <span aria-hidden className={cn(category.icon, ICON_XS)} />
          {category.label}
        </span>
        {entry.group !== category.label ? (
          <span className="inline-flex h-6 items-center rounded-full border border-border px-2.5 text-[12px] text-muted-foreground">{entry.group}</span>
        ) : null}
      </div>
    </header>
  );
}

/** 依赖卡: 列出运行时依赖; 没有额外依赖时如实写出. */
export function Dependencies({ deps }: { readonly deps: readonly string[] }): JSX.Element {
  const all = [PKG, ...deps];
  return (
    <section aria-labelledby="dependencies">
      <h2 id="dependencies" className={SECTION_TITLE}>
        Dependencies 依赖
      </h2>
      <p className={SECTION_DESC}>{deps.length > 0 ? "以下依赖随 " + PKG + " 一起安装, 不用单独装." : "除 " + PKG + " 本身外没有运行时依赖, 只用 CSS 与语义令牌."}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {all.map((dep) => (
          <code key={dep} className="rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-[12.5px] text-foreground">
            {dep}
          </code>
        ))}
      </div>
    </section>
  );
}

/** 相关组件: 四张卡, 名称与分类, 点进去换页. */
export function Related({ items, onGo, preview }: { items: readonly CatalogEntry[]; onGo: (id: string) => void; preview: (entry: CatalogEntry) => ReactNode }): JSX.Element | null {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="related">
      <h2 id="related" className={SECTION_TITLE}>
        Related components 相关组件
      </h2>
      <p className={SECTION_DESC}>同一分类里的其他组件.</p>
      <ul className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#/${item.id}`}
              onClick={(event) => {
                if (event.button !== 0 || event.metaKey || event.ctrlKey) return;
                event.preventDefault();
                onGo(item.id);
              }}
              className={cn(CARD, "group block p-1.5 transition-colors hover:border-ring/50")}
            >
              <div className="relative h-[108px] overflow-hidden rounded-xl bg-background">{preview(item)}</div>
              <div className="flex items-center justify-between gap-2 px-1.5 pt-2.5 pb-1">
                <span className="truncate text-[13px] text-foreground">{item.label}</span>
                <span aria-hidden className={cn(ICON.out, ICON_XS, "text-muted-foreground group-hover:text-foreground")} />
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
