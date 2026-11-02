/**
 * ChangelogList 的纯逻辑: 日期解析, ISO 日期串, 按月 / 按版本分组. 不依赖 React, 便于单测.
 * 分组保持输入顺序 (约定调用方按新到旧给出), 组的顺序取该组第一条出现的位置.
 */
import {
  CHANGELOG_GROUP,
  DATE_INVALID_KEY,
  DATE_ONLY_PATTERN,
  MONTH_KEY_PAD,
  VERSION_GROUP_PATTERN,
  VERSION_JOIN,
} from "../../../constants/blocks-marketing-v104";

export type ChangelogGroupBy = (typeof CHANGELOG_GROUP)[keyof typeof CHANGELOG_GROUP];

/** 分组输入只要求日期与可选版本号. */
export interface Groupable {
  date: string | Date;
  version?: string;
}

export interface EntryGroup<T> {
  key: string;
  /** 组标题的原始依据: 月分组时为该月第一天, 版本分组时为版本前缀. */
  date?: Date;
  version?: string;
  items: T[];
}

/** 字符串或 Date -> Date; 无效时返回 undefined (不抛错, 条目照常渲染, 只是不显示日期). */
export function toDate(value: string | Date): Date | undefined {
  // 纯日期串 "2026-10-28" 按本地日历日解析; new Date() 会当成 UTC 零点, 西半球显示成前一天
  const dateOnly = typeof value === "string" ? DATE_ONLY_PATTERN.exec(value.trim()) : null;
  const date = value instanceof Date ? value : dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const pad = (n: number): string => String(n).padStart(MONTH_KEY_PAD, "0");

/** <time dateTime> 用的 YYYY-MM-DD, 取本地日历日 (与 Intl 显示的那天一致, 不被 UTC 换算挪一天). */
export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 版本前缀: "v2.4.1" -> "v2.4", "3" -> "3"; 无数字时原样. */
export function versionGroup(version: string): string {
  const match = VERSION_GROUP_PATTERN.exec(version.trim());
  if (!match) return version.trim();
  const [, prefix, major, minor] = match;
  return minor === undefined ? `${prefix}${major}` : `${prefix}${major}${VERSION_JOIN}${minor}`;
}

function monthKey(date: Date | undefined): string {
  if (!date) return DATE_INVALID_KEY;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** 分组; groupBy="none" 时返回一个无标题的组. 无版本号的条目在版本分组下归入空键组. */
export function groupEntries<T extends Groupable>(items: readonly T[], groupBy: ChangelogGroupBy): EntryGroup<T>[] {
  if (groupBy === CHANGELOG_GROUP.none) return [{ key: CHANGELOG_GROUP.none, items: [...items] }];
  const groups = new Map<string, EntryGroup<T>>();
  for (const item of items) {
    const date = toDate(item.date);
    const version = item.version ? versionGroup(item.version) : undefined;
    const key = groupBy === CHANGELOG_GROUP.month ? monthKey(date) : (version ?? "");
    let group = groups.get(key);
    if (!group) {
      group =
        groupBy === CHANGELOG_GROUP.month
          ? { key, date: date ? new Date(date.getFullYear(), date.getMonth(), 1) : undefined, items: [] }
          : { key, version, items: [] };
      groups.set(key, group);
    }
    group.items.push(item);
  }
  return [...groups.values()];
}
