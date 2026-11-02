"use client";

import * as React from "react";
import { BLOCK_BACKDROP, MEDIA_KIND } from "../../constants/blocks";
import { MV102_CLASS, MV102_DEFAULT, MV102_MASK_DIRECTION, MV102_SLOT } from "../../constants/blocks-marketing-v102";
import { Beam } from "../../effects/Beam";
import { Grain } from "../../effects/Grain";
import { MaskFade } from "../../effects/MaskFade";
import { MeshGradient } from "../../effects/MeshGradient";
import { Image } from "../../media/image/image";
import { ThemedImage } from "../../media/image/themed-image";
import { Video } from "../../media/video";
import { cn } from "../../primitives/utils";
import type { BackdropSpec, BlockBaseProps, Logo, Media, MediaRatio } from "../_shared/types";

/**
 * 营销区块 A 的共享件 (不是区块, 不进 registry): 背景规格解析, 媒体渲染, logo 渲染.
 * 只引用 L1/L2 组件与令牌; 文案全部来自调用方的数据.
 */

function isSpec(value: unknown): value is BackdropSpec {
  return typeof value === "object" && value !== null && !React.isValidElement(value) && "variant" in value;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

/** 比例档 -> CSS aspect-ratio 值. */
export function ratioValue(ratio: MediaRatio | undefined): string | undefined {
  if (ratio === undefined) return undefined;
  return typeof ratio === "number" ? String(ratio) : ratio.replace("/", " / ");
}

function ratioNumber(ratio: MediaRatio | undefined): number | undefined {
  if (ratio === undefined) return undefined;
  if (typeof ratio === "number") return ratio;
  const [w, h] = ratio.split("/").map(Number);
  return w / h;
}

/** 把 mask 规格包到 MaskFade 里; 无 mask 原样返回. */
function withMask(spec: BackdropSpec, node: React.ReactNode): React.ReactNode {
  if (!spec.mask) return node;
  const direction = MV102_MASK_DIRECTION[spec.mask.fade ?? "radial"];
  return (
    <MaskFade direction={direction} className={MV102_CLASS.fill}>
      {node}
    </MaskFade>
  );
}

/**
 * 背景规格 -> 节点. BlockShell 只内置 grid / dots / aurora; mesh / grain / beam / image 在这里落成 L2 组件,
 * 这样区块不依赖调用方经 BlocksProvider 注入. options.grain 为 true 时在 mesh / beam / image 上再叠一层颗粒 (stripe 式).
 * 其余规格或节点原样交还 BlockShell.
 */
export function resolveBackdrop(backdrop: BlockBaseProps["backdrop"]): BlockBaseProps["backdrop"] {
  if (!isSpec(backdrop)) return backdrop;
  const o = backdrop.options ?? {};
  const grain = o.grain === true ? <Grain opacity={num(o.grainOpacity, MV102_DEFAULT.grainOpacity)} /> : null;
  let layer: React.ReactNode = null;
  switch (backdrop.variant) {
    case BLOCK_BACKDROP.mesh:
      layer = (
        <MeshGradient
          className={MV102_CLASS.fill}
          colors={Array.isArray(o.colors) ? (o.colors as string[]) : undefined}
          intensity={num(o.intensity, MV102_DEFAULT.meshIntensity)}
          animated={o.animated !== false}
        />
      );
      break;
    case BLOCK_BACKDROP.grain:
      return <Grain opacity={num(o.opacity, MV102_DEFAULT.grainOpacity)} />;
    case BLOCK_BACKDROP.beam:
      layer = (
        <span className={MV102_CLASS.effectHost}>
          <Beam
            color={typeof o.color === "string" ? o.color : undefined}
            x={typeof o.x === "number" ? o.x : undefined}
            y={typeof o.y === "number" ? o.y : undefined}
            angle={typeof o.angle === "number" ? o.angle : undefined}
            intensity={typeof o.intensity === "number" ? o.intensity : undefined}
            animated={o.animated === true}
          />
        </span>
      );
      break;
    case BLOCK_BACKDROP.image:
      if (!backdrop.media?.src) return null;
      layer = <MediaView media={{ ...backdrop.media, alt: "" }} fill />;
      break;
    default:
      return backdrop;
  }
  return (
    <>
      {withMask(backdrop, layer)}
      {grain}
    </>
  );
}

export interface MediaViewProps {
  media: Media;
  /** 铺满父容器 (背景用), 忽略比例. */
  fill?: boolean;
  className?: string;
  videoRef?: React.Ref<HTMLVideoElement>;
  /** 背景视频由区块自己画暂停按钮, 这里关掉 Video 自带的. */
  hideVideoToggle?: boolean;
  onVideoPlay?: () => void;
  onVideoPause?: () => void;
}

/** Media 数据 -> Image / ThemedImage / Video / 自定义节点. 比例盒防 CLS, 焦点映射 object-position. */
export function MediaView({ media, fill, className, videoRef, hideVideoToggle, onVideoPlay, onVideoPause }: MediaViewProps): React.JSX.Element | null {
  const kind = media.kind ?? (media.node ? MEDIA_KIND.node : MEDIA_KIND.image);
  const position = media.focal ? `${media.focal[0] * 100}% ${media.focal[1] * 100}%` : undefined;
  const box = fill ? MV102_CLASS.fill : className;
  const aspect = fill ? undefined : ratioValue(media.ratio);
  if (kind === MEDIA_KIND.node) {
    return media.node ? (
      <div className={box} style={aspect ? { aspectRatio: aspect } : undefined}>
        {media.node}
      </div>
    ) : null;
  }
  if (!media.src) return null;
  if (kind === MEDIA_KIND.video) {
    return (
      <div className={box} style={aspect ? { aspectRatio: aspect } : undefined}>
        <Video
          ref={videoRef}
          src={media.src}
          poster={media.poster}
          title={media.alt}
          showToggle={!hideVideoToggle}
          onPlay={onVideoPlay}
          onPause={onVideoPause}
          rootClassName={MV102_CLASS.fill}
          className={MV102_CLASS.fill}
        />
      </div>
    );
  }
  const r = fill ? 1 : (ratioNumber(media.ratio) ?? (media.width && media.height ? media.width / media.height : 1));
  const dark = media.darkSrc ?? media.srcDark;
  const common = {
    alt: media.alt,
    ratio: r,
    priority: media.priority,
    placeholder: media.placeholder,
    objectPosition: position,
    sizes: media.sizes,
    rootClassName: box,
  };
  if (dark) return <ThemedImage {...common} lightSrc={media.src} darkSrc={dark} />;
  return <Image {...common} src={media.src} srcSet={media.srcSet} />;
}

export interface LogoMarkProps {
  logo: Logo;
  grayscale?: boolean;
  /** 统一 logo 高度 (px), 宽度按 width/height 比例推算. */
  height?: number;
  className?: string;
}

/** 一枚 logo: 灰度 + 悬停 / 聚焦复色; 有 href 时是链接, alt 取 name. 亮暗双图走 ThemedImage. */
export function LogoMark({ logo, grayscale = MV102_DEFAULT.logoGrayscale, height = MV102_DEFAULT.logoHeight, className }: LogoMarkProps): React.JSX.Element {
  const dark = logo.darkSrc ?? logo.srcDark;
  const w = logo.width ?? MV102_DEFAULT.logoWidth;
  const h = logo.height ?? height;
  const width = Math.round((w / h) * height);
  const common = { alt: logo.name, width, height, fit: "contain" as const, placeholder: "none", className: MV102_CLASS.logoImg };
  const img = dark ? <ThemedImage {...common} lightSrc={logo.src} darkSrc={dark} /> : <Image {...common} src={logo.src} />;
  return (
    <span data-slot={MV102_SLOT.logo} className={cn(MV102_CLASS.logoItem, grayscale && MV102_CLASS.logoGray, className)}>
      {logo.href ? (
        <a href={logo.href} className={MV102_CLASS.logoLink}>
          {img}
        </a>
      ) : (
        img
      )}
    </span>
  );
}
