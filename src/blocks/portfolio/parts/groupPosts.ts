import type { PostItem } from "../../_shared/types";

/** 同一年份的一组文章, 组内按日期倒序. */
export interface PostYearGroup {
  year: number;
  items: PostItem[];
}

/** 文章日期 -> 毫秒时间戳; 无法解析时返回 NaN (调用方据此过滤). */
export function postTime(date: PostItem["date"]): number {
  if (date instanceof Date) return date.getTime();
  return new Date(date).getTime();
}

/**
 * 按年份倒序分组, 组内按日期倒序. 日期无法解析的文章被丢弃 (不渲染 Invalid Date).
 * 年份取本地时区, 与 Intl 日期格式化的口径一致.
 */
export function groupPostsByYear(posts: ReadonlyArray<PostItem>): PostYearGroup[] {
  const sorted = posts
    .map((post) => ({ post, time: postTime(post.date) }))
    .filter((entry) => Number.isFinite(entry.time))
    .sort((a, b) => b.time - a.time);
  const groups: PostYearGroup[] = [];
  for (const { post, time } of sorted) {
    const year = new Date(time).getFullYear();
    const last = groups[groups.length - 1];
    if (last !== undefined && last.year === year) last.items.push(post);
    else groups.push({ year, items: [post] });
  }
  return groups;
}
