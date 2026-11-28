import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { SplitText } from "@/text/split-text";
import { SECTIONS, sectionOf, type Section } from "./sections";
import { entriesOf } from "./registry";
import { href } from "./router";
import type { SectionId } from "./types";

/** 一条章节色带: 左边大标题, 右边这一块的条目 */
function Band({ s, heading: H = "h2" }: { s: Section; heading?: "h1" | "h2" }) {
  const list = entriesOf(s.id).map((e) => ({ key: e.slug, title: e.title, sub: e.name, href: href.entry(e) }));
  return (
    <section className="chapter border-b text-white" style={{ "--cat": s.color, "--band": s.band } as React.CSSProperties}>
      <div className="grid gap-8 px-5 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:px-10 md:py-16">
        <div>
          <p className="font-mono text-xs tracking-wide text-white/85">{s.no} · {s.en}</p>
          <H className="mt-3 text-[clamp(3rem,7vw,6rem)] leading-none font-medium tracking-[-0.045em]">
            {H === "h2" ? <a href={href.section(s.id)} className="hover:underline hover:decoration-2 hover:underline-offset-8">{s.title}</a> : s.title}
          </H>
          <p className="mt-4 max-w-md text-white/85">{s.blurb}</p>
        </div>
        <div className="grid gap-px self-start border border-white/30 bg-white/30 sm:grid-cols-2">
          {list.length ? (
            list.map((i) => (
              <a key={i.key} href={i.href} className="group flex min-h-28 flex-col justify-between bg-[var(--band)] p-4 transition-colors hover:bg-[color-mix(in_oklch,var(--band)_80%,white)]">
                <span className="flex items-start justify-between font-mono text-xs text-white/85">{i.sub}<ArrowUpRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
                <span className="text-xl font-medium">{i.title}</span>
              </a>
            )).concat(list.length % 2 ? [<span key="pad" aria-hidden className="hidden bg-[var(--band)] sm:block" />] : [])
          ) : (
            <p className="bg-[var(--band)] p-4 font-mono text-xs text-white/85 sm:col-span-2">筹备中</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function Home() {
  React.useEffect(() => { document.title = "HX-UI 2"; }, []);
  return (
    <div>
      <section className="border-b px-5 pt-16 pb-14 md:px-10 md:pt-24">
        <p className="mb-8 font-mono text-xs tracking-wide text-muted-foreground">HX-UI 2 · React 组件库</p>
        <SplitText as="h1" trigger="mount" effect="rise" stagger={0.045} duration={0.8} text="组件，要让人记住。" className="text-[clamp(3rem,7.4vw,7.5rem)] leading-[1] font-medium tracking-[-0.05em] text-balance" />
        <p className="mt-12 max-w-xl text-pretty text-muted-foreground">三层东西分开放：做产品的 UI 组件，撑主视觉的视觉组件，整页可拿走的落地页。每个都能现场调参、复制源码，或者整理成提示词交给 AI。</p>
      </section>
      {SECTIONS.map((s) => <Band key={s.id} s={s} />)}
      <footer className="flex flex-wrap justify-between gap-2 px-5 py-8 font-mono text-xs text-muted-foreground md:px-10">
        <span>HX-UI 2</span>
        <span>持续更新</span>
      </footer>
    </div>
  );
}

export function SectionIndex({ section }: { section: SectionId }) {
  const s = sectionOf(section);
  React.useEffect(() => { document.title = `${s.title} · HX-UI`; }, [s]);
  return <Band s={s} heading="h1" />;
}
