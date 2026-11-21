"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import { REVIEW_CLASS as C, REVIEW_DEAL, REVIEW_PAGE, REVIEW_TEXT } from "../../constants/sections-commerce";
import { RatingSummary } from "../../commerce";
import { BlockShell, renderSectionHeading } from "../_shared";
import type { BlockBaseProps, SectionHeadingData } from "../_shared";
import { useIntersection } from "../../hooks/browser/useIntersection";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import type { ProductModel, ReviewModel } from "../../commerce/catalog";
import { filterReviews, summarizeReviews } from "../../commerce/review";
import { describeSelection } from "../../commerce/variant";
import { dealOffset } from "../../motion/recipe";

export interface ReviewBoardProps extends Omit<BlockBaseProps, "slots"> {
  heading?: SectionHeadingData;
  reviews: readonly ReviewModel[];
  /** 给了商品时, 每条评价显示买的组合 (颜色: 沙色 / 尺码: 42). */
  product?: ProductModel;
  /** 受控的星级筛选; undefined 为全部. */
  stars?: number;
  onStarsChange?: (stars: number | undefined) => void;
  pageSize?: number;
  texts?: Partial<typeof REVIEW_TEXT>;
}

/**
 * 评价区: 左侧评分摘要 + 星级分布 (每条是筛选按钮, aria-pressed), 右侧按筛选列出评价.
 * 分布条进视口时按发牌节奏从 0 长到占比 (只动 transform), 减弱动效直接终态; 筛选变化不重播.
 */
export function ReviewBoard({ heading, reviews, product, stars, onStarsChange, pageSize = REVIEW_PAGE, texts, ...shell }: ReviewBoardProps): React.JSX.Element {
  const t = { ...REVIEW_TEXT, ...texts };
  const summary = React.useMemo(() => summarizeReviews(reviews), [reviews]);
  const [own, setOwn] = React.useState<number | undefined>(undefined);
  const active = onStarsChange ? stars : own;
  const pick = (next: number | undefined): void => {
    if (!onStarsChange) setOwn(next);
    onStarsChange?.(next);
  };
  const reduced = useReducedMotion();
  const { ref: barsRef, entry } = useIntersection<HTMLDivElement>();
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    if (reduced || entry?.isIntersecting || typeof IntersectionObserver === "undefined") setSeen(true);
  }, [entry, reduced]);
  const shown = filterReviews(reviews, active).slice(0, pageSize);
  const total = summary.buckets.length;

  return (
    <BlockShell {...shell} heading={heading} renderHeading={heading ? renderSectionHeading : undefined}>
      <div className={C.board} data-slot="review-board">
        <div className={C.side}>
          <RatingSummary value={summary.rating.value} count={summary.rating.count} />
          <div ref={barsRef} role="group" aria-label={t.filter} className={C.bars}>
            {summary.buckets.map((b, i) => (
              <button key={b.stars} type={BUTTON_TYPE} aria-pressed={active === b.stars} className={C.bar}
                onClick={() => pick(active === b.stars ? undefined : b.stars)}
                aria-label={`${b.stars} ${t.star}, ${b.count} ${t.showing}`}>
                <span aria-hidden>{b.stars} {t.star}</span>
                <span aria-hidden className={C.track}>
                  <span className={C.fill} data-share={b.share}
                    style={{ transform: `scaleX(${seen ? b.share : 0})`, transitionDelay: `${dealOffset(i, total, REVIEW_DEAL.firstMs, REVIEW_DEAL.lastMs)}ms` }} />
                </span>
                <span aria-hidden className={C.count}>{b.count}</span>
              </button>
            ))}
          </div>
          {active !== undefined && <button type={BUTTON_TYPE} className={C.clear} onClick={() => pick(undefined)}>{t.clear}</button>}
        </div>
        {shown.length === 0 ? (
          <p className={C.empty}>{t.empty}</p>
        ) : (
          <ul className={C.list} aria-live="polite">
            {shown.map((r) => (
              <li key={r.id} className={C.item}>
                <div className={C.meta}>
                  <span className={C.author}>{r.author}</span>
                  <span className={C.stars}>{r.stars} {t.star}</span>
                  <time dateTime={r.date}>{r.date}</time>
                  {product && r.options && <span>{describeSelection(product, r.options)}</span>}
                </div>
                <p className={C.body}>{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BlockShell>
  );
}
