import { lazy, Suspense } from "react";
import { useRoute } from "./router";
import { Home } from "./pages/home";

// 模板页按需加载: 首页不背图表与商品图的包
const PAGES: Record<string, React.LazyExoticComponent<() => React.JSX.Element>> = {
  launch: lazy(() => import("./templates/launch")),
  shop: lazy(() => import("./templates/shop")),
  ops: lazy(() => import("./templates/ops")),
  analytics: lazy(() => import("./templates/analytics")),
  components: lazy(() => import("./pages/components")),
};

export function App() {
  const route = useRoute();
  const Page = PAGES[route];
  if (!Page) return <Home />;
  return (
    <Suspense fallback={<div className="grid min-h-svh place-items-center text-sm text-muted-foreground">加载中…</div>}>
      <Page />
    </Suspense>
  );
}
