import { useEffect, useRef, useState, type JSX } from "react";
import { BUTTON_TYPE } from "@hx/ui";
import { DOCS, GROUPS, WIDE_PAGES, type DocEntry } from "../src/nav";
import { DocsNav } from "../src/nav/DocsNav";
import { PageNav } from "../src/components/PageNav";
import { TableOfContents } from "../src/components/TableOfContents";
import { renderDoc } from "./render-doc";

/** 组件文档外壳: 侧栏, 正文, 本页目录. 窄屏时侧栏收进顶栏的「打开导航」. */
export function DocsFrame({
  id,
  onGo,
  wide,
  mobileNavOpen,
  setMobileNavOpen,
}: {
  readonly id: string;
  readonly onGo: (id: string) => void;
  readonly wide: boolean;
  readonly mobileNavOpen: boolean;
  readonly setMobileNavOpen: (open: boolean) => void;
}): JSX.Element {
  const entry = DOCS.find((item) => item.id === id) ?? DOCS[0];
  const index = DOCS.findIndex((item) => item.id === entry.id);
  const [openGroups, setOpenGroups] = useState<readonly string[]>(() => [entry.group]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpenGroups((prev) => (prev.includes(entry.group) ? prev : [...prev, entry.group]));
    setMobileNavOpen(false);
    contentRef.current?.scrollTo({ top: 0 });
  }, [entry.group, entry.id, setMobileNavOpen]);

  const toggle = (group: string): void => {
    setOpenGroups((prev) => (prev.includes(group) ? prev.filter((item) => item !== group) : [...prev, group]));
  };

  return (
    <div className="flex min-h-0 flex-1">
      {mobileNavOpen ? (
        <button type={BUTTON_TYPE} aria-label="关闭导航" className="fixed inset-0 z-30 bg-background/70 md:hidden" onClick={() => setMobileNavOpen(false)} />
      ) : null}
      <aside
        id="docs-navigation"
        className={`${mobileNavOpen ? "flex" : "hidden"} fixed inset-y-12 left-0 z-40 w-64 flex-col border-r border-border bg-background md:static md:flex md:w-60`}
      >
        <DocsNav groups={GROUPS} docs={DOCS} active={entry.id} openGroups={openGroups} onToggle={toggle} onGo={onGo} />
      </aside>
      <main className="flex min-w-0 flex-1">
        <div ref={contentRef} className="h-[calc(100svh-3rem)] min-w-0 flex-1 overflow-y-auto">
          <div className={"mx-auto flex w-full gap-10 px-4 py-8 md:px-8 " + (WIDE_PAGES.has(entry.id) ? "max-w-[1720px]" : wide ? "max-w-[1100px]" : "max-w-[880px]")}>
            <article className="w-full min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">{entry.group}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">{entry.label}</h1>
              <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">{entry.desc}</p>
              <div className="mt-8">{renderDoc(entry as DocEntry)}</div>
              <PageNav prev={DOCS[index - 1]} next={DOCS[index + 1]} onGo={onGo} />
            </article>
            <TableOfContents container={contentRef.current} deps={entry.id} className="hidden w-48 shrink-0 xl:block" />
          </div>
        </div>
      </main>
    </div>
  );
}
