import type * as React from "react";
import { cn } from "@/lib/utils";

/** 站点页脚: 品牌 + 多列链接 + 底部版权行. 手机上链接两列并排, 不一路竖排到底. */
export function SiteFooter({ brand, columns, note, legal, width = "max-w-6xl" }: {
  brand: React.ReactNode;
  columns: { title: string; links: { label: string; href: string }[] }[];
  note?: string;
  legal?: React.ReactNode;
  /** 内容宽度, 与顶栏和页面栏线对齐. 默认 max-w-6xl */
  width?: string;
}) {
  return (
    <footer className="border-t">
      <div
        className={cn("mx-auto grid grid-cols-2 gap-x-6 gap-y-10 px-5 py-14 md:grid-cols-[2fr_repeat(var(--cols),1fr)] md:px-8", width)}
        style={{ "--cols": columns.length } as React.CSSProperties}
      >
        <div className="col-span-2 space-y-3 md:col-span-1">
          <div className="font-semibold tracking-tight">{brand}</div>
          {note && <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{note}</p>}
        </div>
        {columns.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <div className="mb-4 text-[13px] font-medium">{c.title}</div>
            <ul className="space-y-2.5 text-[13px] text-muted-foreground">
              {c.links.map((l) => <li key={l.label}><a href={l.href} className="transition-colors hover:text-foreground">{l.label}</a></li>)}
            </ul>
          </nav>
        ))}
      </div>
      {legal && <div className={cn("mx-auto px-5 md:px-8", width)}><div className="border-t py-6 text-xs text-muted-foreground">{legal}</div></div>}
    </footer>
  );
}
