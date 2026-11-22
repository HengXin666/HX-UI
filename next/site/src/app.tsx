import { lazy, Suspense, useEffect } from "react";
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

/**
 * 文档站用 hash 做路由, 成品页里的 #pricing 这类锚点会把路由冲掉.
 * 在文档站这一层接管: 只滚动, 不改 hash. 成品页拷走后锚点照常工作.
 */
function useInPageAnchors() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element).closest?.("a[href^='#']");
      const href = a?.getAttribute("href");
      if (!href || href.startsWith("#/")) return;
      e.preventDefault();
      if (href === "#") return;
      const el = document.getElementById(decodeURIComponent(href.slice(1)));
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}

export function App() {
  useInPageAnchors();
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
