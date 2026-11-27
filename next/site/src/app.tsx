import * as React from "react";
import { m } from "motion/react";
import { ease } from "@/motion/presets";
import { Shell } from "./docs/shell";
import { ComponentPage } from "./docs/component-page";
import { Home, SectionIndex } from "./docs/overview";
import { entryBySlug } from "./docs/registry";
import { href, parse, useHash, type Route } from "./docs/router";
import "./docs/docs.css";
import { useReducedMotion } from "@/motion/use-reduced-motion";


function FullPage({ load, title, back }: { load: () => Promise<{ default: React.ComponentType }>; title: string; back: string }) {
  const [C, setC] = React.useState<React.ComponentType | null>(null);
  React.useEffect(() => {
    let live = true;
    void load().then((m) => { if (live) setC(() => m.default); });
    document.title = title;
    return () => { live = false; };
  }, [load, title]);
  return (
    <main aria-label={title} className="h-dvh w-full">
      <h1 className="sr-only">{title}</h1>
      <a href={back} className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:bg-background focus:px-3 focus:py-1.5 focus:text-sm focus:shadow-float">返回文档</a>
      {C ? <C /> : <div aria-busy className="grid h-full place-items-center text-sm text-muted-foreground">加载中…</div>}
    </main>
  );
}

export function App() {
  const hash = useHash();
  const parsed = React.useMemo(() => parse(hash), [hash]);
  React.useEffect(() => { window.scrollTo(0, 0); }, [hash]);

  // 旧链接 #/c/<slug>: 换成所属分区的新地址; 旧分区 #/agent/*: 换成 #/ui/*
  React.useEffect(() => {
    if (parsed.name === "redirect") window.location.replace(parsed.to);
    if (parsed.name !== "legacy") return;
    const e = entryBySlug(parsed.slug);
    window.location.replace(e ? href.entry(e) : href.home);
  }, [parsed]);

  const reduced = useReducedMotion();
  const route: Route = parsed.name === "legacy" || parsed.name === "redirect" ? { name: "home" } : parsed;
  // 整页演示 (#/<分区>/<slug>/full): 不带文档外壳, 演示自己铺满视口
  if (route.name === "full") {
    const e = entryBySlug(route.slug);
    if (e?.fullPage) return <FullPage key={e.slug} load={e.fullPage.load} title={e.fullPage.label} back={href.entry(e)} />;
  }
  let page: React.ReactNode = <Home />;
  if (route.name === "section") page = <SectionIndex section={route.section} />;
  else if (route.name === "component") {
    const e = entryBySlug(route.slug);
    page = e && e.section === route.section ? <ComponentPage key={e.slug} entry={e} /> : <SectionIndex section={route.section} />;
  }
  const pageKey = route.name === "component" ? `c:${route.slug}` : route.name === "section" ? `s:${route.section}` : route.name;
  return (
    <Shell route={route}>
      {/* 换页衔接: 新页从下方 8px 淡入, 不等旧页退场, 不拖慢导航 */}
      <m.div key={pageKey} initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: ease.out }}>
        {page}
      </m.div>
    </Shell>
  );
}
