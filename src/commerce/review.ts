/**
 * 评价的纯函数: 星级分布, 平均分, 按星级筛选.
 */
import { REVIEW_DIGITS, REVIEW_STARS } from "../constants/model-commerce";
import type { RatingModel, ReviewModel } from "./catalog";

export interface StarBucket {
  readonly stars: number;
  readonly count: number;
  /** 0 到 1. */
  readonly share: number;
}

export interface ReviewSummary {
  readonly rating: RatingModel;
  /** 5 星到 1 星. */
  readonly buckets: readonly StarBucket[];
}

/** 星级取整并钳到 1 到 5. */
function clampStars(stars: number): number {
  const top = REVIEW_STARS[0];
  const bottom = REVIEW_STARS[REVIEW_STARS.length - 1];
  return Math.min(top, Math.max(bottom, Math.round(stars)));
}

/** 由评价算分布与平均分; 平均分保留 REVIEW_DIGITS 位小数. 没有评价时平均分为 0. */
export function summarizeReviews(reviews: readonly ReviewModel[]): ReviewSummary {
  const counts = new Map<number, number>(REVIEW_STARS.map((s) => [s, 0]));
  let total = 0;
  for (const r of reviews) {
    const s = clampStars(r.stars);
    counts.set(s, (counts.get(s) ?? 0) + 1);
    total += s;
  }
  const count = reviews.length;
  const scale = 10 ** REVIEW_DIGITS;
  const value = count === 0 ? 0 : Math.round((total / count) * scale) / scale;
  const buckets = REVIEW_STARS.map((stars) => {
    const n = counts.get(stars) ?? 0;
    return { stars, count: n, share: count === 0 ? 0 : n / count };
  });
  return { rating: { value, count }, buckets };
}

/** 按星级筛选; stars 为 undefined 时原样返回. */
export function filterReviews(reviews: readonly ReviewModel[], stars?: number): readonly ReviewModel[] {
  return stars === undefined ? reviews : reviews.filter((r) => clampStars(r.stars) === stars);
}
