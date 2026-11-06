"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import {
  BROWSE_CLASS as C,
  BROWSE_ICON,
  COMMERCE_BROWSE_SLOT,
  RAIL_CARD_SIZE,
  RAIL_CARD_WIDTH,
  browseSlot,
  type BrowseTexts,
  type RailCardSize,
} from "../../constants/blocks-commerce-v107";
import { MaskFade } from "../../effects/MaskFade";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { useBlockLabels } from "../_shared/BlocksProvider";
import { CtaButton, SectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, SectionHeadingData } from "../_shared/types";
import { useBrowseTexts } from "./browse/media";
import { useScrollRail } from "./browse/use-scroll-rail";
import { ProductCard, type ProductCardData } from "./ProductCard";
import type { ProductGridCardOptions } from "./ProductGrid";

const slot = (part?: string): string => browseSlot(COMMERCE_BROWSE_SLOT.productRail, part);

export interface ProductRailProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  products: ProductCardData[];
  /** 卡宽档 sm / md / lg (默认 md); 窄容器 (移动端) 一律全宽单卡. */
  cardSize?: RailCardSize;
  /** 显示左右按钮, 默认 true (窄容器隐藏, 靠手势). */
  showControls?: boolean;
  /** 边缘淡出, 默认 true; 只在还能滚的一侧淡出. */
  fade?: boolean;
  /** 轨道末尾 / 标题旁的 "查看全部" 动作. */
  cta?: Cta;
  card?: ProductGridCardOptions;
  renderCard?: (product: ProductCardData, index: number) => React.ReactNode;
  texts?: Partial<BrowseTexts>;
  ref?: React.Ref<HTMLElement>;
}

/**
 * 商品横滑轨道 (apple "Explore the lineup", nike Trending): scroll-snap 吸附, 左右翻页按钮 (到端禁用),
 * 只在可继续滚动的一侧 MaskFade 淡出, 窄容器全宽单卡. 视口可聚焦, 方向键原生滚动; 区域名取标题.
 * src/commerce/engage/Rail 尚未落盘, 这里用 useScrollRail 自带最小实现; Rail 落地后可替换视口层.
 */
export function ProductRail({
  heading,
  products,
  cardSize = RAIL_CARD_SIZE.md,
  showControls = true,
  fade = true,
  cta,
  card,
  renderCard,
  texts,
  labels,
  ref,
  ...shell
}: ProductRailProps): React.JSX.Element {
  const aria = useBlockLabels(labels);
  const t = useBrowseTexts(texts);
  const headingId = React.useId();
  const rail = useScrollRail<HTMLUListElement>();
  const overflow = rail.canPrevious || rail.canNext;

  const controls = showControls && overflow && (
    <div data-slot={slot("controls")} className={C.railControls}>
      {(
        [
          [-1, aria.previous, BROWSE_ICON.previous, rail.canPrevious, "previous-button"],
          [1, aria.next, BROWSE_ICON.next, rail.canNext, "next-button"],
        ] as const
      ).map(([direction, label, icon, enabled, part]) => (
        <button
          key={part}
          type={BUTTON_TYPE}
          data-slot={slot(part)}
          aria-label={label}
          aria-controls={`${headingId}-viewport`}
          disabled={!enabled}
          onClick={() => rail.page(direction)}
          className={cn(C.iconButton, C.colors, C.focus)}
        >
          <span aria-hidden className={cn(icon, C.icon, C.iconFlip)} />
        </button>
      ))}
    </div>
  );

  const list = (
    <ul
      ref={rail.ref}
      id={`${headingId}-viewport`}
      data-slot={slot("viewport")}
      tabIndex={0}
      aria-label={heading ? undefined : t.products}
      aria-labelledby={heading ? headingId : undefined}
      className={cn(C.railViewport, C.focus)}
    >
      {products.map((product, i) => (
        <li key={product.id ?? product.href ?? i} data-slot={slot("item")} className={cn(C.railItem, RAIL_CARD_WIDTH[cardSize])}>
          {renderCard ? renderCard(product, i) : <ProductCard {...card} {...product} />}
        </li>
      ))}
    </ul>
  );

  return (
    <BlockShell {...shell} ref={ref} aria-labelledby={heading ? headingId : shell["aria-labelledby"]}>
      <div data-slot={slot()} className={C.railRoot}>
        <div data-slot={slot("head")} className={C.railHead}>
          {heading && <SectionHeading {...heading} titleId={headingId} classNames={{ root: C.railHeading }} />}
          <div data-slot={slot("head-actions")} className={C.railHeadActions}>
            {cta && <CtaButton cta={cta} />}
            {controls}
          </div>
        </div>
        {fade && rail.fade ? (
          <MaskFade data-slot={slot("fade")} direction={rail.fade}>
            {list}
          </MaskFade>
        ) : (
          list
        )}
      </div>
    </BlockShell>
  );
}
