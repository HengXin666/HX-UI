"use client";

import * as React from "react";
import {
  SOCIAL_COLS_CLASS,
  SOCIAL_DEFAULT,
  SOCIAL_SLOT,
  TESTIMONIALS_CLASS,
  TESTIMONIALS_VARIANT,
  type CarouselPerView,
  type QuoteClampLines,
  type SocialColumns,
} from "../../constants/blocks-marketing-v104";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { useBlockLabels } from "../_shared/BlocksProvider";
import { renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, Logo, Person, Rich, SectionHeadingData } from "../_shared/types";
import { TestimonialCard } from "./social-proof/TestimonialCard";
import { TestimonialCarousel, TestimonialMarquee } from "./social-proof/TestimonialTracks";

export type TestimonialsVariant = (typeof TESTIMONIALS_VARIANT)[keyof typeof TESTIMONIALS_VARIANT];

/** 一条客户评价. 全部字段可 JSON 序列化 (quote 也可给节点). */
export interface TestimonialItem {
  /** React key; 不给时用下标. */
  id?: string;
  /** 引言, 长度不限: 卡片按行截断并在真溢出时给 "展开". */
  quote: Rich;
  person: Person;
  /** 评分 0..ratingMax, 四舍五入到整星. */
  rating?: number;
  /** 来源 logo (客户公司, G2, X ...). */
  logo?: Logo;
  /** 来源链接: 有 logo 时挂在 logo 上, 否则挂在姓名上. */
  href?: string;
}

export interface TestimonialsProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  items: TestimonialItem[];
  /** cards 网格 / carousel 轮播 (分页点 + 左右按钮) / marquee 无限滚动. 默认 cards. */
  variant?: TestimonialsVariant;
  /** cards 的最大列数 (容器查询逐级增加). 默认 3. */
  columns?: SocialColumns;
  /** 引言截断行数, false 不截断. 默认 6. */
  clampLines?: QuoteClampLines | false;
  /** 评分满分. 默认 5. */
  ratingMax?: number;
  carousel?: { perView?: CarouselPerView; loop?: boolean };
  marquee?: { rows?: number; duration?: number; pauseOnHover?: boolean };
  ref?: React.Ref<HTMLElement>;
}

/**
 * 客户评价区块 (审计 B5; stripe 引用轮播, resend 无限引用流, linear / supabase 引用卡).
 * 外壳与标题走 BlockShell + SectionHeading; 卡片, 轮播与跑马灯拆在 ./social-proof/.
 * 所有可见文案来自 items; 按钮的 aria 文案来自 labels (BlocksProvider 可覆盖).
 * 单条时 cards 形态自动放大引言 (featured).
 */
export function Testimonials({
  heading,
  items,
  variant = SOCIAL_DEFAULT.testimonialsVariant,
  columns = SOCIAL_DEFAULT.testimonialsColumns,
  clampLines = SOCIAL_DEFAULT.clampLines,
  ratingMax = SOCIAL_DEFAULT.ratingMax,
  carousel,
  marquee,
  labels: labelsProp,
  className,
  ...base
}: TestimonialsProps): React.JSX.Element {
  const labels = useBlockLabels(labelsProp);
  const single = items.length === 1;
  const card = (item: TestimonialItem, expandable = true) => (
    <TestimonialCard
      quote={item.quote}
      person={item.person}
      rating={item.rating}
      ratingMax={ratingMax}
      logo={item.logo}
      href={item.href}
      clampLines={single ? false : clampLines}
      expandable={expandable}
      large={single}
      labels={labels}
    />
  );

  let body: React.ReactNode;
  if (variant === TESTIMONIALS_VARIANT.carousel) {
    body = <TestimonialCarousel slides={items.map((item) => card(item))} perView={carousel?.perView} loop={carousel?.loop} labels={labels} />;
  } else if (variant === TESTIMONIALS_VARIANT.marquee) {
    body = (
      <TestimonialMarquee
        slides={items.map((item) => card(item, false))}
        rows={marquee?.rows}
        duration={marquee?.duration}
        pauseOnHover={marquee?.pauseOnHover}
        labels={labels}
      />
    );
  } else {
    body = (
      <ul data-slot={SOCIAL_SLOT.testimonialsList} className={cn(TESTIMONIALS_CLASS.grid, SOCIAL_COLS_CLASS[single ? 1 : columns])}>
        {items.map((item, index) => (
          <li key={item.id ?? index}>{card(item)}</li>
        ))}
      </ul>
    );
  }

  return (
    <BlockShell {...base} className={className} heading={heading} renderHeading={renderSectionHeading}>
      <div data-slot={SOCIAL_SLOT.testimonials} data-variant={variant}>
        {body}
      </div>
    </BlockShell>
  );
}
