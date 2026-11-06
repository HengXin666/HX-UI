"use client";

import * as React from "react";
import { PORTFOLIO_DEFAULT } from "../../../constants/blocks-portfolio-v111";

export interface ScrollSpyOptions {
  /** IntersectionObserver rootMargin; 默认视口 20% 至 40% 的判定带. */
  rootMargin?: string;
  threshold?: number | number[];
  /** 滚动容器; 默认视口. */
  root?: Element | null;
}

/** "#about" -> "about"; 非页内锚点 (外链, 空串, 只有 #) 返回 undefined. */
export function hashTarget(href: string): string | undefined {
  if (!href.startsWith(PORTFOLIO_DEFAULT.hashPrefix)) return undefined;
  const id = decodeURIComponent(href.slice(PORTFOLIO_DEFAULT.hashPrefix.length));
  return id === "" ? undefined : id;
}

/**
 * scrollspy: 用 IntersectionObserver 观察 ids 对应的节, 返回当前节 id. 不监听 scroll, 不轮询.
 * 判定带内有多节时取文档顺序靠前的一节; 判定带内为空时保留上一次结果 (节间空白处不闪烁).
 * SSR 与无 IntersectionObserver 的环境返回 undefined.
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-portfolio-v111.md
 */
export function useScrollSpy(ids: ReadonlyArray<string>, options: ScrollSpyOptions = {}): string | undefined {
  const { rootMargin = PORTFOLIO_DEFAULT.spyRootMargin, threshold = PORTFOLIO_DEFAULT.spyThreshold, root = null } = options;
  const [active, setActive] = React.useState<string | undefined>(undefined);
  const key = ids.join("\n");
  const thresholdKey = Array.isArray(threshold) ? threshold.join(",") : String(threshold);
  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || key === "") return undefined;
    const order = key.split("\n");
    const elements = order.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return undefined;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = order.find((id) => visible.has(id));
        if (first !== undefined) setActive(first);
      },
      { root, rootMargin, threshold },
    );
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
    // thresholdKey 代表 threshold 的取值, 避免数组字面量每次渲染都重建 observer
  }, [key, root, rootMargin, thresholdKey]);
  return active;
}
