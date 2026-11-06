"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import { MASK_FADE_DIRECTION } from "../../constants/effects";
import {
  CHANGELOG_DATE_FORMAT,
  SOCIAL_DEFAULT,
  SOCIAL_MASONRY_CLASS,
  SOCIAL_SLOT,
  TWEET_CLASS,
  type SocialMasonryColumns,
} from "../../constants/blocks-marketing-v104";
import { Button } from "../../primitives/button";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { useBlockLabels, useBlocks } from "../_shared/BlocksProvider";
import { renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, Logo, Person, Rich, SectionHeadingData } from "../_shared/types";
import { isoDate, toDate } from "./social-proof/changelog";
import { linkProps, LogoMark, PersonLine } from "./social-proof/parts";

/** 一条社区帖子 (推文, 帖子, 评论). */
export interface TweetItem {
  id?: string;
  person: Person;
  /** 账号名, 例 "@vercel"; 显示在姓名下方. */
  handle?: string;
  /** 正文, 保留换行; 长度不限, 瀑布流按内容自然增高. */
  body: Rich;
  date?: string | Date;
  /** 原帖链接: 挂在日期上 (没有日期时挂在平台 logo 上). */
  href?: string;
  /** 平台 logo (X, Bluesky, GitHub ...). */
  logo?: Logo;
}

export interface TweetWallProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  items: TweetItem[];
  /** 最大列数 (容器查询逐级增加). 默认 3. */
  columns?: SocialMasonryColumns;
  /** 水位折叠: 超过 --tweet-wall-collapsed 高度的部分渐隐, 底部给 "展开" 按钮. 默认开. */
  collapsible?: boolean;
  /** 按钮文案 (可见); 不给时回退 labels.more / labels.collapse. */
  moreLabel?: Rich;
  lessLabel?: Rich;
  dateFormat?: Intl.DateTimeFormatOptions;
  ref?: React.Ref<HTMLElement>;
}

const MASK_DIRECTION_BOTTOM = MASK_FADE_DIRECTION.bottom;

function Tweet({ item, dateFormat }: { item: TweetItem; dateFormat: Intl.DateTimeFormatOptions }): React.JSX.Element {
  const { formatDate } = useBlocks();
  const date = item.date !== undefined ? toDate(item.date) : undefined;
  const time = date ? <time dateTime={isoDate(date)}>{formatDate(date, dateFormat)}</time> : null;
  const handle = item.handle ? <span className={TWEET_CLASS.handle}>{item.handle}</span> : undefined;
  return (
    <li data-slot={SOCIAL_SLOT.tweet} className={TWEET_CLASS.item}>
      <div className={TWEET_CLASS.head}>
        <PersonLine person={item.person} extra={handle} />
        {item.logo && <LogoMark logo={item.logo} href={time ? undefined : item.href} />}
      </div>
      <div className={TWEET_CLASS.body}>{item.body}</div>
      {time &&
        (item.href ? (
          <a className={TWEET_CLASS.dateLink} {...linkProps(item.href, true)}>
            {time}
          </a>
        ) : (
          <span className={TWEET_CLASS.date}>{time}</span>
        ))}
    </li>
  );
}

/**
 * 社区推文墙 (supabase): CSS 多列瀑布流, 卡片 break-inside-avoid 按内容高度自然堆叠.
 * 水位折叠: 收起时容器限高, 真溢出时底边渐隐 (复用 effects 的 .hx-mask-fade 规则), 底部给 "展开";
 * 按钮 aria-expanded + aria-controls. 内容不足一屏时 (未溢出) 不出现按钮.
 */
export function TweetWall({
  heading,
  items,
  columns = SOCIAL_DEFAULT.tweetColumns,
  collapsible = true,
  moreLabel,
  lessLabel,
  dateFormat = CHANGELOG_DATE_FORMAT,
  labels: labelsProp,
  ...base
}: TweetWallProps): React.JSX.Element {
  const labels = useBlockLabels(labelsProp);
  const id = React.useId();
  const ref = React.useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [overflow, setOverflow] = React.useState(false);
  const collapsed = collapsible && !expanded;

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !collapsed) return;
    const measure = () => setOverflow(el.scrollHeight - el.clientHeight > 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [collapsed, items.length]);

  const list = (
    <ul className={cn(TWEET_CLASS.wall, SOCIAL_MASONRY_CLASS[columns])}>
      {items.map((item, index) => (
        <Tweet key={item.id ?? index} item={item} dateFormat={dateFormat} />
      ))}
    </ul>
  );
  const fading = collapsed && overflow;

  return (
    <BlockShell {...base} heading={heading} renderHeading={renderSectionHeading}>
      <div data-slot={SOCIAL_SLOT.tweetWall} data-state={collapsed ? "collapsed" : "expanded"}>
        <div
          ref={ref}
          id={id}
          data-direction={fading ? MASK_DIRECTION_BOTTOM : undefined}
          className={cn(collapsed && TWEET_CLASS.collapsed, fading && TWEET_CLASS.mask)}
        >
          {list}
        </div>
        {collapsible && (overflow || expanded) && (
          <div className={TWEET_CLASS.toggleBar}>
            <Button
              type={BUTTON_TYPE}
              variant="outline"
              data-slot={SOCIAL_SLOT.tweetToggle}
              aria-expanded={expanded}
              aria-controls={id}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? (lessLabel ?? labels.collapse) : (moreLabel ?? labels.more)}
            </Button>
          </div>
        )}
      </div>
    </BlockShell>
  );
}
