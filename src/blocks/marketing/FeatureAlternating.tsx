"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import { BLOCK_REVEAL, MEDIA_KIND } from "../../constants/blocks";
import { MEDIA_SIDE, MV103_CLASS, MV103_DEFAULT, MV103_SLOT, focalOf, mediaKindOf, mediaRatioOf } from "../../constants/blocks-marketing-v103";
import { Image } from "../../media/image/image";
import { ThemedImage } from "../../media/image/themed-image";
import { Video } from "../../media/video";
import { MOTION_TAG } from "../../constants/motion";
import { StaggerItem } from "../../motion/Stagger";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { CtaGroup, renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, Media, Rich, SectionHeadingData } from "../_shared/types";

/** 一段图文: 媒体 (图 / 视频 / 产品 mock) + 眉标 + 标题 + 说明 + 要点 + CTA. */
export interface FeatureAlternatingItem {
  key?: string;
  eyebrow?: Rich;
  title: Rich;
  body?: Rich;
  bullets?: Rich[];
  ctas?: Cta[];
  media: Media;
}

export interface FeatureAlternatingProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  items: FeatureAlternatingItem[];
  /** 首段媒体在起始侧还是结束侧, 之后逐段交替. 默认 start. */
  mediaSide?: (typeof MEDIA_SIDE)[keyof typeof MEDIA_SIDE];
  /** 段标题层级, 默认 h3 (区块标题为 h2). */
  itemHeadingLevel?: 2 | 3 | 4;
  ref?: React.Ref<HTMLElement>;
}

/** 媒体渲染: 节点原样; 视频走 media/Video; 图片有暗色图时走 ThemedImage, 否则 Image. */
function MediaView({ media }: { media: Media }): React.JSX.Element | null {
  const kind = mediaKindOf(media);
  if (kind === MEDIA_KIND.node) return <>{media.node}</>;
  if (!media.src) return null;
  if (kind === MEDIA_KIND.video) return <Video title={media.alt} src={media.src} poster={media.poster} />;
  const dark = media.darkSrc ?? media.srcDark;
  const common = { alt: media.alt, ratio: mediaRatioOf(media.ratio), priority: media.priority, objectPosition: focalOf(media.focal), sizes: media.sizes, placeholder: media.placeholder };
  if (dark) return <ThemedImage {...common} lightSrc={media.src} darkSrc={dark} />;
  return <Image {...common} src={media.src} srcSet={media.srcSet} />;
}

const HEADING_TAG = { 2: "h2", 3: "h3", 4: "h4" } as const;

/**
 * 左右交替图文 (deno 的特性段, stripe 的产品段). 宽容器两栏, 媒体侧逐段交替; 窄容器单列且媒体在上.
 * reveal="stagger" 时逐段交错入场. 遵循 docs/architecture/component-contract.md.
 */
export function FeatureAlternating({
  heading,
  items,
  mediaSide = MV103_DEFAULT.mediaSide,
  itemHeadingLevel = 3,
  labels: _labels,
  reveal,
  ref,
  ...shell
}: FeatureAlternatingProps): React.JSX.Element {
  const Heading = HEADING_TAG[itemHeadingLevel];
  const firstEnd = mediaSide === MEDIA_SIDE.end;
  const stagger = reveal === BLOCK_REVEAL.stagger;
  return (
    <BlockShell {...shell} ref={ref} reveal={reveal} heading={heading} renderHeading={renderSectionHeading}>
      <div className={MV103_CLASS.altStack}>
        {items.map((item, index) => {
          const end = (index % 2 === 1) !== firstEnd;
          const text = (
            <div data-slot={MV103_SLOT.featureAltText} className={MV103_CLASS.altText}>
              {item.eyebrow !== undefined && <p className={MV103_CLASS.eyebrow}>{item.eyebrow}</p>}
              <Heading className={MV103_CLASS.altTitle}>{item.title}</Heading>
              {item.body !== undefined && <p className={MV103_CLASS.body}>{item.body}</p>}
              {item.bullets !== undefined && item.bullets.length > 0 && (
                <ul role="list" data-slot={MV103_SLOT.featureAltBullets} className={MV103_CLASS.bullets}>
                  {item.bullets.map((bullet, i) => (
                    <li key={typeof bullet === "string" ? bullet : i} className={MV103_CLASS.bullet}>
                      <CheckIcon aria-hidden className={MV103_CLASS.bulletIcon} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
              {item.ctas !== undefined && <CtaGroup items={item.ctas} />}
            </div>
          );
          const media = (
            <div data-slot={MV103_SLOT.featureAltMedia} className={cn(MV103_CLASS.mediaBox, end && MV103_CLASS.altMediaEnd)}>
              <MediaView media={item.media} />
            </div>
          );
          const row = (
            <div data-slot={MV103_SLOT.featureAltItem} data-media-side={end ? MEDIA_SIDE.end : MEDIA_SIDE.start} className={MV103_CLASS.altRow}>
              {media}
              {text}
            </div>
          );
          const key = item.key ?? (typeof item.title === "string" ? item.title : index);
          return stagger ? <StaggerItem key={key} as={MOTION_TAG.article}>{row}</StaggerItem> : <article key={key}>{row}</article>;
        })}
      </div>
    </BlockShell>
  );
}
