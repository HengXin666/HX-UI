"use client";

import { ArrowRightIcon, RssIcon } from "lucide-react";
import type * as React from "react";
import { PORTFOLIO_CLASS, PORTFOLIO_SLOT, PORTFOLIO_TEXT_ZH } from "../../constants/blocks-portfolio-v111";
import { IconSlot } from "../../layout/Icon";
import { Prose } from "../../typography/Prose";
import { BlockShell } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { SectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, LinkItem, PostItem, SectionHeadingData } from "../_shared/types";
import { groupPostsByYear, postTime } from "./parts/groupPosts";
import { TagList } from "./parts/TagList";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
const FULL_DATE_FORMAT: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };

export interface PostListProps extends BlockBaseProps {
  items: ReadonlyArray<PostItem>;
  heading?: SectionHeadingData;
  /** 按年份分组 (默认 true); false 时平铺, 日期带年份. */
  groupByYear?: boolean;
  /** 只显示最近 N 篇 (配合 allPosts 入口用在首页). */
  limit?: number;
  /** RSS 地址; 给了就在标题行渲染 RSS 图标位. */
  rssHref?: string;
  rssLabel?: string;
  /** "全部文章"入口. */
  allPosts?: LinkItem;
  /** 日期格式, 走 BlocksProvider 的 Intl.DateTimeFormat. */
  dateFormat?: Intl.DateTimeFormatOptions;
  ref?: React.Ref<HTMLElement>;
}

function Row({ post, date }: { post: PostItem; date: string }): React.JSX.Element {
  return (
    <li data-slot={PORTFOLIO_SLOT.post} className={PORTFOLIO_CLASS.postRow}>
      <Prose size="md">
        <div className={PORTFOLIO_CLASS.postHead}>
          <a href={post.href}>{post.title}</a>
          <time dateTime={new Date(post.date).toISOString()} className={PORTFOLIO_CLASS.postDate}>
            {date}
          </time>
        </div>
        {post.excerpt !== undefined && <p className={PORTFOLIO_CLASS.heroBio}>{post.excerpt}</p>}
      </Prose>
      <TagList tags={post.tags} />
    </li>
  );
}

/**
 * 文章列表 (leerob.com 式极简排版): 标题 + 日期 + 可选摘要 + 可选标签, 默认按年份倒序分组.
 * 链接下划线, 行高, 字号全部来自 Prose; 日期走 Intl (BlocksProvider.formatDate).
 * 标题行可带 RSS 图标位与"全部文章"入口.
 */
export function PostList({
  items,
  heading,
  groupByYear = true,
  limit,
  rssHref,
  rssLabel = PORTFOLIO_TEXT_ZH.rss,
  allPosts,
  dateFormat,
  labels,
  ref,
  ...shell
}: PostListProps): React.JSX.Element {
  const { formatDate } = useBlocks();
  const valid = items.filter((post) => Number.isFinite(postTime(post.date)));
  const shown = limit !== undefined ? [...valid].sort((a, b) => postTime(b.date) - postTime(a.date)).slice(0, limit) : valid;
  const actions =
    rssHref !== undefined || allPosts !== undefined ? (
      <div className={PORTFOLIO_CLASS.postsActions}>
        {rssHref !== undefined && (
          <a href={rssHref} aria-label={rssLabel} title={rssLabel} className={PORTFOLIO_CLASS.rssLink}>
            <IconSlot source={RssIcon} />
          </a>
        )}
        {allPosts !== undefined && (
          <a href={allPosts.href} className={PORTFOLIO_CLASS.allPostsLink}>
            {allPosts.label ?? PORTFOLIO_TEXT_ZH.allPosts}
            <IconSlot source={ArrowRightIcon} className={PORTFOLIO_CLASS.arrow} />
          </a>
        )}
      </div>
    ) : null;
  const renderHeading = (h: SectionHeadingData, id: string): React.ReactNode => (
    <SectionHeading {...h} titleId={id}>
      {actions}
    </SectionHeading>
  );
  return (
    <BlockShell {...shell} ref={ref} heading={heading} renderHeading={heading ? renderHeading : undefined}>
      {heading === undefined && actions !== null && <div className={PORTFOLIO_CLASS.postsHeader}>{actions}</div>}
      {groupByYear ? (
        <div data-slot={PORTFOLIO_SLOT.posts} className={PORTFOLIO_CLASS.postsGroups}>
          {groupPostsByYear(shown).map((group) => (
            <section key={group.year} data-slot={PORTFOLIO_SLOT.postYear} aria-label={String(group.year)} className={PORTFOLIO_CLASS.yearGroup}>
              <p aria-hidden className={PORTFOLIO_CLASS.yearLabel}>
                {group.year}
              </p>
              <ul className={PORTFOLIO_CLASS.postItems}>
                {group.items.map((post) => (
                  <Row key={post.href} post={post} date={formatDate(post.date, dateFormat ?? DATE_FORMAT)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul data-slot={PORTFOLIO_SLOT.posts} className={PORTFOLIO_CLASS.postItems}>
          {shown.map((post) => (
            <Row key={post.href} post={post} date={formatDate(post.date, dateFormat ?? FULL_DATE_FORMAT)} />
          ))}
        </ul>
      )}
    </BlockShell>
  );
}
