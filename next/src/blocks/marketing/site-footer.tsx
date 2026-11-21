import type * as React from "react";

/** 站点页脚: 品牌 + 多列链接 + 版权. */
export function SiteFooter({ brand, columns, note }: { brand: React.ReactNode; columns: { title: string; links: { label: string; href: string }[] }[]; note?: string }) {
  return (
    <footer className="border-t px-4 py-12">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <div className="font-semibold">{brand}</div>
          {note && <p className="max-w-xs text-sm text-muted-foreground">{note}</p>}
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <div className="mb-3 text-sm font-medium">{c.title}</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {c.links.map((l) => <li key={l.label}><a href={l.href} className="hover:text-foreground">{l.label}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
