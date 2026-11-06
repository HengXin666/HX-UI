import { useCallback, useEffect, useState, type RefCallback } from "react";
import { canUseDOM, isFunction } from "../../constants/hooks";

/** useIntersection 的返回, 与 Mantine 一致: 回调 ref 与最近一次 IntersectionObserverEntry. */
export interface UseIntersectionReturn<T extends Element> {
  ref: RefCallback<T>;
  entry: IntersectionObserverEntry | null;
}

/**
 * 用 IntersectionObserver 观察元素与视口 (或 root) 的相交情况, 用于懒加载与无限滚动 (对标 Mantine useIntersection).
 *
 * @param options IntersectionObserver 的 root, rootMargin, threshold.
 * @returns { ref, entry }.
 * @example
 * const { ref, entry } = useIntersection<HTMLDivElement>({ threshold: 1 });
 * useEffect(() => { if (entry?.isIntersecting) loadMore(); }, [entry]);
 * return <div ref={ref} />;
 */
export function useIntersection<T extends Element = HTMLElement>(options?: IntersectionObserverInit): UseIntersectionReturn<T> {
  const [node, setNode] = useState<T | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const root = options?.root ?? null;
  const rootMargin = options?.rootMargin;
  const threshold = options?.threshold;
  const thresholdKey = JSON.stringify(threshold ?? null);
  const ref = useCallback<RefCallback<T>>((element) => setNode(element), []);

  useEffect(() => {
    if (!node) {
      setEntry(null);
      return;
    }
    if (!canUseDOM() || !isFunction(window.IntersectionObserver)) return;
    const parsed: number | number[] | null = JSON.parse(thresholdKey);
    const observer = new IntersectionObserver(([next]) => setEntry(next ?? null), {
      root,
      rootMargin,
      threshold: parsed ?? undefined,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, root, rootMargin, thresholdKey]);

  return { ref, entry };
}
