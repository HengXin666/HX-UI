"use client";

import * as React from "react";
import { BLOCK_DEFAULT } from "../../constants/blocks";
import { FAQ_CLASS as C, FAQ_COLUMNS, FAQ_SLOTS, FAQ_VARIANT, V105_CLASS as K, V105_SLOT, pickV105Text, type V105Text } from "../../constants/blocks-marketing-pricing";
import { Input } from "../../primitives/input";
import { cn } from "../../primitives/utils";
import { BlockShell, resolveSlots } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { CtaButton, SectionHeading, renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, BlockShellSlot, BlockShellState, Cta, Rich, SectionHeadingData, SlotClassNames } from "../_shared/types";
import { FaqList } from "./faq/FaqList";

export interface FaqItem {
  /** 锚点 id (可直链到某个问题). */
  id?: string;
  q: Rich;
  a: Rich;
  /** 分类名; 不给 groups 时按它分组, 顺序取首次出现. */
  category?: string;
  /** 富文本问答的检索文本 (q / a 为节点时用它参与搜索). */
  searchText?: string;
  /** 初始展开. */
  open?: boolean;
}

export interface FaqGroup {
  title?: Rich;
  items: FaqItem[];
}

export interface FaqContact {
  title: Rich;
  description?: Rich;
  cta: Cta;
}

export type FaqVariant = (typeof FAQ_VARIANT)[keyof typeof FAQ_VARIANT];

/** Faq 部件槽位. summary 在 accordion 形态里落到触发按钮; split 改双栏比例, aside 是左栏 (默认 sticky). */
export type FaqSlot = (typeof FAQ_SLOTS)[number];

export interface FaqProps extends Omit<BlockBaseProps, "classNames"> {
  /** 外壳 slot + 部件 slot 的类名, 与默认类名合并 (同类工具类后者胜出); 函数形态收到 BlockShell 状态. */
  classNames?: SlotClassNames<BlockShellSlot | FaqSlot, BlockShellState>;
  heading?: SectionHeadingData;
  items?: FaqItem[];
  /** 显式分组; 给了就忽略 items. */
  groups?: FaqGroup[];
  /** 1 单栏; 2 双栏 (标题左, 问答右). */
  columns?: (typeof FAQ_COLUMNS)[keyof typeof FAQ_COLUMNS];
  /** 显示搜索框 (按问题与答案文本过滤). */
  searchable?: boolean;
  /** "还有问题? 联系我们" 尾部 CTA. */
  contact?: FaqContact;
  messages?: Partial<V105Text>;
  /** details 原生展开 (默认) / accordion 用库 Accordion, 展开收起带高度动画. */
  variant?: FaqVariant;
  ref?: React.Ref<HTMLElement>;
}

function toGroups(items: FaqItem[] | undefined, groups: FaqGroup[] | undefined): FaqGroup[] {
  if (groups) return groups;
  const order: FaqGroup[] = [];
  const byName = new Map<string | undefined, FaqGroup>();
  for (const item of items ?? []) {
    let group = byName.get(item.category);
    if (!group) {
      group = { title: item.category, items: [] };
      byName.set(item.category, group);
      order.push(group);
    }
    group.items.push(item);
  }
  return order;
}

function haystack(item: FaqItem, locale: string): string {
  const parts = [item.searchText, typeof item.q === "string" ? item.q : "", typeof item.a === "string" ? item.a : ""];
  return parts.filter(Boolean).join(" ").toLocaleLowerCase(locale);
}

function ContactCard({ contact }: { contact: FaqContact }): React.JSX.Element {
  return (
    <div data-slot={V105_SLOT.faqContact} className={C.contact}>
      <div>
        <p className={K.groupTitle}>{contact.title}</p>
        {contact.description !== undefined && <p className={K.muted}>{contact.description}</p>}
      </div>
      <CtaButton cta={contact.cta} />
    </div>
  );
}

/**
 * 常见问题: 单栏或双栏 (标题左, 问答右), 分类分组, 搜索过滤, 原生 details 兜底 (无 JS 可展开, 利于 SEO),
 * 尾部"还有问题? 联系我们" CTA. variant="accordion" 换成库 Accordion; classNames 给各部位追加样式.
 *
 * .agents/notes/implemented/feature/2026-11-08-library-gaps.md
 */
export function Faq({
  heading,
  items,
  groups,
  columns = FAQ_COLUMNS.single,
  searchable = false,
  contact,
  messages,
  variant = FAQ_VARIANT.details,
  classNames,
  labels: _labels,
  ref,
  ...shell
}: FaqProps): React.JSX.Element {
  const { locale } = useBlocks();
  const text = React.useMemo(() => pickV105Text(locale, messages), [locale, messages]);
  const [raw, setRaw] = React.useState("");
  const query = raw.trim().toLocaleLowerCase(locale);
  const all = React.useMemo(() => toGroups(items, groups), [items, groups]);
  const filtered = React.useMemo(
    () => (query ? all.map((group) => ({ ...group, items: group.items.filter((item) => haystack(item, locale).includes(query)) })) : all),
    [all, query, locale],
  );
  const state: BlockShellState = { tone: shell.tone ?? BLOCK_DEFAULT.tone, pad: shell.pad ?? BLOCK_DEFAULT.pad, width: shell.width ?? BLOCK_DEFAULT.width, align: shell.align ?? BLOCK_DEFAULT.align };
  const cls: Partial<Record<FaqSlot, string>> = resolveSlots(classNames, state);
  const shellClassNames = classNames as BlockBaseProps["classNames"];
  const split = columns === FAQ_COLUMNS.split;
  const titleId = React.useId();
  const body = (
    <div data-slot={V105_SLOT.faq} className={split ? undefined : C.single}>
      {searchable && (
        <div data-slot={V105_SLOT.faqSearch} className={C.search}>
          <Input type="search" value={raw} onChange={(event) => setRaw(event.target.value)} placeholder={text.searchFaq} aria-label={text.searchFaq} />
        </div>
      )}
      <FaqList groups={filtered} query={query} text={text} variant={variant} classNames={cls} />
      {contact && <ContactCard contact={contact} />}
    </div>
  );
  if (!split || !heading) {
    return (
      <BlockShell ref={ref} heading={heading} renderHeading={renderSectionHeading} {...shell} classNames={shellClassNames}>
        {body}
      </BlockShell>
    );
  }
  return (
    <BlockShell ref={ref} {...shell} classNames={shellClassNames} aria-labelledby={shell["aria-labelledby"] ?? titleId}>
      <div className={cn(C.split, cls.split)} data-columns={columns}>
        <div className={cn(C.aside, cls.aside)}>
          <SectionHeading {...heading} titleId={titleId} />
        </div>
        {body}
      </div>
    </BlockShell>
  );
}
