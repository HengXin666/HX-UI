"use client";

import * as React from "react";
import { MEDIA_KIND } from "../../constants/blocks";
import {
  BENTO_COL_SPANS,
  BENTO_FEATURES_ROW,
  BENTO_ROW_SPANS,
  MV103_CLASS,
  MV103_DEFAULT,
  MV103_SLOT,
  focalOf,
  mediaKindOf,
  mediaRatioOf,
} from "../../constants/blocks-marketing-v103";
import { Bento, BentoItem } from "../../box/Bento";
import { IconSlot } from "../../layout/Icon";
import { Image } from "../../media/image/image";
import { ThemedImage } from "../../media/image/themed-image";
import { Video } from "../../media/video";
import { BlockShell } from "../_shared/BlockShell";
import { renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, IconName, Media, Rich, SectionHeadingData } from "../_shared/types";

/** 一格: 标题 + 说明 + 图标, 可带顶部媒体 (UI 片段) 或整格背景图, hover 换图. */
export interface BentoFeaturesItem {
  key?: string;
  icon?: IconName;
  eyebrow?: Rich;
  title: Rich;
  body?: Rich;
  /** 文字上方的媒体: 截图, 插画, 或 kind="node" 的 UI 片段. */
  media?: Media;
  /** 悬停 / 聚焦时替换 media 的图 (supabase 的 active 插画). */
  hoverMedia?: Media;
  /** 整格背景图, 文字压在底部渐隐遮罩上 (stripe 的图片底 bento). 给了它就不渲染 media. */
  background?: Media;
  /** lg 起的跨度: 大格 {col:2,row:2}, 横跨 {col:2}, 竖跨 {row:2}. */
  span?: { col?: (typeof BENTO_COL_SPANS)[number]; row?: (typeof BENTO_ROW_SPANS)[number] };
  /** 整格可点. */
  href?: string;
  /** 热区可访问名称; title 为字符串时可省. */
  actionLabel?: string;
}

export interface BentoFeaturesProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  items: BentoFeaturesItem[];
  /** lg 起的列数, 默认 3. */
  cols?: number;
  /** 行高档, 默认 md. */
  rowHeight?: (typeof BENTO_FEATURES_ROW)[keyof typeof BENTO_FEATURES_ROW];
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

function TileText({ item, over }: { item: BentoFeaturesItem; over: boolean }): React.JSX.Element {
  return (
    <div data-slot={MV103_SLOT.bentoText} className={over ? MV103_CLASS.bentoTextOver : MV103_CLASS.bentoText}>
      {item.icon !== undefined && (
        <span aria-hidden className={MV103_CLASS.icon}>
          <IconSlot source={item.icon} />
        </span>
      )}
      {item.eyebrow !== undefined && <p className={MV103_CLASS.eyebrow}>{item.eyebrow}</p>}
      <h3 className={MV103_CLASS.title}>{item.title}</h3>
      {item.body !== undefined && <p className={MV103_CLASS.body}>{item.body}</p>}
    </div>
  );
}

/** 格内容: 背景图模式 (图垫底 + 遮罩 + 文字在下) 或 媒体模式 (媒体在上, hover 叠换图, 文字在下). */
function Tile({ item }: { item: BentoFeaturesItem }): React.JSX.Element {
  if (item.background !== undefined) {
    return (
      <div data-slot={MV103_SLOT.bentoTile} data-background="" className={MV103_CLASS.bentoTileBackground}>
        <div aria-hidden className={MV103_CLASS.bentoBackground}>
          <MediaView media={item.background} />
        </div>
        <div aria-hidden className={MV103_CLASS.bentoScrim} />
        <TileText item={item} over />
      </div>
    );
  }
  return (
    <div data-slot={MV103_SLOT.bentoTile} className={MV103_CLASS.bentoTile}>
      {item.media !== undefined && (
        <div data-slot={MV103_SLOT.bentoMedia} className={MV103_CLASS.bentoMedia}>
          <div className={item.hoverMedia !== undefined ? MV103_CLASS.bentoBase : undefined}>
            <MediaView media={item.media} />
          </div>
          {item.hoverMedia !== undefined && (
            <div aria-hidden data-slot={MV103_SLOT.bentoHover} className={MV103_CLASS.bentoHover}>
              <MediaView media={item.hoverMedia} />
            </div>
          )}
        </div>
      )}
      <TileText item={item} over={item.media === undefined} />
    </div>
  );
}

/**
 * Bento 特性网格 (stripe 的 Flexible solutions, supabase 的产品 7 格). 复用 box/Bento 的断点与跨度:
 * 手机单列, sm 两列, lg 起按 cols 排, dense 回填空洞. hover / focus-within 时叠换图只过渡 opacity,
 * 时长令牌在减弱动效下归零. 遵循 docs/architecture/component-contract.md.
 */
export function BentoFeatures({
  heading,
  items,
  cols = MV103_DEFAULT.bentoCols,
  rowHeight = MV103_DEFAULT.bentoRow,
  labels: _labels,
  ref,
  ...shell
}: BentoFeaturesProps): React.JSX.Element {
  const listLabel = typeof heading?.title === "string" ? heading.title : shell["aria-label"];
  return (
    <BlockShell {...shell} ref={ref} heading={heading} renderHeading={renderSectionHeading}>
      <Bento cols={cols} rowHeight={rowHeight} aria-label={listLabel} className={MV103_CLASS.fullWidth}>
        {items.map((item, index) => (
          <BentoItem
            key={item.key ?? (typeof item.title === "string" ? item.title : index)}
            colSpan={item.span?.col}
            rowSpan={item.span?.row}
            href={item.href}
            actionLabel={item.actionLabel ?? (typeof item.title === "string" ? item.title : undefined)}
          >
            <Tile item={item} />
          </BentoItem>
        ))}
      </Bento>
    </BlockShell>
  );
}
