"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";
import {
  FAQ_ACCORDION_CLASS as A,
  FAQ_CLASS as C,
  FAQ_VARIANT,
  V105_CLASS as K,
  V105_SLOT,
  type FAQ_SLOTS,
  type V105Text,
} from "../../../constants/blocks-marketing-pricing";
import { IconSlot } from "../../../layout/Icon";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../primitives/accordion";
import { cn } from "../../../primitives/utils";
import type { Rich } from "../../_shared/types";

/** 列表只读的字段; Faq.tsx 的公开 FaqItem / FaqGroup 结构上满足它, 这里不反向 import 以免成环. */
interface FaqItem {
  id?: string;
  q: Rich;
  a: Rich;
  open?: boolean;
}

interface FaqGroup {
  title?: Rich;
  items: FaqItem[];
}

type FaqVariant = (typeof FAQ_VARIANT)[keyof typeof FAQ_VARIANT];
type FaqClassNames = Partial<Record<(typeof FAQ_SLOTS)[number], string>>;

interface EntryProps {
  item: FaqItem;
  expand: boolean;
  classNames?: FaqClassNames;
}

/** 原生 details: 无 JS 也能展开; 搜索时命中项默认展开. */
function DetailsEntry({ item, expand, classNames }: EntryProps): React.JSX.Element {
  return (
    <details id={item.id} data-slot={V105_SLOT.faqItem} className={cn(C.item, classNames?.item)} open={item.open || expand || undefined}>
      <summary className={cn(C.summary, classNames?.summary)}>
        <span>{item.q}</span>
        <IconSlot source={ChevronDown} className={C.chevron} />
      </summary>
      <div className={cn(C.answer, classNames?.answer)}>{item.a}</div>
    </details>
  );
}

function valueOf(item: FaqItem, index: number): string {
  return item.id ?? String(index);
}

/** 库 Accordion: 可多开, 初始展开取 item.open, 搜索时全部展开; 键盘与 aria 由 radix 管. */
function AccordionEntries({ items, expand, classNames }: { items: FaqItem[]; expand: boolean; classNames?: FaqClassNames }): React.JSX.Element {
  const opened = items.flatMap((item, index) => (expand || item.open ? [valueOf(item, index)] : []));
  return (
    <Accordion type="multiple" defaultValue={opened} className={cn(C.list, classNames?.list)}>
      {items.map((item, index) => (
        <AccordionItem key={valueOf(item, index)} id={item.id} value={valueOf(item, index)} data-slot={V105_SLOT.faqItem} className={cn(A.item, classNames?.item)}>
          <AccordionTrigger className={cn(A.trigger, classNames?.summary)}>{item.q}</AccordionTrigger>
          <AccordionContent className={cn(A.answer, classNames?.answer)}>{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export interface FaqListProps {
  groups: FaqGroup[];
  query: string;
  text: V105Text;
  variant: FaqVariant;
  classNames?: FaqClassNames;
}

/**
 * Faq 的分组问答列表. 两种形态共用分组, 空结果与 classNames 槽位; 搜索词变化时重挂, 让命中项展开.
 *
 * .agents/notes/implemented/feature/2026-11-08-library-gaps.md
 */
export function FaqList({ groups, query, text, variant, classNames }: FaqListProps): React.JSX.Element {
  const visible = groups.filter((group) => group.items.length > 0);
  if (visible.length === 0) {
    return (
      <p role="status" className={K.muted}>
        {text.noResults}
      </p>
    );
  }
  const expand = query !== "";
  return (
    <div className={C.groupGap}>
      {visible.map((group, gi) => (
        <section key={typeof group.title === "string" ? group.title : gi} data-slot={V105_SLOT.faqGroup}>
          {group.title !== undefined && <h3 className={cn(K.groupTitle, C.groupTitle)}>{group.title}</h3>}
          {variant === FAQ_VARIANT.accordion ? (
            <AccordionEntries key={String(expand)} items={group.items} expand={expand} classNames={classNames} />
          ) : (
            <div className={cn(C.list, classNames?.list)}>
              {group.items.map((item, ii) => (
                <DetailsEntry key={`${item.id ?? ii}-${expand}`} item={item} expand={expand} classNames={classNames} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
