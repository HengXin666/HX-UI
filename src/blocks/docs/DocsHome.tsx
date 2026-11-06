"use client";

import { SearchIcon } from "lucide-react";
import type * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import { DOCS_CLASS, DOCS_DEFAULT, DOCS_HOME_SLOTS, DOCS_SLOT } from "../../constants/blocks-docs-v109";
import { IconSlot } from "../../layout/Icon";
import { cn } from "../../primitives/utils";
import { BlockShell, resolveSlots } from "../_shared/BlockShell";
import { SectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, BlockTitleSize, DocsHomeCard, SearchSpec, SectionHeadingData, SlotClassNames } from "../_shared/types";
import { useDocsText } from "./parts/labels";

export type DocsHomeSlot = (typeof DOCS_HOME_SLOTS)[number];

export interface DocsHomeHero extends SectionHeadingData {
  titleSize?: BlockTitleSize;
}

export interface DocsHomeCards {
  heading?: SectionHeadingData;
  items: ReadonlyArray<DocsHomeCard>;
}

export interface DocsHomeProps extends Omit<BlockBaseProps, "classNames" | "labels"> {
  /** 首屏: 眉标 / 标题 / 导语 / 双 CTA (shadcn: 公告胶囊 + 双 CTA; ant.design: 标题 + 开始使用). */
  hero: DocsHomeHero;
  /** 入口卡片墙 (组件 / 指南 / 主题 / 资源). */
  cards: DocsHomeCards;
  /** 检索入口; 面板由调用方实现 (onOpen 打开 Command 等). */
  search?: SearchSpec;
  classNames?: SlotClassNames<DocsHomeSlot>;
  labels?: Partial<Record<string, string>>;
  ref?: React.Ref<HTMLElement>;
}

function SearchEntry({ spec, label, className }: { spec: SearchSpec; label: string; className?: string }): React.JSX.Element {
  const body = (
    <>
      <IconSlot source={SearchIcon} className={DOCS_CLASS.homeSearchIcon} />
      <span className={DOCS_CLASS.homeSearchText}>{spec.placeholder ?? label}</span>
      {spec.shortcut !== "" && <kbd className={DOCS_CLASS.homeKbd}>{spec.shortcut ?? DOCS_DEFAULT.searchShortcut}</kbd>}
    </>
  );
  const cls = cn(DOCS_CLASS.homeSearch, DOCS_CLASS.focus, className);
  if (spec.href !== undefined) {
    return (
      <a href={spec.href} data-slot={DOCS_SLOT.homeSearch} aria-label={label} className={cls}>
        {body}
      </a>
    );
  }
  return (
    <button type={BUTTON_TYPE} data-slot={DOCS_SLOT.homeSearch} aria-label={label} aria-haspopup="dialog" onClick={spec.onOpen} className={cls}>
      {body}
    </button>
  );
}

function HomeCard({ card, className }: { card: DocsHomeCard; className?: string }): React.JSX.Element {
  return (
    <li data-slot={DOCS_SLOT.homeCard} className={cn(DOCS_CLASS.homeCard, className)}>
      {card.icon !== undefined && (
        <span aria-hidden className={DOCS_CLASS.homeCardIcon}>
          <IconSlot source={card.icon} />
        </span>
      )}
      <h3 className={DOCS_CLASS.homeCardTitle}>
        <a
          href={card.href}
          target={card.external ? "_blank" : undefined}
          rel={card.external ? "noreferrer noopener" : undefined}
          className={cn(DOCS_CLASS.homeCardLink, DOCS_CLASS.focus)}
        >
          {card.title}
        </a>
      </h3>
      {card.description !== undefined && <p className={DOCS_CLASS.homeCardBody}>{card.description}</p>}
      {card.badge !== undefined && <span className={DOCS_CLASS.homeCardBadge}>{card.badge}</span>}
    </li>
  );
}

/**
 * 文档站首页: 首屏标题组 + 检索入口 + 入口卡片墙, 可经 slots.media 放组件实景墙 (shadcn 式 "展示即组件").
 * 标题为 h1 (页面首屏); 卡片整卡可点 (标题链接的 after 覆盖), 键盘焦点仍落在链接上.
 */
export function DocsHome({ hero, cards, search, classNames, labels, slots, ref, align = "center", pad = "lg", ...shell }: DocsHomeProps): React.JSX.Element {
  const text = useDocsText(labels);
  const cls = resolveSlots<DocsHomeSlot, void, string>(classNames, undefined);
  const { titleSize = "2xl", ...heading } = hero;
  return (
    <BlockShell
      {...shell}
      ref={ref}
      align={align}
      pad={pad}
      heading={heading}
      renderHeading={(h, hid) => (
        <div data-slot={DOCS_SLOT.homeHero} className={cn(DOCS_CLASS.homeHero, cls.hero)}>
          <SectionHeading {...h} titleId={hid} level={1} titleSize={titleSize}>
            {search !== undefined && <SearchEntry spec={search} label={text.search} className={cls.search} />}
          </SectionHeading>
        </div>
      )}
      slots={{ before: slots?.before, after: slots?.after }}
      className={cls.root ? cn(cls.root, shell.className) : shell.className}
    >
      <div data-slot={DOCS_SLOT.home}>
        {slots?.media}
        {cards.heading !== undefined && <SectionHeading {...cards.heading} level={2} titleSize="md" />}
        <ul data-slot={DOCS_SLOT.homeCards} className={cn(DOCS_CLASS.homeCards, cls.cards)}>
          {cards.items.map((card) => (
            <HomeCard key={card.href} card={card} className={cls.card} />
          ))}
        </ul>
      </div>
    </BlockShell>
  );
}
