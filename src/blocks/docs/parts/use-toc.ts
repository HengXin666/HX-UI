"use client";

import * as React from "react";
import { DOCS_DEFAULT } from "../../../constants/blocks-docs-v109";
import type { TocItem } from "../../_shared/types";

/** "#props" -> "props"; 非页内锚点返回 undefined. */
export function hashTarget(href: string): string | undefined {
  if (!href.startsWith(DOCS_DEFAULT.hashPrefix)) return undefined;
  const id = decodeURIComponent(href.slice(DOCS_DEFAULT.hashPrefix.length));
  return id === "" ? undefined : id;
}

export interface ActiveHeadingOptions {
  rootMargin?: string;
  threshold?: number;
  root?: Element | null;
}

/**
 * ScrollSpy: IntersectionObserver 观察 ids 对应的标题, 返回当前节 id. 不监听 scroll, 不轮询.
 * 判定带内有多个标题时取文档顺序最靠前者; 判定带为空时保留上一次结果, 节间空白处不闪烁.
 */
export function useActiveHeading(ids: ReadonlyArray<string>, options: ActiveHeadingOptions = {}): string | undefined {
  const { rootMargin = DOCS_DEFAULT.spyRootMargin, threshold = DOCS_DEFAULT.spyThreshold, root = null } = options;
  const [active, setActive] = React.useState<string | undefined>(undefined);
  const key = ids.join("\n");
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
  }, [key, root, rootMargin, threshold]);
  return active;
}

function readHeadings(container: HTMLElement, selector: string): TocItem[] {
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).map((el) => ({
    id: el.id,
    label: el.textContent?.trim() ?? el.id,
    depth: Number(el.tagName.slice(1)) || DOCS_DEFAULT.tocBaseDepth,
  }));
}

function sameItems(a: TocItem[], b: TocItem[]): boolean {
  return a.length === b.length && a.every((item, i) => item.id === b[i].id && item.label === b[i].label && item.depth === b[i].depth);
}

/**
 * 从正文容器自动采集带 id 的标题 (未显式给 toc 时用). MutationObserver 跟随正文变化 (路由切换, 懒加载段落).
 * enabled 为 false 时不挂观察器, 返回空数组.
 */
export function useCollectedHeadings(ref: React.RefObject<HTMLElement | null>, enabled: boolean, selector: string = DOCS_DEFAULT.headingSelector): TocItem[] {
  const [items, setItems] = React.useState<TocItem[]>([]);
  React.useEffect(() => {
    const container = ref.current;
    if (!enabled || container === null) return undefined;
    const sync = (): void => {
      const next = readHeadings(container, selector);
      setItems((prev) => (sameItems(prev, next) ? prev : next));
    };
    sync();
    if (typeof MutationObserver === "undefined") return undefined;
    const observer = new MutationObserver(sync);
    observer.observe(container, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["id"] });
    return () => observer.disconnect();
  }, [ref, enabled, selector]);
  return items;
}
