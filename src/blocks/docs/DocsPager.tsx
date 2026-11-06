"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import type * as React from "react";
import { DOCS_CLASS, DOCS_SLOT, type DOCS_PAGER_SLOTS } from "../../constants/blocks-docs-v109";
import { IconSlot } from "../../layout/Icon";
import { cn } from "../../primitives/utils";
import { resolveSlots } from "../_shared/BlockShell";
import type { BlockBaseProps, LinkItem, SlotClassNames } from "../_shared/types";
import { useDocsText } from "./parts/labels";

export type DocsPagerSlot = (typeof DOCS_PAGER_SLOTS)[number];

export interface DocsPagerProps extends Pick<BlockBaseProps, "id" | "className" | "style" | "aria-label"> {
  prev?: LinkItem;
  next?: LinkItem;
  classNames?: SlotClassNames<DocsPagerSlot>;
  /** 覆盖兜底文案 (pager / prev / next). */
  labels?: Partial<Record<string, string>>;
  ref?: React.Ref<HTMLElement>;
}

function PagerLink({ item, rel, direction, cls }: { item: LinkItem; rel: "prev" | "next"; direction: string; cls: Partial<Record<DocsPagerSlot, string>> }): React.JSX.Element {
  const isNext = rel === "next";
  return (
    <a href={item.href} rel={rel} data-slot={DOCS_SLOT.pagerLink} data-rel={rel} className={cn(DOCS_CLASS.pagerLink, DOCS_CLASS.focus, isNext && DOCS_CLASS.pagerNext, cls.link)}>
      <span className={cn(DOCS_CLASS.pagerDirection, cls.direction)}>
        {!isNext && <IconSlot source={ArrowLeftIcon} className={DOCS_CLASS.pagerArrow} />}
        {item.description ?? direction}
        {isNext && <IconSlot source={ArrowRightIcon} className={DOCS_CLASS.pagerArrow} />}
      </span>
      <span className={cn(DOCS_CLASS.pagerLabel, cls.label)}>{item.label}</span>
    </a>
  );
}

/** 上一页 / 下一页 (文档站正文底部). 两侧都缺省时不渲染; 只有 next 时仍靠右 (列位固定). */
export function DocsPager({ prev, next, classNames, labels, className, style, id, ref, "aria-label": ariaLabel }: DocsPagerProps): React.JSX.Element | null {
  const text = useDocsText(labels);
  const cls = resolveSlots<DocsPagerSlot, void, string>(classNames, undefined);
  if (prev === undefined && next === undefined) return null;
  return (
    <nav ref={ref} id={id} style={style} aria-label={ariaLabel ?? text.pager} data-slot={DOCS_SLOT.pager} className={cn("@container", className)}>
      <div className={cn(DOCS_CLASS.pager, cls.root)}>
        {prev !== undefined && <PagerLink item={prev} rel="prev" direction={text.prev} cls={cls} />}
        {next !== undefined && <PagerLink item={next} rel="next" direction={text.next} cls={cls} />}
      </div>
    </nav>
  );
}
