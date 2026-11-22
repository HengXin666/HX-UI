import * as React from "react";
import { Shell } from "./docs/shell";
import { ComponentPage } from "./docs/component-page";
import { Home, SectionIndex } from "./docs/overview";
import { entryBySlug } from "./docs/registry";
import { href, parse, useHash, type Route } from "./docs/router";
import "./docs/docs.css";

const Foundation = React.lazy(() => import("./docs/foundation"));

export function App() {
  const hash = useHash();
  const parsed = React.useMemo(() => parse(hash), [hash]);
  React.useEffect(() => { window.scrollTo(0, 0); }, [hash]);

  // 旧链接 #/c/<slug>: 换成所属分区的新地址
  React.useEffect(() => {
    if (parsed.name !== "legacy") return;
    const e = entryBySlug(parsed.slug);
    window.location.replace(e ? href.entry(e) : href.home);
  }, [parsed]);

  const route: Route = parsed.name === "legacy" ? { name: "home" } : parsed;
  let page: React.ReactNode = <Home />;
  if (route.name === "section") page = <SectionIndex section={route.section} />;
  else if (route.name === "component") {
    const e = entryBySlug(route.slug);
    page = e && e.section === route.section ? <ComponentPage key={e.slug} entry={e} /> : <SectionIndex section={route.section} />;
  } else if (route.name === "foundation") {
    page = <React.Suspense fallback={<p className="p-10 text-sm text-muted-foreground">加载中…</p>}><Foundation /></React.Suspense>;
  }
  return <Shell route={route}>{page}</Shell>;
}
