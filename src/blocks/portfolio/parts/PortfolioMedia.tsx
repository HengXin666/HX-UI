import type * as React from "react";
import { PORTFOLIO_DEFAULT } from "../../../constants/blocks-portfolio-v111";
import { Image } from "../../../media/image/image";
import { ThemedImage } from "../../../media/image/themed-image";
import type { Media, MediaRatio } from "../../_shared/types";

export interface PortfolioMediaProps {
  media: Media;
  /** 兜底比例; media.ratio 优先. */
  ratio?: number;
  className?: string;
}

/** Media.ratio ("16/9" 或数字) -> 数字比例; 解析失败返回 undefined. */
export function ratioToNumber(ratio: MediaRatio | undefined): number | undefined {
  if (ratio === undefined) return undefined;
  if (typeof ratio === "number") return ratio > 0 ? ratio : undefined;
  const [w, h] = ratio.split(PORTFOLIO_DEFAULT.ratioSeparator).map(Number);
  return w > 0 && h > 0 ? w / h : undefined;
}

/**
 * 作品集用的图片位: 复用 src/media 的 Image / ThemedImage (懒加载, 占位, 失败兜底, 比例盒防 CLS).
 * kind="node" 时直接渲染自定义节点; 没有 src 时不渲染.
 */
export function PortfolioMedia({ media, ratio, className }: PortfolioMediaProps): React.JSX.Element | null {
  if (media.node !== undefined) return <>{media.node}</>;
  if (media.src === undefined || media.src === "") return null;
  const r =
    ratioToNumber(media.ratio) ?? (media.width && media.height ? media.width / media.height : undefined) ?? ratio ?? PORTFOLIO_DEFAULT.thumbRatio;
  const dark = media.darkSrc ?? media.srcDark;
  const objectPosition = media.focal ? `${media.focal[0] * 100}% ${media.focal[1] * 100}%` : undefined;
  const common = {
    alt: media.alt,
    ratio: r,
    sizes: media.sizes,
    priority: media.priority,
    placeholder: media.placeholder,
    objectPosition,
    className,
  };
  if (dark !== undefined) return <ThemedImage {...common} lightSrc={media.src} darkSrc={dark} />;
  return <Image {...common} src={media.src} srcSet={media.srcSet} />;
}
