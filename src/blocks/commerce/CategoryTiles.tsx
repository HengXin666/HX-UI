"use client";

import * as React from "react";
import {
  BROWSE_CLASS as C,
  BROWSE_ICON,
  BROWSE_NUMBERS,
  COMMERCE_BROWSE_SLOT,
  TILE_FEATURE_COLS,
  TILE_FEATURE_SPAN,
  TILE_GRID_CLASS,
  TILE_LAYOUT,
  TILE_MAX,
  TILE_MIN,
  TILE_SHAPE,
  browseSlot,
  type TileLayout,
  type TileShape,
} from "../../constants/blocks-commerce-v107";
import { BLOCK_WIDTH, EXTERNAL_LINK } from "../../constants/blocks";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, HeadingLevel, Media, MediaRatio, Rich, SectionHeadingData } from "../_shared/types";
import { BlockMedia, ratioOf } from "./browse/media";

const HEADING_TAG = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;
const slot = (part?: string): string => browseSlot(COMMERCE_BROWSE_SLOT.categoryTiles, part);

/** 一张分类砖 (可 JSON 序列化). */
export interface CategoryTileData {
  title: Rich;
  href: string;
  media: Media;
  eyebrow?: Rich;
  /** 砖内的可见动作文案 ("Shop"); 整砖本身就是链接, 这里只是视觉提示. */
  ctaLabel?: Rich;
  external?: boolean;
}

export interface CategoryTilesProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  /** 2 到 4 张; 超出的截断, 不足 2 张按 2 张栅格排. */
  items: CategoryTileData[];
  /** even 等宽; feature-first 首张占两列 (不等宽). 默认 feature-first. */
  layout?: TileLayout;
  /** bleed 全出血 (无圆角, 1px 缝, 区块默认 bleed 宽); rounded 圆角组. 默认 rounded. */
  shape?: TileShape;
  /** 砖的图片比例, 默认 4/5 (竖图). */
  ratio?: MediaRatio;
  /** 砖标题层级, 默认 h3. */
  headingLevel?: HeadingLevel;
  ref?: React.Ref<HTMLElement>;
}

/**
 * 分类大图卡 (nike Phantom / Mercurial / Tiempo 入口): 每砖一个整块链接, 底部渐变遮罩上放标题.
 * 遮罩用 foreground, 文字用 background, 亮暗模式下对比方向一致; hover 缓放大, 减弱动效时不动.
 */
export function CategoryTiles({
  heading,
  items,
  layout = TILE_LAYOUT.featureFirst,
  shape = TILE_SHAPE.rounded,
  ratio,
  headingLevel = 3,
  width,
  labels: _labels,
  ref,
  ...shell
}: CategoryTilesProps): React.JSX.Element {
  const tiles = items.slice(0, TILE_MAX);
  const count = Math.max(tiles.length, TILE_MIN);
  const bleed = shape === TILE_SHAPE.bleed;
  const r = ratioOf(ratio, BROWSE_NUMBERS.tileRatio);
  const Heading = HEADING_TAG[headingLevel];
  const feature = layout === TILE_LAYOUT.featureFirst;

  return (
    <BlockShell
      {...shell}
      ref={ref}
      width={width ?? (bleed ? BLOCK_WIDTH.bleed : undefined)}
      heading={heading}
      renderHeading={renderSectionHeading}
    >
      <ul
        data-slot={slot()}
        data-layout={layout}
        data-shape={shape}
        className={cn(C.tiles, bleed ? C.tilesBleed : C.tilesRounded, TILE_GRID_CLASS[count][layout])}
      >
        {tiles.map((tile, i) => (
          <li key={tile.href} data-slot={slot("item")} className={cn(feature && i === BROWSE_NUMBERS.first && TILE_FEATURE_SPAN)}>
            <a
              href={tile.href}
              data-slot={slot("link")}
              {...(tile.external ? EXTERNAL_LINK : {})}
              className={cn(C.tile, !bleed && C.tileRounded, C.focus)}
            >
              <BlockMedia
                media={tile.media}
                ratio={feature && i === BROWSE_NUMBERS.first ? r * TILE_FEATURE_COLS : r}
                fallbackRatio={r}
                className={C.tileMedia}
                data-slot={slot("media")}
              />
              <span aria-hidden data-slot={slot("scrim")} className={C.scrim} />
              <span data-slot={slot("body")} className={C.tileBody}>
                {tile.eyebrow !== undefined && (
                  <span data-slot={slot("eyebrow")} className={C.tileEyebrow}>
                    {tile.eyebrow}
                  </span>
                )}
                <Heading data-slot={slot("title")} className={C.tileTitle}>
                  {tile.title}
                </Heading>
                {tile.ctaLabel !== undefined && (
                  <span aria-hidden data-slot={slot("cta")} className={C.tileCta}>
                    {tile.ctaLabel}
                    <span className={cn(BROWSE_ICON.arrow, C.icon, C.iconFlip)} />
                  </span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </BlockShell>
  );
}
