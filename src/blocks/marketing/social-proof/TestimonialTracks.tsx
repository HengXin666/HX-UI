"use client";

import * as React from "react";
import { BUTTON_TYPE, ORIENTATION, VARIANT } from "../../../constants";
import {
  CAROUSEL_BASIS_CLASS,
  MARQUEE_LANE_CLASS,
  SOCIAL_COLS_CLASS,
  SOCIAL_DEFAULT,
  SOCIAL_ICON,
  SOCIAL_SLOT,
  TESTIMONIALS_CLASS,
  type CarouselPerView,
  type SocialColumns,
} from "../../../constants/blocks-marketing-proof";
import { Marquee } from "../../../effects/Marquee";
import { Button } from "../../../primitives/button";
import { Carousel, CarouselContent, CarouselDots, CarouselItem, useCarousel } from "../../../primitives/carousel";
import { cn } from "../../../primitives/utils";
import type { BlockLabels } from "../../_shared/types";

type TrackLabels = Pick<BlockLabels, "previous" | "next" | "pause" | "play">;

/** 轮播底栏: 上一张 + 分页点 + "当前/总数" (aria-live) + 下一张. 按钮在轨道下方, 不压住引言. */
function CarouselControls({ labels }: { labels: TrackLabels }): React.JSX.Element {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext, selectedIndex, snapCount } = useCarousel();
  return (
    <div data-slot={SOCIAL_SLOT.controls} className={TESTIMONIALS_CLASS.controls}>
      <CarouselDots className={TESTIMONIALS_CLASS.dots} />
      <div className={TESTIMONIALS_CLASS.controlsGroup}>
        <Button type={BUTTON_TYPE} variant="outline" size={VARIANT.iconSm} aria-label={labels.previous} disabled={!canScrollPrev} onClick={scrollPrev}>
          <span aria-hidden className={SOCIAL_ICON.previous} />
        </Button>
        <span aria-live="polite" className={TESTIMONIALS_CLASS.counter}>
          {snapCount > 0 ? `${selectedIndex + 1} / ${snapCount}` : null}
        </span>
        <Button type={BUTTON_TYPE} variant="outline" size={VARIANT.iconSm} aria-label={labels.next} disabled={!canScrollNext} onClick={scrollNext}>
          <span aria-hidden className={SOCIAL_ICON.next} />
        </Button>
      </div>
    </div>
  );
}

export interface TestimonialCarouselProps {
  slides: React.ReactNode[];
  perView?: CarouselPerView;
  loop?: boolean;
  labels: TrackLabels;
  "aria-label"?: string;
}

/** 引用轮播 (stripe): embla 拖拽 / 方向键 / 减弱动效时瞬切; 每屏 1 到 3 张, 容器查询决定. */
export function TestimonialCarousel({ slides, perView = SOCIAL_DEFAULT.carouselPerView, loop = false, labels, ...rest }: TestimonialCarouselProps): React.JSX.Element {
  return (
    <Carousel data-slot={SOCIAL_SLOT.carousel} opts={{ align: "start", loop }} aria-label={rest["aria-label"]}>
      <CarouselContent className={TESTIMONIALS_CLASS.carouselContent}>
        {slides.map((slide, index) => (
          <CarouselItem key={index} className={cn(TESTIMONIALS_CLASS.carouselItem, CAROUSEL_BASIS_CLASS[perView])}>
            {slide}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselControls labels={labels} />
    </Carousel>
  );
}

type TestimonialMarqueeDirection = (typeof ORIENTATION)[keyof typeof ORIENTATION];

export interface TestimonialMarqueeProps {
  slides: React.ReactNode[];
  /** 轨道数: 横向是行数, 纵向是列数 (最多 4 列, 随容器宽度逐级展开, 窄屏一列). 相邻轨道反向. */
  rows?: number;
  /** 滚完一份的秒数. */
  duration?: number;
  /** 按轨道给时长 (秒), 第 i 条取 durations[i], 缺位回落到 duration. 让相邻轨道速度错开. */
  durations?: readonly number[];
  /** 滚动方向. 默认 horizontal. */
  direction?: TestimonialMarqueeDirection;
  pauseOnHover?: boolean;
  /** 根节点类名; 纵向时用它改轨道区高度之类. */
  className?: string;
  labels: TrackLabels;
}

/** 按列数取网格档; 超过 4 列夹到 4. */
function columnsClass(count: number): string {
  const cols = Math.min(count, MARQUEE_LANE_CLASS.length) as SocialColumns;
  return SOCIAL_COLS_CLASS[cols];
}

/**
 * 无限引用流 (resend): 复用 effects/Marquee (复制件 aria-hidden + inert, 减弱动效时停).
 * 悬停与键盘焦点进入时暂停; 另给一个显式的暂停 / 播放按钮 (设计稿 7: 轮播可暂停).
 * 纵向时轨道是并排的列, 列数随容器宽度收放.
 *
 * .agents/notes/implemented/feature/2026-11-08-library-gaps.md
 */
export function TestimonialMarquee({
  slides,
  rows = SOCIAL_DEFAULT.marqueeRows,
  duration = SOCIAL_DEFAULT.marqueeDuration,
  durations,
  direction = SOCIAL_DEFAULT.marqueeDirection,
  pauseOnHover = true,
  className,
  labels,
}: TestimonialMarqueeProps): React.JSX.Element {
  const [paused, setPaused] = React.useState(false);
  const vertical = direction === ORIENTATION.vertical;
  const limit = vertical ? MARQUEE_LANE_CLASS.length : rows;
  const count = Math.max(1, Math.min(rows, limit, slides.length));
  const lanes = Array.from({ length: count }, (_, lane) => slides.filter((_, index) => index % count === lane));
  const tracks = lanes.map((lane, laneIndex) => (
    <Marquee
      key={laneIndex}
      fade
      vertical={vertical}
      pauseOnHover={pauseOnHover}
      reverse={laneIndex % 2 === 1}
      duration={durations?.[laneIndex] ?? duration}
      className={vertical ? MARQUEE_LANE_CLASS[laneIndex] : undefined}
    >
      {lane.map((slide, index) => (
        <div key={index} className={vertical ? TESTIMONIALS_CLASS.marqueeColumnItem : TESTIMONIALS_CLASS.marqueeItem}>
          {slide}
        </div>
      ))}
    </Marquee>
  ));
  return (
    <div
      data-slot={SOCIAL_SLOT.marquee}
      data-orientation={vertical ? direction : undefined}
      className={cn(TESTIMONIALS_CLASS.marqueeStack, vertical && TESTIMONIALS_CLASS.marqueeVertical, paused && TESTIMONIALS_CLASS.marqueePaused, className)}
    >
      {vertical ? <div className={cn(TESTIMONIALS_CLASS.marqueeColumns, columnsClass(count))}>{tracks}</div> : tracks}
      <div className={TESTIMONIALS_CLASS.marqueeBar}>
        <Button type={BUTTON_TYPE} variant="ghost" size={VARIANT.iconSm} aria-label={paused ? labels.play : labels.pause} onClick={() => setPaused((value) => !value)}>
          <span aria-hidden className={paused ? SOCIAL_ICON.play : SOCIAL_ICON.pause} />
        </Button>
      </div>
    </div>
  );
}
