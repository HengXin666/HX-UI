"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";
import { FAQ_CLASS as C, FAQ_COLUMNS, V105_CLASS as K, V105_SLOT, pickV105Text, type V105Text } from "../../constants/blocks-marketing-v105";
import { IconSlot } from "../../layout/Icon";
import { Input } from "../../primitives/input";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { CtaButton, SectionHeading, renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, Rich, SectionHeadingData } from "../_shared/types";

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

export interface FaqProps extends BlockBaseProps {
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

/** 原生 details: 无 JS 也能展开; 搜索时命中项默认展开. */
function FaqEntry({ item, expand }: { item: FaqItem; expand: boolean }): React.JSX.Element {
  return (
    <details id={item.id} data-slot={V105_SLOT.faqItem} className={C.item} open={item.open || expand || undefined}>
      <summary className={C.summary}>
        <span>{item.q}</span>
        <IconSlot source={ChevronDown} className={C.chevron} />
      </summary>
      <div className={C.answer}>{item.a}</div>
    </details>
  );
}

function FaqList({ groups, query, text }: { groups: FaqGroup[]; query: string; text: V105Text }): React.JSX.Element {
  const visible = groups.filter((group) => group.items.length > 0);
  if (visible.length === 0) {
    return (
      <p role="status" className={K.muted}>
        {text.noResults}
      </p>
    );
  }
  return (
    <div className={C.groupGap}>
      {visible.map((group, gi) => (
        <section key={typeof group.title === "string" ? group.title : gi} data-slot={V105_SLOT.faqGroup}>
          {group.title !== undefined && <h3 className={cn(K.groupTitle, C.groupTitle)}>{group.title}</h3>}
          <div className={C.list}>
            {group.items.map((item, ii) => (
              <FaqEntry key={`${item.id ?? ii}-${query !== ""}`} item={item} expand={query !== ""} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
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
 * 尾部"还有问题? 联系我们" CTA.
 */
export function Faq({
  heading,
  items,
  groups,
  columns = FAQ_COLUMNS.single,
  searchable = false,
  contact,
  messages,
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
  const split = columns === FAQ_COLUMNS.split;
  const titleId = React.useId();
  const body = (
    <div data-slot={V105_SLOT.faq} className={split ? undefined : C.single}>
      {searchable && (
        <div data-slot={V105_SLOT.faqSearch} className={C.search}>
          <Input type="search" value={raw} onChange={(event) => setRaw(event.target.value)} placeholder={text.searchFaq} aria-label={text.searchFaq} />
        </div>
      )}
      <FaqList groups={filtered} query={query} text={text} />
      {contact && <ContactCard contact={contact} />}
    </div>
  );
  if (!split || !heading) {
    return (
      <BlockShell ref={ref} heading={heading} renderHeading={renderSectionHeading} {...shell}>
        {body}
      </BlockShell>
    );
  }
  return (
    <BlockShell ref={ref} {...shell} aria-labelledby={shell["aria-labelledby"] ?? titleId}>
      <div className={C.split} data-columns={columns}>
        <div className={C.aside}>
          <SectionHeading {...heading} titleId={titleId} />
        </div>
        {body}
      </div>
    </BlockShell>
  );
}
