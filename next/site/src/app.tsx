import { lazy, Suspense } from "react";
import { SITES } from "@sites/registry";
import { useRoute } from "./router";
import { Home } from "./pages/home";
import { BackLink } from "./pages/back-link";

// 成品页与文档页都按需加载: 首页不背图表与商品图的包
const SITE_PAGES = Object.fromEntries(SITES.map((s) => [s.id, lazy(s.load)]));
const DOC_PAGES = {
  components: lazy(() => import("./pages/components")),
  interactions: lazy(() => import("./pages/interactions")),
  sites: lazy(() => import("./pages/sites-index")),
};

const Loading = () => <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">加载中…</div>;

export function App() {
  const route = useRoute();
  const head = route.split("/")[0];
  const Site = SITE_PAGES[head];
  const Doc = DOC_PAGES[head as keyof typeof DOC_PAGES];
  if (!Site && !Doc) return <Home />;
  return (
    <Suspense fallback={<Loading />}>
      {Site ? <><Site /><BackLink /></> : Doc && <Doc />}
    </Suspense>
  );
}
