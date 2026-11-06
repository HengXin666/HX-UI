"use client";

import * as React from "react";
import { BUTTON_TYPE, VARIANT } from "../../../constants";
import {
  CAROUSEL_BASIS_CLASS,
  SOCIAL_DEFAULT,
  SOCIAL_ICON,
  SOCIAL_SLOT,
  TESTIMONIALS_CLASS,
  type CarouselPerView,
} from "../../../constants/blocks-marketing-v104";
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

export interface TestimonialMarqueeProps {
  slides: React.ReactNode[];
  /** 行数; 多行时奇数行反向, 形成 resend 式交错流. */
  rows?: number;
  /** 滚完一份的秒数. */
  duration?: number;
  pauseOnHover?: boolean;
  labels: TrackLabels;
}

/**
 * 无限引用流 (resend): 复用 effects/Marquee (复制件 aria-hidden + inert, 减弱动效时停).
 * 悬停与键盘焦点进入时暂停; 另给一个显式的暂停 / 播放按钮 (设计稿 7: 轮播可暂停).
 */
export function TestimonialMarquee({
  slides,
  rows = SOCIAL_DEFAULT.marqueeRows,
  duration = SOCIAL_DEFAULT.marqueeDuration,
  pauseOnHover = true,
  labels,
}: TestimonialMarqueeProps): React.JSX.Element {
  const [paused, setPaused] = React.useState(false);
  const count = Math.max(1, Math.min(rows, slides.length));
  const lanes = Array.from({ length: count }, (_, lane) => slides.filter((_, index) => index % count === lane));
  return (
    <div data-slot={SOCIAL_SLOT.marquee} className={cn(TESTIMONIALS_CLASS.marqueeStack, paused && TESTIMONIALS_CLASS.marqueePaused)}>
      {lanes.map((lane, laneIndex) => (
        <Marquee key={laneIndex} fade pauseOnHover={pauseOnHover} reverse={laneIndex % 2 === 1} duration={duration}>
          {lane.map((slide, index) => (
            <div key={index} className={TESTIMONIALS_CLASS.marqueeItem}>
              {slide}
            </div>
          ))}
        </Marquee>
      ))}
      <div className={TESTIMONIALS_CLASS.marqueeBar}>
        <Button type={BUTTON_TYPE} variant="ghost" size={VARIANT.iconSm} aria-label={paused ? labels.play : labels.pause} onClick={() => setPaused((value) => !value)}>
          <span aria-hidden className={paused ? SOCIAL_ICON.play : SOCIAL_ICON.pause} />
        </Button>
      </div>
    </div>
  );
}
