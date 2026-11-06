"use client";

import * as React from "react";
import { BLOCK_ALIGN, BLOCK_TONE, BLOCK_WIDTH } from "../../constants/blocks";
import {
  CTA_BANNER_CLASS,
  CTA_BANNER_FILL,
  CTA_BANNER_VARIANT,
  MV102_CLASS,
  MV102_DEFAULT,
  MV102_SLOT,
} from "../../constants/blocks-marketing-v102";
import { MeshGradient } from "../../effects/MeshGradient";
import { cn } from "../../primitives/utils";
import { Display } from "../../typography/Display";
import { Eyebrow } from "../../typography/Eyebrow";
import { Lead } from "../../typography/Lead";
import { BlockShell } from "../_shared/BlockShell";
import { CtaGroup } from "../_shared/SectionHeading";
import type { BlockBaseProps, BlockTitleSize, Cta, HeadingLevel, Media, Rich } from "../_shared/types";
import { MediaView, resolveBackdrop } from "./parts";

type ValueOf<T> = T[keyof T];
export type CtaBannerVariant = ValueOf<typeof CTA_BANNER_VARIANT>;
export type CtaBannerFill = ValueOf<typeof CTA_BANNER_FILL>;

export interface CtaBannerProps extends BlockBaseProps {
  eyebrow?: Rich;
  title: Rich;
  lead?: Rich;
  /** 一个或两个 (主 + 次). */
  ctas: Cta[];
  /** 背景图 (boxed 时铺在卡片里, full 时铺满区块), 自动加压暗层. */
  media?: Media;
  /** inline 横排 / boxed 卡片 / full 通栏. 默认 boxed. */
  variant?: CtaBannerVariant;
  /** 渐变底纹: none / gradient (--gradient-brand) / mesh. */
  fill?: CtaBannerFill;
  titleSize?: BlockTitleSize;
  titleLevel?: HeadingLevel;
}

const TAG = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;

/** 面板内的底层: 背景图 + 压暗, 或渐变 / mesh. 纯装饰, aria-hidden. */
function PanelFill({ media, fill }: { media?: Media; fill: CtaBannerFill }): React.JSX.Element | null {
  if (!media && fill === CTA_BANNER_FILL.none) return null;
  return (
    <div aria-hidden className={cn(MV102_CLASS.fill, MV102_CLASS.underlay)}>
      {media && <MediaView media={{ ...media, alt: "" }} fill />}
      {media && <span className={MV102_CLASS.scrim} />}
      {fill === CTA_BANNER_FILL.gradient && <span className={CTA_BANNER_CLASS.gradient} />}
      {fill === CTA_BANNER_FILL.mesh && <MeshGradient className={MV102_CLASS.fill} />}
    </div>
  );
}

/**
 * CtaBanner: 转化横幅. inline 是文字左, 按钮右的一行 (窄容器堆叠); boxed 是居中卡片 (supabase / vercel 收尾);
 * full 是通栏色块 (stripe 底部), 默认 brand tone + bleed. 背景图与渐变铺在面板内, 文案全部来自 props.
 */
export function CtaBanner({
  eyebrow,
  title,
  lead,
  ctas,
  media,
  variant = MV102_DEFAULT.ctaVariant,
  fill = MV102_DEFAULT.ctaFill,
  titleSize = MV102_DEFAULT.ctaTitleSize,
  titleLevel = 2,
  backdrop,
  tone,
  align,
  labels: _labels,
  ...shell
}: CtaBannerProps): React.JSX.Element {
  const titleId = React.useId();
  const isInline = variant === CTA_BANNER_VARIANT.inline;
  const isFull = variant === CTA_BANNER_VARIANT.full;
  const resolvedAlign = align ?? (isInline ? BLOCK_ALIGN.start : BLOCK_ALIGN.center);
  const centered = resolvedAlign === BLOCK_ALIGN.center && !isInline;
  const resolvedTone = tone ?? (isFull ? (media ? BLOCK_TONE.image : BLOCK_TONE.brand) : undefined);

  const text = (
    <div data-slot={MV102_SLOT.ctaBannerText} className={cn(CTA_BANNER_CLASS.text, centered && MV102_CLASS.itemsCenter)}>
      {eyebrow !== undefined && <Eyebrow tone="primary">{eyebrow}</Eyebrow>}
      <Display as={TAG[titleLevel]} id={titleId} size={titleSize}>
        {title}
      </Display>
      {lead !== undefined && <Lead measure="default">{lead}</Lead>}
    </div>
  );
  const actions = (
    <div data-slot={MV102_SLOT.ctaBannerActions}>
      <CtaGroup items={ctas.slice(0, 2)} classNames={{ root: centered ? MV102_CLASS.justifyCenter : undefined }} />
    </div>
  );
  const panelClass = cn(
    CTA_BANNER_CLASS.panel,
    CTA_BANNER_CLASS[variant],
    isInline ? CTA_BANNER_CLASS.row : CTA_BANNER_CLASS.column,
  );

  return (
    <BlockShell
      {...shell}
      tone={resolvedTone}
      align={resolvedAlign}
      width={shell.width ?? (isFull ? BLOCK_WIDTH.content : undefined)}
      backdrop={isFull && media ? <MediaFill media={media} /> : resolveBackdrop(backdrop)}
      aria-labelledby={shell["aria-labelledby"] ?? (shell["aria-label"] ? undefined : titleId)}
    >
      <div data-slot={MV102_SLOT.ctaBanner} data-variant={variant} className={panelClass}>
        {!isFull && <PanelFill media={media} fill={fill} />}
        {isFull && fill !== CTA_BANNER_FILL.none && <PanelFill fill={fill} />}
        {text}
        {actions}
      </div>
    </BlockShell>
  );
}

/** full 形态的背景图铺满整个区块 (走外壳背景层). */
function MediaFill({ media }: { media: Media }): React.JSX.Element {
  return (
    <>
      <MediaView media={{ ...media, alt: "" }} fill />
      <span className={MV102_CLASS.scrim} />
    </>
  );
}
