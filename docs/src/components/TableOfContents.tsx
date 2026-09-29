import { useEffect, useMemo, useState, type JSX } from "react";
import { cn } from "@hx/ui";

/**
 * 页内目录 (右侧 on-this-page)。
 *
 * ## 为什么从 DOM 里读标题, 而不是让每个页面声明一份
 *
 * 38 个页面、161 个 H2 —— 让每个页面自己写一份章节清单, 必然出现"文档改了目录没改"。
 * 直接从**渲染后的 DOM** 读, 则任何新增/删改标题都自动跟随, 零维护。
 * 代价是需要在标题变化后重扫一次, 所以依赖 `deps` (页面 id) 触发。
 *
 * ## 高亮当前章节用 IntersectionObserver, 不用 scroll 事件
 *
 * scroll 事件每帧触发, 在里面 getBoundingClientRect 会造成强制重排 (长文档上肉眼可见)。
 * IntersectionObserver 由浏览器在合成侧回调, 且天然给出"哪些标题在视口里"。
 * rootMargin 用 `-80px 0px -70%`, 把判定线压在视口上部 —— 否则标题刚进底部就被高亮,
 * 读到的内容与高亮的章节对不上。
 */
export interface TocItem {
  readonly id: string;
  readonly text: string;
  readonly level: 2 | 3;
}

/** 从容器里读出所有带 id 的 h2 / h3。 */
export function collectToc(container: HTMLElement | null): TocItem[] {
  if (!container) return [];
  const nodes = container.querySelectorAll<HTMLHeadingElement>("h2[id], h3[id]");
  return Array.from(nodes).map((el) => ({
    id: el.id,
    text: (el.textContent ?? "").replace(/#\s*$/, "").trim(),
    level: el.tagName === "H2" ? 2 : 3,
  }));
}

export function TableOfContents({
  container,
  deps,
  className,
}: {
  /** 内容容器 (标题所在的那棵子树)。 */
  container: HTMLElement | null;
  /** 变化时重扫。传页面 id 即可。 */
  deps: unknown;
  className?: string;
}): JSX.Element | null {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");

  // 依赖页面切换后重扫。用 requestAnimationFrame 是因为本组件可能与内容在同一批提交里挂载,
  // 立刻查询会拿到上一页的 DOM。
  useEffect(() => {
    const raf = requestAnimationFrame(() => setItems(collectToc(container)));
    return () => cancelAnimationFrame(raf);
  }, [container, deps]);

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // 取最靠上的那个可见标题作为当前章节
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  const shown = useMemo(() => items.filter((it) => it.level === 2), [items]);

  // 只有一两个章节时不值得占一栏
  if (shown.length < 2) return null;

  return (
    <nav
      aria-label="本页目录"
      className={cn("sticky top-8 hidden max-h-[calc(100vh-6rem)] overflow-y-auto xl:block", className)}
    >
      <div className="mb-2 text-[11px] font-medium text-muted-foreground/70">本页目录</div>
      <ul className="flex flex-col gap-px border-l border-border/60">
        {shown.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(it.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                history.replaceState(null, "", `#${it.id}`);
              }}
              className={cn(
                "-ml-px block border-l py-1 pl-3 text-[12px] leading-snug transition-colors",
                activeId === it.id
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
