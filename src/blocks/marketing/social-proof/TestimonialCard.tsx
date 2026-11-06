"use client";

import * as React from "react";
import { SOCIAL_CLASS, SOCIAL_SLOT, type QuoteClampLines } from "../../../constants/blocks-marketing-v104";
import { cn } from "../../../primitives/utils";
import type { BlockLabels, Logo, Person, Rich } from "../../_shared/types";
import { ExpandableQuote } from "./ExpandableQuote";
import { LogoMark, PersonLine, Rating } from "./parts";

export interface TestimonialCardProps {
  quote: Rich;
  person: Person;
  rating?: number;
  ratingMax?: number;
  logo?: Logo;
  href?: string;
  clampLines: QuoteClampLines | false;
  expandable?: boolean;
  large?: boolean;
  labels: Pick<BlockLabels, "expand" | "collapse">;
  className?: string;
}

/**
 * 单条引用卡: figure > (评分 + 来源 logo) + blockquote + figcaption(人物).
 * 卡片 h-full 拉齐同排高度, 人物行 mt-auto 贴底; 长引言由 ExpandableQuote 截断或展开.
 */
export function TestimonialCard({
  quote,
  person,
  rating,
  ratingMax,
  logo,
  href,
  clampLines,
  expandable,
  large,
  labels,
  className,
}: TestimonialCardProps): React.JSX.Element {
  const hasTop = rating !== undefined || logo !== undefined;
  return (
    <figure data-slot={SOCIAL_SLOT.testimonial} className={cn(SOCIAL_CLASS.card, className)}>
      {hasTop && (
        <div className={SOCIAL_CLASS.cardTop}>
          {rating !== undefined ? <Rating value={rating} max={ratingMax} /> : <span />}
          {logo && <LogoMark logo={logo} href={href} />}
        </div>
      )}
      <ExpandableQuote quote={quote} clampLines={clampLines} expandable={expandable} large={large} labels={labels} />
      <figcaption className={SOCIAL_CLASS.caption}>
        <PersonLine person={person} href={logo ? undefined : href} />
      </figcaption>
    </figure>
  );
}
