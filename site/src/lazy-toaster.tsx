import { lazy, Suspense, useEffect, useState } from "react";

const Toaster = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })));

/** 空闲后再挂 Toaster, 不占首屏. toast() 只在交互后触发, 届时已就绪. */
export function LazyToaster() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    ric(() => setReady(true));
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <Toaster position="bottom-right" />
    </Suspense>
  );
}
