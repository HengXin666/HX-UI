"use client";

import * as React from "react";
import {
  DASH_CLASS,
  DASH_DATE_FORMAT,
  DASH_DEFAULT,
  DASH_SLOT,
  DASH_TIME_STEPS,
  dashText,
  type ACTIVITY_FEED_SLOTS,
} from "../../constants/blocks-dashboard-v110";
import { IconSlot } from "../../layout/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "../../primitives/avatar";
import { cn } from "../../primitives/utils";
import { resolveSlots } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { CtaButton } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, IconName, Person, Rich, SlotClassNames } from "../_shared/types";

export type ActivityFeedSlot = (typeof ACTIVITY_FEED_SLOTS)[number];

/** 一条动态: "{actor} {action} {target}", 时间可给 Date / 时间戳 / ISO 串 (相对时间走 Intl). */
export interface ActivityItem {
  id?: string;
  actor: Person;
  action: Rich;
  time: Date | number | string;
  target?: { label: Rich; href?: string };
  /** 无头像时代替头像的图标 (系统事件). */
  icon?: IconName;
}

export interface ActivityFeedState {
  count: number;
  empty: boolean;
}

export interface ActivityFeedProps extends Pick<BlockBaseProps, "id" | "className" | "style" | "slots" | "aria-label"> {
  items: ReadonlyArray<ActivityItem>;
  /** 面板标题; 默认取 labels.activity. */
  title?: Rich;
  /** 最多显示几条; 默认 8. */
  max?: number;
  /** 超出 max 或想跳转完整列表时的入口. */
  viewAll?: Cta;
  /** 相对时间的基准时刻; 默认渲染时的 Date.now() (SSR 时建议显式给出, 避免水合差异). */
  now?: Date | number;
  /** 不要外框 (嵌进别的卡片时). */
  bare?: boolean;
  classNames?: SlotClassNames<ActivityFeedSlot, ActivityFeedState>;
  labels?: Partial<Record<string, string>>;
  ref?: React.Ref<HTMLElement>;
}

/** 相对时间: 7 天内用 Intl.RelativeTimeFormat ("3 分钟前"), 更早用绝对日期. */
function formatWhen(value: Date | number | string, now: number, locale: string, formatDate: (v: Date, o?: Intl.DateTimeFormatOptions) => string): { label: string; iso: string } {
  const date = value instanceof Date ? value : new Date(value);
  const iso = Number.isNaN(date.getTime()) ? "" : date.toISOString();
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  if (Number.isNaN(abs) || abs > DASH_DEFAULT.relativeLimitMs) return { label: Number.isNaN(abs) ? String(value) : formatDate(date, DASH_DATE_FORMAT), iso };
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [limit, unit, size] of DASH_TIME_STEPS) {
    if (abs < limit) return { label: rtf.format(Math.round(diff / size), unit), iso };
  }
  return { label: formatDate(date, DASH_DATE_FORMAT), iso };
}

/** 名字首字, 作为头像兜底. */
function initials(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? "";
}

/**
 * 动态流 (设计文档 4.5): 头像 + "谁 做了什么 对象" + 相对时间. 列表为语义 <ol>, 时间为 <time dateTime>.
 * 时间格式全部走 Intl 与 BlocksProvider 的 locale; 空列表显示 labels.activityEmpty.
 */
export function ActivityFeed({
  items,
  title,
  max = DASH_DEFAULT.feedMax,
  viewAll,
  now,
  bare = false,
  classNames,
  labels,
  slots,
  className,
  style,
  id,
  ref,
  "aria-label": ariaLabel,
}: ActivityFeedProps): React.JSX.Element {
  const { locale, formatDate } = useBlocks();
  const text = dashText(locale, labels);
  const titleId = React.useId();
  const base = now === undefined ? Date.now() : now instanceof Date ? now.getTime() : now;
  const shown = items.slice(0, max);
  const empty = shown.length === 0;
  const cls = resolveSlots<ActivityFeedSlot, ActivityFeedState, string>(classNames, { count: items.length, empty });
  return (
    <section
      ref={ref}
      id={id}
      style={style}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel === undefined ? titleId : undefined}
      data-slot={DASH_SLOT.feed}
      data-empty={empty || undefined}
      className={cn(!bare && DASH_CLASS.panel, cls.root, className)}
    >
      <div className={cn(DASH_CLASS.panelHeader, bare && DASH_CLASS.headerBare)}>
        <h3 id={titleId} className={cn(DASH_CLASS.panelTitle, DASH_CLASS.panelHeadText)}>
          {title ?? text.activity}
        </h3>
        {viewAll !== undefined && <CtaButton cta={{ variant: "link", size: "sm", ...viewAll, label: viewAll.label ?? text.viewAll }} />}
      </div>
      {slots?.before}
      <div className={bare ? undefined : DASH_CLASS.panelBody}>
        {empty ? (
          <p className={DASH_CLASS.feedEmpty}>{text.activityEmpty}</p>
        ) : (
          <ol className={cn(DASH_CLASS.feedList, cls.list)}>
            {shown.map((item, index) => {
              const when = formatWhen(item.time, base, locale, formatDate);
              return (
                <li key={item.id ?? `${item.actor.name}-${index}`} data-slot={DASH_SLOT.feedItem} className={cn(DASH_CLASS.feedItem, cls.item)}>
                  <Avatar className={cn(DASH_CLASS.feedAvatar, cls.avatar)}>
                    {item.actor.avatar?.src !== undefined && <AvatarImage src={item.actor.avatar.src} alt={item.actor.avatar.alt} />}
                    <AvatarFallback>{item.icon !== undefined ? <IconSlot source={item.icon} /> : initials(item.actor.name)}</AvatarFallback>
                  </Avatar>
                  <p className={cn(DASH_CLASS.feedText, cls.text)}>
                    {item.actor.href !== undefined ? (
                      <a href={item.actor.href} className={cn(DASH_CLASS.feedActor, DASH_CLASS.focus)}>
                        {item.actor.name}
                      </a>
                    ) : (
                      <span className={DASH_CLASS.feedActor}>{item.actor.name}</span>
                    )}{" "}
                    {item.action}
                    {item.target !== undefined && (
                      <>
                        {" "}
                        {item.target.href !== undefined ? (
                          <a href={item.target.href} className={cn(DASH_CLASS.feedTarget, DASH_CLASS.focus)}>
                            {item.target.label}
                          </a>
                        ) : (
                          <span className={DASH_CLASS.feedActor}>{item.target.label}</span>
                        )}
                      </>
                    )}
                  </p>
                  <time dateTime={when.iso || undefined} data-slot={DASH_SLOT.feedTime} className={cn(DASH_CLASS.feedTime, cls.time)}>
                    {when.label}
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      {slots?.after}
    </section>
  );
}
