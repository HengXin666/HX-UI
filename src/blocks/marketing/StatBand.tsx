"use client";

import * as React from "react";
import { BLOCK_REVEAL } from "../../constants/blocks";
import { MV103_CLASS, MV103_DEFAULT, MV103_SLOT, STAT_BAND_COLS, STAT_BAND_VARIANT, statColsOf } from "../../constants/blocks-marketing-v103";
import { MOTION_TAG } from "../../constants/motion";
import { AnimatedNumber } from "../../motion/AnimatedNumber";
import { StaggerItem } from "../../motion/Stagger";
import { cn } from "../../primitives/utils";
import { useBlocks } from "../_shared/BlocksProvider";
import { BlockShell } from "../_shared/BlockShell";
import { renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, Rich, SectionHeadingData, Stat } from "../_shared/types";

/** 一个指标: 值 + 前缀 / 后缀 + 标签 + 可选补充说明与数字格式. */
export interface StatBandItem extends Stat {
  key?: string;
  /** 标签下的补充说明 (口径, 统计时间). */
  description?: Rich;
  /** 数值的 Intl 格式 (紧凑写法, 百分比, 小数位). 仅 value 为数字时生效. */
  format?: Intl.NumberFormatOptions;
}

export interface StatBandProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  /** 2 到 4 个指标; 超出的列数按 4 排. */
  items: StatBandItem[];
  /** 数字进入视口时从 0 滚到目标值; 减弱动效时直接显示终值. 默认 true. */
  animate?: boolean;
  /** inline: 起始侧 1px 分隔线; card: 卡片. */
  variant?: (typeof STAT_BAND_VARIANT)[keyof typeof STAT_BAND_VARIANT];
  ref?: React.Ref<HTMLElement>;
}

function Cell({ stagger, className, children }: { stagger: boolean; className: string; children: React.ReactNode }): React.JSX.Element {
  if (stagger) return <StaggerItem as={MOTION_TAG.li} className={className}>{children}</StaggerItem>;
  return <li className={className}>{children}</li>;
}

/** 值: 数字走 AnimatedNumber (或静态 Intl 格式), 字符串原样. */
function StatValue({ item, animate, locale, formatNumber }: { item: StatBandItem; animate: boolean; locale: string; formatNumber: (v: number, o?: Intl.NumberFormatOptions) => string }): React.JSX.Element {
  const { value } = item;
  if (typeof value !== "number") return <span>{value}</span>;
  if (!animate) return <span>{formatNumber(value, item.format)}</span>;
  return <AnimatedNumber value={value} from={MV103_DEFAULT.statFrom} locale={locale} format={item.format} />;
}

/**
 * 大数字数据带 (shopify 的 15% / 250M+, stripe 的 backbone 数据). 2 到 4 个指标, 4 -> 2 -> 1 列.
 * 数字滚动复用 motion/AnimatedNumber: 读屏只读终值, 减弱动效时跳到终值. 数字格式走 BlocksProvider 的 locale.
 * 遵循 docs/architecture/component-contract.md.
 */
export function StatBand({
  heading,
  items,
  animate = true,
  variant = MV103_DEFAULT.statVariant,
  labels: _labels,
  reveal,
  ref,
  ...shell
}: StatBandProps): React.JSX.Element {
  const { locale, formatNumber } = useBlocks();
  const stagger = reveal === BLOCK_REVEAL.stagger;
  const cols = statColsOf(items.length);
  const itemClass = variant === STAT_BAND_VARIANT.card ? MV103_CLASS.statCard : MV103_CLASS.statInline;
  return (
    <BlockShell {...shell} ref={ref} reveal={reveal} heading={heading} renderHeading={renderSectionHeading}>
      <ul role="list" data-slot={MV103_SLOT.statList} data-variant={variant} className={cn(MV103_CLASS.list, STAT_BAND_COLS[cols])}>
        {items.map((item, index) => (
          <Cell key={item.key ?? index} stagger={stagger} className={itemClass}>
            <p data-slot={MV103_SLOT.statValue} className={MV103_CLASS.statValue}>
              {item.prefix !== undefined && <span className={MV103_CLASS.statAffix}>{item.prefix}</span>}
              <StatValue item={item} animate={animate} locale={locale} formatNumber={formatNumber} />
              {item.suffix !== undefined && <span className={MV103_CLASS.statAffix}>{item.suffix}</span>}
            </p>
            <p data-slot={MV103_SLOT.statLabel} className={MV103_CLASS.statLabel}>
              {item.href !== undefined ? (
                <a href={item.href} className={MV103_CLASS.statLink}>
                  {item.label}
                </a>
              ) : (
                item.label
              )}
            </p>
            {item.description !== undefined && <p className={MV103_CLASS.body}>{item.description}</p>}
          </Cell>
        ))}
      </ul>
    </BlockShell>
  );
}
