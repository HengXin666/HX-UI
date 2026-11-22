import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { SplitText } from "@/text/split-text";
import { CATEGORIES } from "./categories";
import { ENTRIES } from "./registry";
import { href } from "./router";

export function Overview() {
  React.useEffect(() => { document.title = "HX-UI · 组件"; }, []);
  return (
    <div>
      <section className="border-b px-5 pt-16 pb-14 md:px-10 md:pt-24">
        <p className="mb-8 font-mono text-xs tracking-wide text-muted-foreground">HX-UI 2 · React 组件库</p>
        <SplitText
          as="h1"
          trigger="mount"
          effect="rise"
          stagger={0.045}
          duration={0.8}
          text="组件，要让人记住。"
          className="text-[clamp(3rem,7.4vw,7.5rem)] leading-[1] font-medium tracking-[-0.05em] text-balance"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <p className="max-w-xl text-pretty text-muted-foreground">每个组件都能现场调参、复制源码，或者一键整理成提示词交给 AI。源码直接拷进项目，没有包装层。</p>
          <a href={href.component(ENTRIES[0].slug)} className="inline-flex h-11 items-center gap-2 justify-self-start rounded-lg bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90">
            从「{ENTRIES[0].title}」看起 <ArrowUpRight className="size-4" />
          </a>
        </div>
      </section>

      <ol aria-label="分类">
        {CATEGORIES.map((c) => {
          const list = ENTRIES.filter((e) => e.category === c.id);
          const extra = c.id === "foundation" ? [{ key: "foundation", title: "基础件合集", sub: "待拆分", href: href.foundation }] : [];
          const items = [...list.map((e) => ({ key: e.slug, title: e.title, sub: e.name, href: href.component(e.slug) })), ...extra];
          return (
            <li key={c.id} className="chapter border-b text-white" style={{ "--cat": c.color, "--band": c.band } as React.CSSProperties}>
              <div className="grid gap-8 px-5 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:px-10 md:py-16">
                <div>
                  <p className="font-mono text-xs tracking-wide text-white/85">{c.no} · {c.en}</p>
                  <h2 className="mt-3 text-[clamp(3rem,7vw,6rem)] leading-none font-medium tracking-[-0.045em]">{c.title}</h2>
                  <p className="mt-4 text-white/85">{c.blurb}</p>
                </div>
                <div className="grid gap-px self-start border border-white/30 bg-white/30 sm:grid-cols-2">
                  {items.length ? (
                    items.map((i) => (
                      <a key={i.key} href={i.href} className="group flex min-h-28 flex-col justify-between bg-[var(--band)] p-4 transition-colors hover:bg-[color-mix(in_oklch,var(--band)_80%,white)]">
                        <span className="flex items-start justify-between font-mono text-xs text-white/85">{i.sub}<ArrowUpRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
                        <span className="text-xl font-medium">{i.title}</span>
                      </a>
                    )).concat(items.length % 2 ? [<span key="pad" aria-hidden className="hidden bg-[var(--band)] sm:block" />] : [])
                  ) : (
                    <p className="bg-[var(--band)] p-4 font-mono text-xs text-white/85 sm:col-span-2">筹备中</p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <footer className="flex flex-wrap justify-between gap-2 px-5 py-8 font-mono text-xs text-muted-foreground md:px-10">
        <span>HX-UI 2</span>
        <span>{ENTRIES.length + 1} 个页面 · 持续更新</span>
      </footer>
    </div>
  );
}
