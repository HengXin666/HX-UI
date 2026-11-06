"use client";

import * as React from "react";
import {
  BLOCK_ALIGN,
  BLOCK_CLASS,
  BLOCK_DEFAULT,
  BLOCK_SLOT,
  CTA_BUTTON_SIZE,
  CTA_BUTTON_VARIANT,
  EXTERNAL_LINK,
} from "../../constants/blocks";
import { BUTTON_TYPE } from "../../constants";
import { IconSlot } from "../../layout/Icon";
import { Button } from "../../primitives/button";
import { cn } from "../../primitives/utils";
import { Display } from "../../typography/Display";
import { useBlockLabels } from "./BlocksProvider";
import { resolveSlots, useBlockShell } from "./BlockShell";
import type { BlockAlign, BlockTitleSize, Cta, CtaGroupSlot, HeadingLevel, SectionHeadingData, SectionHeadingSlot, SlotClassNames, SlotStyles } from "./types";

const HEADING_TAG = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;

export interface CtaButtonProps {
  cta: Cta;
  className?: string;
  classNames?: Partial<Record<Exclude<CtaGroupSlot, "root" | "item">, string>>;
  ref?: React.Ref<HTMLElement>;
}

/**
 * 把一条 Cta 数据渲染成按钮或链接 (有 href 即 <a>). 外链自动补 rel 与读屏提示 (文案来自 BlocksProvider).
 * ref 作为普通 prop (React 19), 指向 <a> 或 <button>.
 */
export function CtaButton({ cta, className, classNames, ref }: CtaButtonProps): React.JSX.Element {
  const labels = useBlockLabels();
  const variant = CTA_BUTTON_VARIANT[cta.variant ?? BLOCK_DEFAULT.ctaVariant];
  const size = CTA_BUTTON_SIZE[cta.size ?? BLOCK_DEFAULT.ctaSize];
  const icon = cta.icon ? (
    <span aria-hidden data-slot={BLOCK_SLOT.ctaIcon} className={cn("inline-flex", classNames?.icon)}>
      <IconSlot source={cta.icon} />
    </span>
  ) : null;
  const inner = (
    <>
      {!cta.iconEnd && icon}
      <span data-slot={BLOCK_SLOT.ctaLabel} className={classNames?.label}>{cta.label}</span>
      {cta.iconEnd && icon}
      {cta.external && <span className="sr-only">{` (${labels.externalLink})`}</span>}
    </>
  );
  if (cta.href !== undefined) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          data-slot={BLOCK_SLOT.cta}
          href={cta.disabled ? undefined : cta.href}
          aria-disabled={cta.disabled || undefined}
          aria-label={cta.ariaLabel}
          onClick={cta.onClick}
          {...(cta.external ? EXTERNAL_LINK : {})}
        >
          {inner}
        </a>
      </Button>
    );
  }
  return (
    <Button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={BUTTON_TYPE}
      data-slot={BLOCK_SLOT.cta}
      variant={variant}
      size={size}
      disabled={cta.disabled}
      aria-label={cta.ariaLabel}
      onClick={cta.onClick}
      className={className}
    >
      {inner}
    </Button>
  );
}

export interface CtaGroupProps {
  items: ReadonlyArray<Cta>;
  className?: string;
  classNames?: Partial<Record<CtaGroupSlot, string>>;
  ref?: React.Ref<HTMLDivElement>;
}

/** 一组 Cta, 横排换行. 空数组不渲染. */
export function CtaGroup({ items, className, classNames, ref }: CtaGroupProps): React.JSX.Element | null {
  if (items.length === 0) return null;
  return (
    <div ref={ref} data-slot={BLOCK_SLOT.ctaGroup} className={cn(BLOCK_CLASS.actions, classNames?.root, className)}>
      {items.map((cta, index) => (
        <CtaButton key={typeof cta.label === "string" ? cta.label : index} cta={cta} className={classNames?.item} classNames={classNames} />
      ))}
    </div>
  );
}

export interface SectionHeadingState {
  align: BlockAlign;
  titleSize: BlockTitleSize;
}

export interface SectionHeadingProps extends SectionHeadingData {
  /** 不传时继承所在 BlockShell 的 align. */
  align?: BlockAlign;
  /** 标题尺度档, 与 typography 层 Display sm..2xl 同名. */
  titleSize?: BlockTitleSize;
  /** 标题层级, 默认 h2. */
  level?: HeadingLevel;
  /** 标题元素 id; BlockShell 渲染时传入, 用作 section 的 aria-labelledby. */
  titleId?: string;
  /** 自定义动作节点, 渲染在 actions 之后. */
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  classNames?: SlotClassNames<SectionHeadingSlot, SectionHeadingState>;
  styles?: SlotStyles<SectionHeadingSlot, SectionHeadingState>;
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * 区块标题组: 眉标 + 标题 + 导语 + 动作. 所有文案来自 props.
 * 标题渲染 <Display>, 字号 / 字重 / 行高 / 字距 / 字体全部随 Display 读 token, 与 Hero 等同页标题一致 (取证报告 A5).
 * ref 作为普通 prop 指向根 <div> (React 19), 不使用 forwardRef.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
  align: alignProp,
  titleSize = BLOCK_DEFAULT.titleSize,
  level = BLOCK_DEFAULT.headingLevel,
  titleId,
  children,
  className,
  style,
  classNames,
  styles,
  ref,
}: SectionHeadingProps): React.JSX.Element {
  const shell = useBlockShell();
  const align = alignProp ?? shell?.align ?? BLOCK_DEFAULT.align;
  const state: SectionHeadingState = { align, titleSize };
  const cls = resolveSlots(classNames, state);
  const sty = resolveSlots(styles, state);
  const centered = align === BLOCK_ALIGN.center;
  const hasActions = (actions?.length ?? 0) > 0 || children !== undefined;
  return (
    <div
      ref={ref}
      data-slot={BLOCK_SLOT.heading}
      data-align={align}
      data-size={titleSize}
      className={cn("mb-[var(--block-gap-md,calc(var(--spacing)*10))] flex flex-col gap-6", centered ? "items-center text-center" : "items-start text-start", cls.root, className)}
      style={{ ...sty.root, ...style }}
    >
      <div data-slot={BLOCK_SLOT.headingText} className={cn("flex min-w-0 flex-col gap-3", centered && "items-center", cls.text)} style={sty.text}>
        {eyebrow !== undefined && (
          <p data-slot={BLOCK_SLOT.headingEyebrow} className={cn(BLOCK_CLASS.eyebrow, cls.eyebrow)} style={sty.eyebrow}>
            {eyebrow}
          </p>
        )}
        <Display as={HEADING_TAG[level]} id={titleId} size={titleSize} data-slot={BLOCK_SLOT.headingTitle} className={cn(BLOCK_CLASS.displayTone, cls.title)} style={sty.title}>
          {title}
        </Display>
        {description !== undefined && (
          <p data-slot={BLOCK_SLOT.headingDescription} className={cn(BLOCK_CLASS.lead, cls.description)} style={sty.description}>
            {description}
          </p>
        )}
      </div>
      {hasActions && (
        <div data-slot={BLOCK_SLOT.headingActions} className={cn(BLOCK_CLASS.actions, centered && "justify-center", cls.actions)} style={sty.actions}>
          {actions?.map((cta, index) => (
            <CtaButton key={typeof cta.label === "string" ? cta.label : index} cta={cta} />
          ))}
          {children}
        </div>
      )}
    </div>
  );
}

/** 给 BlockShell.renderHeading 用的现成渲染器: 把标题 id 接到 aria-labelledby. */
export function renderSectionHeading(heading: SectionHeadingData, id: string): React.ReactNode {
  return <SectionHeading {...heading} titleId={id} />;
}
