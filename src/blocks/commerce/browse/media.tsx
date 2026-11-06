"use client";

import * as React from "react";
import {
  BROWSE_PLACEHOLDER_N,
  BROWSE_TEXT_FALLBACK,
  BROWSE_TEXT_PACKS,
  LANG_SEPARATOR,
  RATIO_SEPARATOR,
  type BrowseTexts,
} from "../../../constants/blocks-commerce-v107";
import { Image, Video } from "../../../media";
import { useBlocks } from "../../_shared/BlocksProvider";
import type { Media, MediaRatio } from "../../_shared/types";

/** Media.ratio ("16/9" 或数字) -> 宽 / 高 数值; 无效时用 fallback. */
export function ratioOf(ratio: MediaRatio | undefined, fallback: number): number {
  if (typeof ratio === "number") return ratio > 0 ? ratio : fallback;
  if (typeof ratio !== "string") return fallback;
  const [w, h] = ratio.split(RATIO_SEPARATOR).map(Number);
  return w > 0 && h > 0 ? w / h : fallback;
}

/** focal [x, y] -> object-position. */
function positionOf(focal: Media["focal"]): string | undefined {
  if (!focal) return undefined;
  const [x, y] = focal;
  return `${x * 100}% ${y * 100}%`;
}

export interface BlockMediaProps {
  media: Media;
  /** 外部给定的比例 (优先于 media.ratio). */
  ratio?: number;
  fallbackRatio: number;
  sizes?: string;
  className?: string;
  rootClassName?: string;
  /** 装饰用途 (hover 第二图): alt 置空. */
  decorative?: boolean;
  "data-slot"?: string;
}

/**
 * 区块内的媒体渲染: 图片一律经 media/Image (srcSet / 懒加载 / 占位 / 焦点), 视频经 media/Video,
 * kind="node" 直接渲染节点. 不写原生 img.
 */
export function BlockMedia({ media, ratio, fallbackRatio, sizes, className, rootClassName, decorative, "data-slot": slot }: BlockMediaProps): React.JSX.Element | null {
  const r = ratio ?? ratioOf(media.ratio, fallbackRatio);
  if (media.kind === "node") return <div data-slot={slot} className={rootClassName}>{media.node}</div>;
  if (media.kind === "video") {
    return (
      <Video
        data-slot={slot}
        title={media.alt}
        src={media.src}
        poster={media.poster}
        rootClassName={rootClassName}
        className={className}
      />
    );
  }
  if (!media.src) return null;
  return (
    <Image
      data-slot={slot}
      src={media.src}
      srcSet={media.srcSet}
      sizes={sizes ?? media.sizes}
      alt={decorative ? "" : media.alt}
      ratio={r}
      priority={media.priority}
      placeholder={media.placeholder}
      objectPosition={positionOf(media.focal)}
      rootClassName={rootClassName}
      className={className}
    />
  );
}

/** 区块内置文案: texts prop > 按 BlocksProvider locale 取的内置包. {n} 由调用方用 fill 替换. */
export function useBrowseTexts(texts?: Partial<BrowseTexts>): BrowseTexts {
  const { locale } = useBlocks();
  return React.useMemo(() => {
    const lang = locale.split(LANG_SEPARATOR)[0].toLowerCase() as keyof typeof BROWSE_TEXT_PACKS;
    const pack = BROWSE_TEXT_PACKS[lang] ?? BROWSE_TEXT_PACKS[BROWSE_TEXT_FALLBACK];
    return { ...pack, ...texts };
  }, [locale, texts]);
}

/** 把 {n} 换成已经 Intl 格式化好的数字. */
export function fill(template: string, n: string): string {
  return template.replace(BROWSE_PLACEHOLDER_N, n);
}
