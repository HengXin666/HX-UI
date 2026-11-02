"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import {
  ARIA_LIVE,
  ARIA_ROLEDESCRIPTION,
  BROWSE_CLASS as C,
  BROWSE_ICON,
  BROWSE_NUMBERS,
  COMMERCE_BROWSE_SLOT,
  DATA_STATE,
  HERO_DEFAULT,
  HERO_LAYOUT,
  HERO_POSITION_CLASS,
  browseSlot,
  type BrowseTexts,
  type HeroLayout,
  type HeroPosition,
} from "../../constants/blocks-commerce-v107";
import { BLOCK_PAD, BLOCK_WIDTH } from "../../constants/blocks";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { useBlockLabels, useBlocks } from "../_shared/BlocksProvider";
import { CtaGroup } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, HeadingLevel, Media, MediaRatio, Rich } from "../_shared/types";
import { BlockMedia, fill, ratioOf, useBrowseTexts } from "./browse/media";
import { useCarousel } from "./browse/use-carousel";

const HEADING_TAG = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;
const slot = (part?: string): string => browseSlot(COMMERCE_BROWSE_SLOT.campaignHero, part);

/** 一张活动页 (可 JSON 序列化). */
export interface CampaignSlideData {
  /** 图片或视频 (kind="video" 走 media/Video, 带暂停按钮). */
  media: Media;
  kicker?: Rich;
  title: Rich;
  body?: Rich;
  ctas?: Cta[];
  /** overlay 版式里文字的位置, 默认 start (左下). */
  position?: HeroPosition;
  /** 文字压在深色遮罩上 (反白); overlay 版式默认 true. */
  dark?: boolean;
  /** split 版式的图片比例, 默认 4/3. */
  ratio?: MediaRatio;
}

export interface CampaignHeroProps extends BlockBaseProps {
  slides: CampaignSlideData[];
  /** overlay 全出血大图压字; split 左图右文; split-reverse 左文右图. */
  layout?: HeroLayout;
  /** 自动播放间隔 ms; 不传不自动播. hover / 焦点 / 暂停按钮 / 减弱动效都会停. */
  autoplay?: number;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** 标题层级; 页面首屏传 1, 默认 2. */
  headingLevel?: HeadingLevel;
  texts?: Partial<BrowseTexts>;
  ref?: React.Ref<HTMLElement>;
}

/** 一张页的文字层. */
function SlideText({ slide, level, onDark, className }: { slide: CampaignSlideData; level: HeadingLevel; onDark: boolean; className?: string }): React.JSX.Element {
  const Heading = HEADING_TAG[level];
  return (
    <div data-slot={slot("content")} className={cn(onDark && C.heroOnDark, className)}>
      {slide.kicker !== undefined && <p data-slot={slot("kicker")} className={C.heroKicker}>{slide.kicker}</p>}
      <Heading data-slot={slot("title")} className={C.heroTitle}>{slide.title}</Heading>
      {slide.body !== undefined && <p data-slot={slot("body")} className={C.heroBody}>{slide.body}</p>}
      {slide.ctas && <CtaGroup items={slide.ctas} />}
    </div>
  );
}

/**
 * 营销活动首屏 (nike 全幅 campaign 轮播 / apple 双英雄图): 全出血图或视频 + 极少文字 + 超大标题 + CTA.
 * 多张时为 WAI-ARIA carousel: 分页点 (aria-current), 上一张 / 下一张, 自动播放可暂停; 非当前页 hidden.
 * 默认 width="bleed" 与 pad="none", 区块紧贴视口.
 */
export function CampaignHero({
  slides,
  layout = HERO_DEFAULT.layout,
  autoplay,
  index,
  defaultIndex,
  onIndexChange,
  headingLevel = 2,
  texts,
  labels,
  width = BLOCK_WIDTH.bleed,
  pad = BLOCK_PAD.none,
  ref,
  ...shell
}: CampaignHeroProps): React.JSX.Element {
  const aria = useBlockLabels(labels);
  const t = useBrowseTexts(texts);
  const { formatNumber } = useBlocks();
  const carousel = useCarousel({ count: slides.length, index, defaultIndex, onIndexChange, autoplay });
  const multi = slides.length > 1;
  const split = layout !== HERO_LAYOUT.overlay;
  const slideLabel = (i: number): string => fill(t.slide, formatNumber(i + 1));

  return (
    <BlockShell
      {...shell}
      ref={ref}
      width={width}
      pad={pad}
      aria-label={shell["aria-label"] ?? (multi ? t.slides : undefined)}
    >
      <div
        data-slot={slot()}
        data-layout={layout}
        aria-roledescription={multi ? ARIA_ROLEDESCRIPTION.carousel : undefined}
        className={C.hero}
        {...(multi ? carousel.pauseHandlers : {})}
      >
        <div data-slot={slot("slides")} aria-live={multi && !carousel.playing ? ARIA_LIVE.polite : ARIA_LIVE.off}>
          {slides.map((slide, i) => {
            const active = i === carousel.index;
            const onDark = slide.dark ?? !split;
            const priority = i === BROWSE_NUMBERS.first ? true : slide.media.priority;
            return (
              <div
                key={typeof slide.title === "string" ? slide.title : i}
                role={multi ? "group" : undefined}
                aria-roledescription={multi ? ARIA_ROLEDESCRIPTION.slide : undefined}
                aria-label={multi ? slideLabel(i) : undefined}
                hidden={!active}
                data-slot={slot("slide")}
                data-state={active ? DATA_STATE.active : DATA_STATE.inactive}
                className={cn(C.heroSlide, split ? cn(C.heroSplit, layout === HERO_LAYOUT.splitReverse && C.heroSplitReverse) : C.heroOverlay)}
              >
                {split ? (
                  <>
                    <BlockMedia
                      media={{ ...slide.media, priority }}
                      ratio={ratioOf(slide.ratio ?? slide.media.ratio, BROWSE_NUMBERS.splitRatio)}
                      fallbackRatio={BROWSE_NUMBERS.splitRatio}
                      data-slot={slot("media")}
                    />
                    <SlideText slide={slide} level={headingLevel} onDark={false} className={C.heroSplitText} />
                  </>
                ) : (
                  <>
                    <div data-slot={slot("media")} className={C.heroOverlayMedia}>
                      <BlockMedia media={{ ...slide.media, priority }} fallbackRatio={BROWSE_NUMBERS.heroRatio} rootClassName={C.heroFill} />
                    </div>
                    {onDark && <span aria-hidden data-slot={slot("scrim")} className={C.heroDark} />}
                    <SlideText
                      slide={slide}
                      level={headingLevel}
                      onDark={onDark}
                      className={cn(C.heroContent, HERO_POSITION_CLASS[slide.position ?? HERO_DEFAULT.position])}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
        {multi && (
          <>
            <div data-slot={slot("pagination")} className={C.heroDots}>
              {slides.map((slide, i) => (
                <button
                  key={typeof slide.title === "string" ? slide.title : i}
                  type={BUTTON_TYPE}
                  data-slot={slot("dot")}
                  data-state={i === carousel.index ? DATA_STATE.active : DATA_STATE.inactive}
                  aria-label={slideLabel(i)}
                  aria-current={i === carousel.index || undefined}
                  onClick={() => carousel.go(i)}
                  className={cn(C.heroDot, C.colors, C.focus)}
                />
              ))}
            </div>
            <div data-slot={slot("nav")} className={C.heroNav}>
              {carousel.autoplayEnabled && (
                <button
                  type={BUTTON_TYPE}
                  data-slot={slot("play-toggle")}
                  aria-label={carousel.playing ? aria.pause : aria.play}
                  onClick={carousel.togglePlay}
                  className={cn(C.iconButton, C.colors, C.focus)}
                >
                  <span aria-hidden className={cn(carousel.playing ? BROWSE_ICON.pause : BROWSE_ICON.play, C.icon)} />
                </button>
              )}
              <button type={BUTTON_TYPE} data-slot={slot("previous-button")} aria-label={aria.previous} onClick={() => carousel.step(-1)} className={cn(C.iconButton, C.colors, C.focus)}>
                <span aria-hidden className={cn(BROWSE_ICON.previous, C.icon, C.iconFlip)} />
              </button>
              <button type={BUTTON_TYPE} data-slot={slot("next-button")} aria-label={aria.next} onClick={() => carousel.step(1)} className={cn(C.iconButton, C.colors, C.focus)}>
                <span aria-hidden className={cn(BROWSE_ICON.next, C.icon, C.iconFlip)} />
              </button>
            </div>
          </>
        )}
      </div>
    </BlockShell>
  );
}
