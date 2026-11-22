import * as React from "react";
import { Shell } from "./docs/shell";
import { ComponentPage } from "./docs/component-page";
import { Overview } from "./docs/overview";
import { entryBySlug } from "./docs/registry";
import { parse, useHash } from "./docs/router";
import "./docs/docs.css";

const Foundation = React.lazy(() => import("./docs/foundation"));

export function App() {
  const hash = useHash();
  const route = React.useMemo(() => parse(hash), [hash]);
  React.useEffect(() => { window.scrollTo(0, 0); }, [hash]);

  let page: React.ReactNode = <Overview />;
  if (route.name === "component") {
    const e = entryBySlug(route.slug);
    page = e ? <ComponentPage key={e.slug} entry={e} /> : <Overview />;
  } else if (route.name === "foundation") {
    page = <React.Suspense fallback={<p className="p-10 text-sm text-muted-foreground">加载中…</p>}><Foundation /></React.Suspense>;
  }
  return <Shell route={route}>{page}</Shell>;
}
