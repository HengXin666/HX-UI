"use client";

import { ChevronDownIcon } from "lucide-react";
import * as React from "react";
import { DOCS_CLASS, DOCS_SLOT, type DOCS_SHELL_SLOTS } from "../../constants/blocks-docs-v109";
import { IconSlot } from "../../layout/Icon";
import { cn } from "../../primitives/utils";
import { resolveSlots } from "../_shared/BlockShell";
import type { BlockBaseProps, LinkGroup, LinkItem, SlotClassNames, TocItem } from "../_shared/types";
import { DocsPager } from "./DocsPager";
import { DocsSidebar } from "./parts/DocsSidebar";
import { DocsTopBar } from "./parts/DocsTopBar";
import { useDocsText } from "./parts/labels";
import { TocList } from "./parts/TocList";
import { useActiveHeading, useCollectedHeadings } from "./parts/use-toc";
import { DocsToc } from "./DocsToc";

export type DocsShellSlot = (typeof DOCS_SHELL_SLOTS)[number];

export interface DocsShellState {
  hasToc: boolean;
  activeId?: string;
}

export interface DocsShellProps extends Omit<BlockBaseProps, "classNames" | "labels" | "tone" | "pad" | "width" | "align" | "backdrop" | "as"> {
  /** 左侧导航分组. */
  sidebar: ReadonlyArray<LinkGroup>;
  /**
   * 本页目录: 数组 = 显式给出; "auto" (默认) = 从正文采集 h2[id] / h3[id]; false = 不要右栏.
   */
  toc?: ReadonlyArray<TocItem> | "auto" | false;
  /** 完整顶栏节点 (例如 site 类别的 SiteHeader); 给了就替换内置顶栏. */
  header?: React.ReactNode;
  /** 内置顶栏的品牌位与右侧动作. */
  brand?: React.ReactNode;
  actions?: React.ReactNode;
  /** 当前路径, 用于侧栏 aria-current (item.current 优先). */
  currentHref?: string;
  /** 正文底部的上一页 / 下一页. */
  pager?: { prev?: LinkItem; next?: LinkItem };
  /** 右栏目录下方的附加内容 (编辑此页, 赞助位). */
  asideExtra?: React.ReactNode;
  /** 跳到正文的锚点 id. */
  mainId?: string;
  classNames?: SlotClassNames<DocsShellSlot, DocsShellState>;
  labels?: Partial<Record<string, string>>;
  ref?: React.Ref<HTMLDivElement>;
  children?: React.ReactNode;
}

/**
 * 文档站三栏外壳 (视觉审计 B17; shadcn / mantine / ant.design 同构): 顶栏 / 侧栏 / 正文 / 本页目录 / 上一页下一页.
 * 布局走容器查询: 容器 ≥ @5xl 显示侧栏 (以下进 Sheet), ≥ @7xl 显示右栏目录 (以下收进正文顶部的折叠目录).
 * 三栏宽度由 --docs-sidebar-width / --docs-main-width / --docs-toc-width 控制.
 */
export function DocsShell({
  sidebar,
  toc = "auto",
  header,
  brand,
  actions,
  currentHref,
  pager,
  asideExtra,
  mainId,
  classNames,
  labels,
  slots,
  className,
  style,
  id,
  ref,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: DocsShellProps): React.JSX.Element {
  const text = useDocsText(labels);
  const generatedId = React.useId();
  const contentId = mainId ?? `${generatedId}-main`;
  const articleRef = React.useRef<HTMLDivElement>(null);
  const collected = useCollectedHeadings(articleRef, toc === "auto");
  const items: ReadonlyArray<TocItem> = toc === false ? [] : toc === "auto" ? collected : toc;
  const activeId = useActiveHeading(items.map((item) => item.id));
  const hasToc = items.length > 0;
  const cls = resolveSlots<DocsShellSlot, DocsShellState, string>(classNames, { hasToc, activeId });
  return (
    <div
      ref={ref}
      id={id}
      style={style}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-slot={DOCS_SLOT.shell}
      data-has-toc={hasToc ? "true" : undefined}
      className={cn(DOCS_CLASS.shellRoot, cls.root, className)}
    >
      <a href={`#${contentId}`} className={DOCS_CLASS.skip}>
        {text.skipToContent}
      </a>
      {header ?? <DocsTopBar brand={brand} actions={actions} sidebar={sidebar} currentHref={currentHref} text={text} className={cls.topbar} />}
      <div className={cn(DOCS_CLASS.grid, !hasToc && DOCS_CLASS.gridNoToc)}>
        <aside className={cn(DOCS_CLASS.sidebarCol, cls.sidebar)}>
          <DocsSidebar groups={sidebar} label={text.sidebar} currentHref={currentHref} />
        </aside>
        <main id={contentId} tabIndex={-1} data-slot={DOCS_SLOT.main} className={cn(DOCS_CLASS.main, cls.main)}>
          <div className={cn(DOCS_CLASS.article, cls.article)}>
            {hasToc && (
              <details data-slot={DOCS_SLOT.tocMobile} className={cn("group", DOCS_CLASS.tocMobile)}>
                <summary className={DOCS_CLASS.tocMobileSummary}>
                  {text.tocToggle}
                  <IconSlot source={ChevronDownIcon} className={DOCS_CLASS.tocMobileChevron} />
                </summary>
                <div className={DOCS_CLASS.tocMobileBody}>
                  <TocList items={items} activeId={activeId} />
                </div>
              </details>
            )}
            {slots?.before}
            <div ref={articleRef} data-slot={DOCS_SLOT.article}>
              {children}
            </div>
            {slots?.after}
            {pager !== undefined && <DocsPager prev={pager.prev} next={pager.next} labels={labels} className={cls.pager} />}
          </div>
        </main>
        {hasToc && (
          <aside data-slot={DOCS_SLOT.aside} className={cn(DOCS_CLASS.asideCol, cls.aside)}>
            <DocsToc items={items} activeId={activeId} labels={labels} />
            {asideExtra}
          </aside>
        )}
      </div>
    </div>
  );
}
