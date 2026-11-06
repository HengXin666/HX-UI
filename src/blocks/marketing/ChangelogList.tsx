"use client";

import * as React from "react";
import {
  CHANGELOG_CLASS,
  CHANGELOG_DATE_FORMAT,
  CHANGELOG_GROUP,
  CHANGELOG_MONTH_FORMAT,
  CHANGELOG_VARIANT,
  SOCIAL_BADGE_VARIANT,
  SOCIAL_COLS_CLASS,
  SOCIAL_DEFAULT,
  SOCIAL_SLOT,
  type SocialColumns,
} from "../../constants/blocks-marketing-v104";
import { Badge as BadgeChip } from "../../layout/Badge";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { CtaButton, renderSectionHeading } from "../_shared/SectionHeading";
import type { Badge, BlockBaseProps, Cta, Media, Rich, SectionHeadingData } from "../_shared/types";
import { groupEntries, isoDate, toDate, type ChangelogGroupBy } from "./social-proof/changelog";
import { linkProps, MediaView } from "./social-proof/parts";

export type ChangelogVariant = (typeof CHANGELOG_VARIANT)[keyof typeof CHANGELOG_VARIANT];
export type { ChangelogGroupBy };

/** 一条更新日志. */
export interface ChangelogEntry {
  id?: string;
  /** ISO 串或 Date; 显示走 Intl (BlocksProvider.formatDate). 无效日期不显示, 不报错. */
  date: string | Date;
  version?: string;
  title: Rich;
  summary?: Rich;
  tags?: Badge[];
  href?: string;
  external?: boolean;
  /** 只在 cards 形态显示 (linear 的 changelog 四卡). */
  media?: Media;
}

export interface ChangelogListProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  items: ChangelogEntry[];
  /** list 时间线式列表 / cards 卡片网格. 默认 list. */
  variant?: ChangelogVariant;
  /** none / month (按月, 组名走 Intl) / version (按主次版本, v2.4.x 归入 v2.4). 默认 none. */
  groupBy?: ChangelogGroupBy;
  /** 只显示前 N 条 (首页摘要); 配合 viewAll 指向完整日志. */
  limit?: number;
  /** "查看全部" 入口. */
  viewAll?: Cta;
  /** cards 形态的最大列数. 默认 4. */
  columns?: SocialColumns;
  dateFormat?: Intl.DateTimeFormatOptions;
  monthFormat?: Intl.DateTimeFormatOptions;
  ref?: React.Ref<HTMLElement>;
}

const H_TAG = { 3: "h3", 4: "h4" } as const;

/** 单条: 日期 + 版本号 (元信息) / 标题 (可链接) / 摘要 / 标签. */
function Entry({
  entry,
  cards,
  level,
  dateFormat,
}: {
  entry: ChangelogEntry;
  cards: boolean;
  level: 3 | 4;
  dateFormat: Intl.DateTimeFormatOptions;
}): React.JSX.Element {
  const { formatDate } = useBlocks();
  const date = toDate(entry.date);
  const Title = H_TAG[level];
  const meta = (
    <div className={CHANGELOG_CLASS.meta}>
      {date && <time dateTime={isoDate(date)}>{formatDate(date, dateFormat)}</time>}
      {entry.version && <BadgeChip variant="outline">{entry.version}</BadgeChip>}
    </div>
  );
  return (
    <article data-slot={SOCIAL_SLOT.changelogEntry} className={cards ? CHANGELOG_CLASS.cardEntry : CHANGELOG_CLASS.listEntry}>
      {cards && entry.media && <MediaView media={entry.media} />}
      {meta}
      <div className={CHANGELOG_CLASS.body}>
        <Title className={CHANGELOG_CLASS.title}>
          {entry.href ? (
            <a className={CHANGELOG_CLASS.titleLink} {...linkProps(entry.href, entry.external)}>
              {entry.title}
            </a>
          ) : (
            entry.title
          )}
        </Title>
        {entry.summary !== undefined && <div className={CHANGELOG_CLASS.summary}>{entry.summary}</div>}
        {entry.tags && entry.tags.length > 0 && (
          <ul className={CHANGELOG_CLASS.tags}>
            {entry.tags.map((tag, index) => (
              <li key={typeof tag.label === "string" ? tag.label : index}>
                <BadgeChip variant={SOCIAL_BADGE_VARIANT[tag.tone ?? "neutral"]}>{tag.label}</BadgeChip>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

/**
 * 更新日志区块 (审计 B18; linear changelog 四卡, stripe "What's happening").
 * 分组时组名是 h3, 条目标题降为 h4; 不分组时条目标题为 h3 (区块标题是 h2).
 * 标题 / 摘要不假设长度: 长词断行, 卡片 h-full 拉齐.
 */
export function ChangelogList({
  heading,
  items,
  variant = SOCIAL_DEFAULT.changelogVariant,
  groupBy = SOCIAL_DEFAULT.changelogGroup,
  limit,
  viewAll,
  columns = SOCIAL_DEFAULT.changelogColumns,
  dateFormat = CHANGELOG_DATE_FORMAT,
  monthFormat = CHANGELOG_MONTH_FORMAT,
  labels: _labels,
  ...base
}: ChangelogListProps): React.JSX.Element {
  const { formatDate } = useBlocks();
  const visible = limit !== undefined && limit >= 0 ? items.slice(0, limit) : items;
  const groups = groupEntries(visible, groupBy);
  const grouped = groupBy !== CHANGELOG_GROUP.none;
  const cards = variant === CHANGELOG_VARIANT.cards;
  const level = grouped ? 4 : 3;

  const renderList = (entries: ChangelogEntry[]) => (
    <ol className={cards ? cn(CHANGELOG_CLASS.cards, SOCIAL_COLS_CLASS[columns]) : CHANGELOG_CLASS.list}>
      {entries.map((entry, index) => (
        <li key={entry.id ?? index}>
          <Entry entry={entry} cards={cards} level={level} dateFormat={dateFormat} />
        </li>
      ))}
    </ol>
  );

  return (
    <BlockShell {...base} heading={heading} renderHeading={renderSectionHeading}>
      <div data-slot={SOCIAL_SLOT.changelog} data-variant={variant} data-group={groupBy}>
        {grouped ? (
          <div className={CHANGELOG_CLASS.groups}>
            {groups.map((group) => (
              <div key={group.key} data-slot={SOCIAL_SLOT.changelogGroup}>
                {(group.date || group.version) && (
                  <h3 className={CHANGELOG_CLASS.groupTitle}>{group.date ? formatDate(group.date, monthFormat) : group.version}</h3>
                )}
                {renderList(group.items)}
              </div>
            ))}
          </div>
        ) : (
          renderList(groups[0]?.items ?? [])
        )}
        {viewAll && (
          <div data-slot={SOCIAL_SLOT.changelogFooter} className={CHANGELOG_CLASS.footer}>
            <CtaButton cta={viewAll} />
          </div>
        )}
      </div>
    </BlockShell>
  );
}
