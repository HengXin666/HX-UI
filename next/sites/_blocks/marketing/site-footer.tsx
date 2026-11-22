import type * as React from "react";

/** 站点页脚: 品牌 + 多列链接 + 底部版权行. */
export function SiteFooter({ brand, columns, note, legal }: {
  brand: React.ReactNode;
  columns: { title: string; links: { label: string; href: string }[] }[];
  note?: string;
  legal?: React.ReactNode;
}) {
  return (
    <footer className="border-t px-5 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 py-14 md:grid-cols-[2fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <div className="font-semibold tracking-tight">{brand}</div>
          {note && <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{note}</p>}
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <div className="mb-4 text-[13px] font-medium">{c.title}</div>
            <ul className="space-y-2.5 text-[13px] text-muted-foreground">
              {c.links.map((l) => <li key={l.label}><a href={l.href} className="transition-colors hover:text-foreground">{l.label}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      {legal && <div className="mx-auto max-w-6xl border-t py-6 text-xs text-muted-foreground">{legal}</div>}
    </footer>
  );
}
