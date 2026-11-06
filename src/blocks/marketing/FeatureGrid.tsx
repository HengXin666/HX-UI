"use client";

import * as React from "react";
import { BLOCK_REVEAL, CTA_VARIANT, EXTERNAL_LINK } from "../../constants/blocks";
import { FEATURE_GRID_COLS, FEATURE_GRID_VARIANT, MV103_CLASS, MV103_DEFAULT, MV103_SLOT } from "../../constants/blocks-marketing-v103";
import { MOTION_TAG } from "../../constants/motion";
import { IconSlot } from "../../layout/Icon";
import { StaggerItem } from "../../motion/Stagger";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { CtaButton, renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, IconName, Rich, SectionHeadingData } from "../_shared/types";

/** 一格特性: 图标 + 标题 + 说明 + 可选链接. */
export interface FeatureGridItem {
  /** React key; 未给时用字符串标题或下标. */
  key?: string;
  icon?: IconName;
  title: Rich;
  body?: Rich;
  /** 整格可点: 标题渲染为链接, 热区扩展到整格. */
  href?: string;
  external?: boolean;
  /** 格底的次要链接 (Learn more →). 默认 link 外观. */
  cta?: Cta;
}

export interface FeatureGridProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  items: FeatureGridItem[];
  /** 宽容器下的列数; 小容器自动退到 1 / 2 列. */
  cols?: keyof typeof FEATURE_GRID_COLS;
  /** card 带边框与底色; plain 无边框. */
  variant?: (typeof FEATURE_GRID_VARIANT)[keyof typeof FEATURE_GRID_VARIANT];
  ref?: React.Ref<HTMLElement>;
}

/** stagger 编排时子项由 motion 的 StaggerItem 承接父容器的 hidden / visible. */
function Cell({ stagger, className, children }: { stagger: boolean; className: string; children: React.ReactNode }): React.JSX.Element {
  if (stagger) return <StaggerItem as={MOTION_TAG.li} className={className}>{children}</StaggerItem>;
  return <li className={className}>{children}</li>;
}

function itemKey(item: FeatureGridItem, index: number): string {
  return item.key ?? (typeof item.title === "string" ? item.title : String(index));
}

/**
 * 特性网格 (nextjs / bun 的特性卡, supabase 的产品格). 2 / 3 / 4 列, 容器查询断点, 卡片或无边框.
 * 遵循 docs/architecture/component-contract.md: 文案全部来自 props, 可点格用标题内真实 <a> 扩展热区.
 */
export function FeatureGrid({
  heading,
  items,
  cols = MV103_DEFAULT.featureCols,
  variant = MV103_DEFAULT.featureVariant,
  labels: _labels,
  reveal,
  ref,
  ...shell
}: FeatureGridProps): React.JSX.Element {
  const stagger = reveal === BLOCK_REVEAL.stagger;
  const itemClass = variant === FEATURE_GRID_VARIANT.card ? MV103_CLASS.cardItem : MV103_CLASS.plainItem;
  return (
    <BlockShell {...shell} ref={ref} reveal={reveal} heading={heading} renderHeading={renderSectionHeading}>
      <ul role="list" data-slot={MV103_SLOT.featureGridList} data-variant={variant} data-cols={cols} className={cn(MV103_CLASS.list, FEATURE_GRID_COLS[cols])}>
        {items.map((item, index) => (
          <Cell key={itemKey(item, index)} stagger={stagger} className={itemClass}>
            <div data-slot={MV103_SLOT.featureGridItem} className={MV103_CLASS.itemBody}>
              {item.icon !== undefined && (
                <span aria-hidden data-slot={MV103_SLOT.featureGridIcon} className={MV103_CLASS.icon}>
                  <IconSlot source={item.icon} />
                </span>
              )}
              <h3 data-slot={MV103_SLOT.featureGridTitle} className={MV103_CLASS.title}>
                {item.href !== undefined ? (
                  <a href={item.href} className={MV103_CLASS.stretchedLink} {...(item.external ? EXTERNAL_LINK : {})}>
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </h3>
              {item.body !== undefined && (
                <p data-slot={MV103_SLOT.featureGridBody} className={MV103_CLASS.body}>
                  {item.body}
                </p>
              )}
            </div>
            {item.cta !== undefined && (
              <div className={MV103_CLASS.itemFooter}>
                <CtaButton cta={{ variant: CTA_VARIANT.link, ...item.cta }} />
              </div>
            )}
          </Cell>
        ))}
      </ul>
    </BlockShell>
  );
}
