"use client";

import type * as React from "react";
import { DASH_CLASS, DASH_DEFAULT, DASH_SLOT, dashText, type DASH_KPI_COLUMNS, type KPI_ROW_SLOTS } from "../../constants/blocks-dashboard-v110";
import { StatCard, StatGrid, type StatCardProps } from "../../layout/StatCard";
import { Skeleton } from "../../primitives/skeleton";
import { cn } from "../../primitives/utils";
import { BlockShell, resolveSlots } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, SectionHeadingData, SlotClassNames } from "../_shared/types";

export type KpiRowSlot = (typeof KPI_ROW_SLOTS)[number];
export type KpiRowColumns = (typeof DASH_KPI_COLUMNS)[number];

/** 一张指标卡: 即 StatCardProps, 另加可选 key 与 href (整卡可点). */
export type KpiItem = StatCardProps & { key?: string; href?: string };

export interface KpiRowState {
  count: number;
  loading: boolean;
}

export interface KpiRowProps extends Omit<BlockBaseProps, "classNames" | "labels"> {
  items: ReadonlyArray<KpiItem>;
  heading?: SectionHeadingData;
  /** 宽容器下的列数; 窄容器先掉到 2 列再到 1 列 (与 StatGrid 同构). 默认 4. */
  columns?: KpiRowColumns;
  /** 加载中: 渲染与 columns 同数的骨架卡, 根节点 aria-busy. */
  loading?: boolean;
  classNames?: SlotClassNames<KpiRowSlot, KpiRowState>;
  labels?: Partial<Record<string, string>>;
  ref?: React.Ref<HTMLElement>;
}

/**
 * 指标行 (设计文档 4.5): 复用 layout/StatCard 与 StatGrid, 趋势 / 迷你折线 / 语气色全部沿用 StatCard 的语义.
 * 数值建议调用方先用 BlocksProvider.formatNumber / formatMoney 格式化后传入 value.
 */
export function KpiRow({
  items,
  heading,
  columns = DASH_DEFAULT.kpiColumns,
  loading = false,
  classNames,
  labels,
  pad = DASH_DEFAULT.pad,
  width = DASH_DEFAULT.width,
  ref,
  "aria-label": ariaLabel,
  ...shell
}: KpiRowProps): React.JSX.Element {
  const { locale } = useBlocks();
  const text = dashText(locale, labels);
  const cls = resolveSlots<KpiRowSlot, KpiRowState, string>(classNames, { count: items.length, loading });
  return (
    <BlockShell
      {...shell}
      ref={ref}
      pad={pad}
      width={width}
      heading={heading}
      renderHeading={renderSectionHeading}
      aria-label={ariaLabel ?? (heading === undefined ? text.kpi : undefined)}
      className={cn(cls.root, shell.className)}
    >
      <div data-slot={DASH_SLOT.kpi} aria-busy={loading || undefined} data-loading={loading || undefined}>
        <StatGrid columns={columns} className={cls.grid}>
          {loading
            ? Array.from({ length: columns }, (_, index) => <Skeleton key={index} className={DASH_CLASS.kpiSkeleton} />)
            : items.map(({ key, href, ...card }, index) => {
                const node = <StatCard {...card} data-slot={DASH_SLOT.kpiItem} className={cn(DASH_CLASS.kpiItem, cls.item, card.className)} />;
                const itemKey = key ?? (typeof card.label === "string" ? card.label : index);
                return href === undefined ? (
                  <div key={itemKey}>{node}</div>
                ) : (
                  <a key={itemKey} href={href} className={cn(DASH_CLASS.kpiLink, DASH_CLASS.focus)}>
                    {node}
                  </a>
                );
              })}
        </StatGrid>
      </div>
    </BlockShell>
  );
}
