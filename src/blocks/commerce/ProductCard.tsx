"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import { BROWSE_CLASS as C, BROWSE_ICON, BROWSE_NUMBERS, COMMERCE_BROWSE_SLOT, browseSlot, type BrowseTexts } from "../../constants/blocks-commerce-v107";
import { COMMERCE_SIZE, PRICE_PERIOD, PROMO_KIND } from "../../constants/commerce";
import { Price, ProductSwatch, PromoBadge, RatingSummary } from "../../commerce";
import { useControllableState } from "../../hooks/state/useControllableState";
import { cn } from "../../primitives/utils";
import { useBlocks } from "../_shared/BlocksProvider";
import type { Badge, HeadingLevel, Media, MediaRatio, Money, Rich } from "../_shared/types";
import { BlockMedia, ratioOf, useBrowseTexts } from "./browse/media";

const HEADING_TAG = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;
const slot = (part?: string): string => browseSlot(COMMERCE_BROWSE_SLOT.productCard, part);

/** 角标: kind 走 PromoBadge 的内置文案 (NEW / SALE / -30% / 仅剩 N), label 给自定义文案. */
export interface ProductBadgeData {
  kind?: "new" | "sale" | "discount" | "limited" | "low-stock" | "custom";
  label?: Rich;
  tone?: Badge["tone"];
  /** kind="discount" 的折扣率 (0 到 1); 不传时由价格自动算. */
  discount?: number;
  remaining?: number;
}

/** 一个色板: 选中后主图 (与 hover 图) 换成该色的图. */
export interface ProductSwatchData {
  value: string;
  /** 颜色名, 也是可访问名. */
  label: string;
  /** 来自商品数据的 CSS 颜色; 组件不内置色值. */
  color?: string;
  media?: Media;
  hoverMedia?: Media;
  disabled?: boolean;
}

/** 商品卡的数据形态 (可 JSON 序列化). */
export interface ProductCardData {
  id?: string;
  href: string;
  title: Rich;
  subtitle?: Rich;
  media: Media;
  /** hover / 焦点进入时换上的第二张图. */
  hoverMedia?: Media;
  price: Money;
  badges?: ProductBadgeData[];
  swatches?: ProductSwatchData[];
  rating?: { value: number; count?: number; href?: string };
  soldOut?: boolean;
}

export interface ProductCardProps extends ProductCardData {
  className?: string;
  style?: React.CSSProperties;
  /** 图片比例; 默认 1 (方图), shopify 拼贴用 16/10. */
  ratio?: MediaRatio;
  /** 透传给 Image 的 sizes. */
  sizes?: string;
  /** 标题层级, 默认 h3. */
  headingLevel?: HeadingLevel;
  /** 首屏卡: 主图不懒加载. */
  priority?: boolean;
  /** 当前色板 (受控) 三件套. */
  swatch?: string;
  defaultSwatch?: string;
  onSwatchChange?: (value: string) => void;
  /** 显示收藏按钮; 收藏状态三件套. */
  showFavorite?: boolean;
  favorite?: boolean;
  defaultFavorite?: boolean;
  onFavoriteChange?: (favorite: boolean) => void;
  /** 快速加购: 回调渲染默认按钮; quickAdd 插槽可整个替换 (节点或按商品渲染). */
  onQuickAdd?: (product: ProductCardData) => void;
  quickAdd?: React.ReactNode | ((product: ProductCardData, soldOut: boolean) => React.ReactNode);
  /** 区块内置文案覆盖 (收藏 / 加购 / 售罄). */
  texts?: Partial<BrowseTexts>;
  ref?: React.Ref<HTMLElement>;
}

const PERIOD = { month: PRICE_PERIOD.month, year: PRICE_PERIOD.year, once: undefined } as const;

/**
 * 商品卡: 主图 + hover 换图, 色板换主图, 角标, 标题 / 副标题, Price (原价划线, Intl), 评分摘要, 售罄态, 快速加购插槽, 收藏.
 * 整卡可点: 标题里的 <a> 用 ::after 铺满卡片 (stretched link), 色板 / 收藏 / 加购抬到 z-10 之上, 读屏只读到一个链接.
 */
export function ProductCard(props: ProductCardProps): React.JSX.Element {
  const {
    id, href, title, subtitle, media, hoverMedia, price, badges, swatches, rating, soldOut = false,
    className, style, ratio, sizes, headingLevel = 3, priority, swatch, defaultSwatch, onSwatchChange,
    showFavorite = false, favorite, defaultFavorite = false, onFavoriteChange, onQuickAdd, quickAdd, texts, ref,
  } = props;
  const { locale } = useBlocks();
  const t = useBrowseTexts(texts);
  const titleId = React.useId();
  const [current, setCurrent] = useControllableState<string | undefined>({
    value: swatch,
    defaultValue: defaultSwatch ?? swatches?.[BROWSE_NUMBERS.first]?.value,
    onChange: onSwatchChange,
  });
  const [faved, setFaved] = useControllableState<boolean>({ value: favorite, defaultValue: defaultFavorite, onChange: onFavoriteChange });
  const active = swatches?.find((s) => s.value === current);
  const main = { ...media, priority: priority ?? media.priority, ...active?.media };
  const second = active?.hoverMedia ?? (active?.media ? undefined : hoverMedia);
  const r = ratioOf(ratio ?? media.ratio, BROWSE_NUMBERS.cardRatio);
  const original = price.originalAmount ?? price.compareAt;
  const Heading = HEADING_TAG[headingLevel];
  const data: ProductCardData = { id, href, title, subtitle, media, hoverMedia, price, badges, swatches, rating, soldOut };

  const quick =
    typeof quickAdd === "function"
      ? quickAdd(data, soldOut)
      : (quickAdd ??
        (onQuickAdd && (
          <button
            type={BUTTON_TYPE}
            data-slot={slot("quick-add")}
            disabled={soldOut}
            aria-describedby={titleId}
            onClick={() => onQuickAdd(data)}
            className={cn(C.cardQuickButton, C.colors, C.focus)}
          >
            <span aria-hidden data-slot={slot("quick-add-icon")} className={cn(BROWSE_ICON.cart, C.icon)} />
            {soldOut ? t.soldOut : t.quickAdd}
          </button>
        )));

  return (
    <article
      ref={ref}
      id={id}
      aria-labelledby={titleId}
      data-slot={slot()}
      data-sold-out={soldOut || undefined}
      className={cn(C.card, className)}
      style={style}
    >
      <div data-slot={slot("media")} className={C.cardMedia}>
        <div className={cn(soldOut && C.cardSoldOut)}>
          <BlockMedia media={main} ratio={r} fallbackRatio={BROWSE_NUMBERS.cardRatio} sizes={sizes} data-slot={slot("image")} />
          {second && (
            <div aria-hidden data-slot={slot("hover-image")} className={cn(C.cardHover, C.fade)}>
              <BlockMedia media={second} ratio={r} fallbackRatio={BROWSE_NUMBERS.cardRatio} sizes={sizes} decorative />
            </div>
          )}
        </div>
        {(soldOut || (badges?.length ?? 0) > 0) && (
          <div data-slot={slot("badges")} className={C.cardBadges}>
            {soldOut && <PromoBadge locale={locale}>{t.soldOut}</PromoBadge>}
            {badges?.map((b, i) => (
              <PromoBadge
                key={typeof b.label === "string" ? b.label : `${b.kind ?? PROMO_KIND.custom}-${i}`}
                kind={b.kind ?? PROMO_KIND.custom}
                tone={b.tone}
                discount={b.discount}
                remaining={b.remaining}
                locale={locale}
              >
                {b.label}
              </PromoBadge>
            ))}
          </div>
        )}
        {showFavorite && (
          <div data-slot={slot("actions")} className={C.cardActions}>
            <button
              type={BUTTON_TYPE}
              data-slot={slot("favorite")}
              aria-pressed={faved}
              aria-label={faved ? t.unfavorite : t.favorite}
              aria-describedby={titleId}
              onClick={() => setFaved(!faved)}
              className={cn(C.iconButton, C.colors, C.focus)}
            >
              <span aria-hidden className={cn(faved ? BROWSE_ICON.favorited : BROWSE_ICON.favorite, C.icon)} />
            </button>
          </div>
        )}
        {quick && (
          <div data-slot={slot("quick")} className={cn(C.cardQuick, C.fade)}>
            {quick}
          </div>
        )}
      </div>
      <div data-slot={slot("body")} className={C.cardBody}>
        {swatches && swatches.length > 1 && (
          <ProductSwatch
            data-slot={slot("swatches")}
            className={C.raise}
            size={COMMERCE_SIZE.sm}
            locale={locale}
            value={current ?? null}
            onValueChange={(v) => v !== null && setCurrent(v)}
            options={swatches.map((s) => ({ value: s.value, label: s.label, color: s.color, image: s.color ? undefined : s.media?.src, disabled: s.disabled }))}
          />
        )}
        <Heading id={titleId} data-slot={slot("title")} className={C.cardTitle}>
          <a href={href} data-slot={slot("link")} className={cn(C.cardLink, C.focus)}>
            {title}
          </a>
        </Heading>
        {subtitle !== undefined && (
          <p data-slot={slot("subtitle")} className={C.cardSubtitle}>
            {subtitle}
          </p>
        )}
        <div data-slot={slot("meta")} className={C.cardMeta}>
          <Price
            data-slot={slot("price")}
            amount={price.amount}
            originalAmount={original}
            currency={price.currency}
            period={price.period ? PERIOD[price.period] : undefined}
            locale={locale}
          />
          {rating && <RatingSummary className={C.raise} compact value={rating.value} count={rating.count} href={rating.href} locale={locale} />}
        </div>
      </div>
    </article>
  );
}
