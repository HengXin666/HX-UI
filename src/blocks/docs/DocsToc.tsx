"use client";

import type * as React from "react";
import { DOCS_CLASS, DOCS_SLOT, type DOCS_TOC_SLOTS } from "../../constants/blocks-docs-v109";
import { cn } from "../../primitives/utils";
import { resolveSlots } from "../_shared/BlockShell";
import type { BlockBaseProps, SlotClassNames, TocItem } from "../_shared/types";
import { useDocsText } from "./parts/labels";
import { TocList } from "./parts/TocList";
import { useActiveHeading } from "./parts/use-toc";

export type DocsTocSlot = (typeof DOCS_TOC_SLOTS)[number];

export interface DocsTocProps extends Pick<BlockBaseProps, "id" | "className" | "style" | "aria-label"> {
  items: ReadonlyArray<TocItem>;
  /** 受控当前节; 不给时由 IntersectionObserver ScrollSpy 自动判定. */
  activeId?: string;
  /** 标题; 传 false 不渲染标题. */
  title?: React.ReactNode | false;
  /** ScrollSpy 判定带 (IntersectionObserver rootMargin). */
  rootMargin?: string;
  /** 滚动容器; 默认视口. */
  root?: Element | null;
  onNavigate?: (id: string) => void;
  classNames?: SlotClassNames<DocsTocSlot, { activeId?: string }>;
  /** 覆盖兜底文案 (toc). */
  labels?: Partial<Record<string, string>>;
  ref?: React.Ref<HTMLElement>;
}

/**
 * 本页目录 (shadcn / mantine 文档站右栏): h2/h3 分层缩进, 当前节高亮 aria-current="location".
 * 高亮由 IntersectionObserver 驱动, 不监听 scroll; 受控时以 activeId 为准.
 */
export function DocsToc({ items, activeId, title, rootMargin, root, onNavigate, classNames, labels, className, style, id, ref, "aria-label": ariaLabel }: DocsTocProps): React.JSX.Element | null {
  const text = useDocsText(labels);
  const spied = useActiveHeading(activeId === undefined ? items.map((item) => item.id) : [], { rootMargin, root });
  const current = activeId ?? spied;
  const cls = resolveSlots<DocsTocSlot, { activeId?: string }, string>(classNames, { activeId: current });
  if (items.length === 0) return null;
  return (
    <nav ref={ref} id={id} style={style} aria-label={ariaLabel ?? text.toc} data-slot={DOCS_SLOT.toc} className={cn(DOCS_CLASS.tocRoot, cls.root, className)}>
      {title !== false && <p className={cn(DOCS_CLASS.tocTitle, cls.title)}>{title ?? text.toc}</p>}
      <TocList items={items} activeId={current} onNavigate={onNavigate} classNames={{ list: cls.list, item: cls.item, link: cls.link }} />
    </nav>
  );
}
