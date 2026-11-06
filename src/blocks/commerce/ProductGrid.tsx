"use client";

import * as React from "react";
import {
  BROWSE_CLASS as C,
  BROWSE_NUMBERS,
  COMMERCE_BROWSE_SLOT,
  DATA_BOUNDARY,
  PRODUCT_GRID_COLS_CLASS,
  browseSlot,
  type BrowseTexts,
  type DataBoundaryState,
  type ProductGridCols,
} from "../../constants/blocks-commerce-v107";
import { EmptyState } from "../../layout/EmptyState";
import { Skeleton } from "../../primitives/skeleton";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { CtaButton, renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, MediaRatio, Rich, SectionHeadingData } from "../_shared/types";
import { ratioOf, useBrowseTexts } from "./browse/media";
import { ProductCard, type ProductCardData, type ProductCardProps } from "./ProductCard";

const slot = (part?: string): string => browseSlot(COMMERCE_BROWSE_SLOT.productGrid, part);

/** 空态 / 错误态的文案与动作 (可 JSON 序列化). */
export interface ProductGridStateData {
  text?: Rich;
  hint?: Rich;
  action?: Cta;
}

/** 所有卡共享的展示参数 (比例, 收藏, 加购...), 不含单卡数据. */
export type ProductGridCardOptions = Omit<ProductCardProps, keyof ProductCardData | "ref">;

export interface ProductGridProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  products: ProductCardData[];
  /** 列数档 (容器查询): 2 / 3 / 4 / 5, 默认 4. */
  cols?: ProductGridCols;
  /** 数据边界状态: loading 骨架, error 错误态, empty 空态; 不传时按 loading 与 products 长度推断. */
  dataBoundary?: DataBoundaryState;
  /** dataBoundary="loading" 的简写. */
  loading?: boolean;
  /** 骨架卡数, 默认 8. */
  skeletonCount?: number;
  empty?: ProductGridStateData;
  error?: ProductGridStateData;
  /** 错误态的重试回调; 给了就渲染重试按钮 (文案可经 texts.retry 覆盖). */
  onRetry?: () => void;
  card?: ProductGridCardOptions;
  /** 自定义单卡渲染 (10% 定制), 默认渲染 ProductCard. */
  renderCard?: (product: ProductCardData, index: number) => React.ReactNode;
  texts?: Partial<BrowseTexts>;
  ref?: React.Ref<HTMLElement>;
}

/** 由显式状态, loading 与数据长度推断边界状态 (判序 loading > error > empty > ready). */
function resolveState(state: DataBoundaryState | undefined, loading: boolean | undefined, count: number): DataBoundaryState {
  if (state) return state;
  if (loading) return DATA_BOUNDARY.loading;
  return count === 0 ? DATA_BOUNDARY.empty : DATA_BOUNDARY.ready;
}

/** 与真卡同比例的骨架, 防止加载完成时跳动. */
function SkeletonCard({ ratio }: { ratio: number }): React.JSX.Element {
  return (
    <div data-slot={slot("skeleton")} className={C.skeletonStack}>
      <Skeleton className={C.skeletonMedia} style={{ aspectRatio: ratio }} />
      <Skeleton className={C.skeletonLine} />
      <Skeleton className={C.skeletonLineShort} />
    </div>
  );
}

function keyOf(product: ProductCardData, index: number): string {
  return product.id ?? product.href ?? String(index);
}

/**
 * 商品网格: 列数档走容器查询 (窄栏自动降列), loading 渲染同比例骨架, empty / error 用 layout/EmptyState.
 * 列表语义为 ul > li, 加载中 aria-busy.
 */
export function ProductGrid({
  heading,
  products,
  cols = 4,
  dataBoundary,
  loading,
  skeletonCount = BROWSE_NUMBERS.skeletonCount,
  empty,
  error,
  onRetry,
  card,
  renderCard,
  texts,
  ref,
  labels: _labels,
  ...shell
}: ProductGridProps): React.JSX.Element {
  const t = useBrowseTexts(texts);
  const state = resolveState(dataBoundary, loading, products.length);
  const ratio = ratioOf(card?.ratio as MediaRatio | undefined, BROWSE_NUMBERS.cardRatio);
  const gridClass = cn(C.grid, PRODUCT_GRID_COLS_CLASS[cols]);

  let body: React.ReactNode;
  if (state === DATA_BOUNDARY.loading) {
    body = (
      <ul data-slot={slot("list")} aria-busy className={gridClass}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <li key={i} data-slot={slot("item")} className={C.gridItem}>
            <SkeletonCard ratio={ratio} />
          </li>
        ))}
      </ul>
    );
  } else if (state === DATA_BOUNDARY.error || state === DATA_BOUNDARY.empty) {
    const data = state === DATA_BOUNDARY.error ? error : empty;
    const retry = state === DATA_BOUNDARY.error && onRetry ? { label: t.retry, onClick: onRetry, variant: "secondary" as const } : undefined;
    const action = data?.action ?? retry;
    body = (
      <EmptyState
        kind={state === DATA_BOUNDARY.error ? "error" : "empty"}
        text={data?.text}
        hint={data?.hint}
        action={action ? <CtaButton cta={action} /> : undefined}
      />
    );
  } else {
    body = (
      <ul data-slot={slot("list")} aria-label={heading ? undefined : t.products} className={gridClass}>
        {products.map((product, i) => (
          <li key={keyOf(product, i)} data-slot={slot("item")} className={C.gridItem}>
            {renderCard ? renderCard(product, i) : <ProductCard {...card} {...product} />}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <BlockShell {...shell} ref={ref} heading={heading} renderHeading={renderSectionHeading}>
      <div data-slot={slot()} data-state={state}>
        {body}
      </div>
    </BlockShell>
  );
}
