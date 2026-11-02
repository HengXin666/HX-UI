"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import {
  COMMERCE_TRADE_SLOT,
  DETAIL_OPTION_TYPE,
  TRADE_CLASS as C,
  TRADE_ICON,
  TRADE_DEFAULT,
  TRADE_NUMBERS,
  tradeSlot,
  type DetailOptionType,
  type TradeTexts,
} from "../../constants/blocks-commerce-v108";
import { COMMERCE_SIZE, Price, ProductSwatch, RatingSummary, SizeSelector } from "../../commerce";
import { useControllableState } from "../../hooks/state/useControllableState";
import { Lightbox, type MediaItem } from "../../media";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { CtaButton } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, HeadingLevel, Media, Money, Rich } from "../_shared/types";
import { BlockMedia } from "./browse/media";
import { QuantityStepper, StockLine, fillText, useTradeTexts, type StockData } from "./commerce-v108-parts";

const slot = (part?: string): string => tradeSlot(COMMERCE_TRADE_SLOT.productDetail, part);
const HEADING_TAG = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;
const [ACTIVE, INACTIVE] = ["active", "inactive"] as const;

export interface DetailOptionValue {
  value: string;
  label: string;
  /** swatch: 来自商品数据的 CSS 颜色. */
  color?: string;
  /** swatch: 选中后替换画廊首图. */
  media?: Media;
  /** size: 0 为缺货. */
  stock?: number;
  disabled?: boolean;
}

export interface DetailOption {
  /** 选项名 (颜色, 尺码), 也是 selection 的键. */
  name: string;
  type: DetailOptionType;
  values: DetailOptionValue[];
  /** 选项名右侧的辅助链接或说明 (尺码指南). */
  aside?: Rich;
}

/** 商品详情的数据形态 (可 JSON 序列化). */
export interface ProductDetailData {
  gallery: Media[];
  eyebrow?: Rich;
  title: Rich;
  subtitle?: Rich;
  price: Money;
  rating?: { value: number; count?: number; href?: string };
  options?: DetailOption[];
  stock?: StockData;
  ctas: Cta[];
  details?: { title: Rich; body: Rich; open?: boolean }[];
}

export interface ProductDetailProps extends BlockBaseProps, ProductDetailData {
  headingLevel?: HeadingLevel;
  /** 已选规格 (受控) 三件套: { 颜色: "black", 尺码: "42" }. */
  selection?: Record<string, string>;
  defaultSelection?: Record<string, string>;
  onSelectionChange?: (selection: Record<string, string>) => void;
  /** 显示数量步进器; 数量三件套. */
  showQuantity?: boolean;
  quantity?: number;
  defaultQuantity?: number;
  onQuantityChange?: (quantity: number) => void;
  maxQuantity?: number;
  texts?: Partial<TradeTexts>;
  ref?: React.Ref<HTMLElement>;
}

/** 默认选中: 色板取第一个可选值, 其余类型不预选 (避免替用户选尺码). */
function initialSelection(options: DetailOption[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const o of options ?? []) {
    const first = o.values.find((v) => !v.disabled && v.stock !== 0);
    if (o.type === DETAIL_OPTION_TYPE.swatch && first) out[o.name] = first.value;
  }
  return out;
}

function toItem(m: Media): MediaItem {
  return { src: m.src ?? "", srcSet: m.srcSet, alt: m.alt, placeholder: m.placeholder };
}

/** 一个选项: swatch -> ProductSwatch, size -> SizeSelector, select -> 原生 select. */
function OptionField({ option, value, onChange }: { option: DetailOption; value?: string; onChange: (v: string) => void }): React.JSX.Element {
  const { locale } = useBlocks();
  const labelId = React.useId();
  const current = option.values.find((v) => v.value === value);
  let control: React.ReactNode;
  if (option.type === DETAIL_OPTION_TYPE.swatch) {
    control = (
      <ProductSwatch aria-labelledby={labelId} locale={locale} value={value ?? null} onValueChange={(v) => v !== null && onChange(v)}
        options={option.values.map((v) => ({ value: v.value, label: v.label, color: v.color, image: v.color ? undefined : v.media?.src, disabled: v.disabled }))} />
    );
  } else if (option.type === DETAIL_OPTION_TYPE.size) {
    control = (
      <SizeSelector aria-labelledby={labelId} locale={locale} value={value ?? null} onValueChange={(v) => v !== null && onChange(v)}
        options={option.values.map((v) => ({ value: v.value, label: v.label, stock: v.stock, disabled: v.disabled }))} />
    );
  } else {
    control = (
      <select aria-labelledby={labelId} value={value ?? ""} onChange={(e) => onChange(e.currentTarget.value)} className={cn(C.select, C.focus)}>
        {value === undefined && <option value="" disabled />}
        {option.values.map((v) => (
          <option key={v.value} value={v.value} disabled={v.disabled || v.stock === 0}>{v.label}</option>
        ))}
      </select>
    );
  }
  return (
    <div data-slot={slot("option")} data-type={option.type} className={C.option}>
      <div className={C.optionHead}>
        <span id={labelId} className={C.label}>
          {option.name}
          {current && option.type === DETAIL_OPTION_TYPE.swatch && <span className={C.optionValue}> · {current.label}</span>}
        </span>
        {option.aside}
      </div>
      {control}
    </div>
  );
}

/** 画廊: 桌面主图 + 缩略图排; 移动端横滑吸附 + 圆点. 点主图或放大按钮开灯箱. */
function DetailGallery({ images, texts }: { images: Media[]; texts: TradeTexts }): React.JSX.Element {
  const { formatNumber } = useBlocks();
  const [index, setIndex] = React.useState<number>(TRADE_NUMBERS.first);
  const [zoomed, setZoomed] = React.useState<number | null>(null);
  const track = React.useRef<HTMLDivElement>(null);
  const at = Math.min(index, Math.max(images.length - 1, 0));
  const main = images[at];
  const onScroll = (): void => {
    const el = track.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
  };
  return (
    <div data-slot={slot("gallery")} role="group" aria-label={texts.gallery} className={C.gallery}>
      <div ref={track} onScroll={onScroll} className={C.galleryTrack}>
        {images.map((m, i) => (
          <button key={m.src ?? i} type={BUTTON_TYPE} onClick={() => setZoomed(i)} aria-label={`${texts.zoom}: ${m.alt}`} className={cn(C.gallerySlide, C.galleryMain, C.focus)}>
            <BlockMedia media={{ ...m, priority: i === TRADE_NUMBERS.first || m.priority }} fallbackRatio={TRADE_NUMBERS.galleryRatio} decorative />
          </button>
        ))}
      </div>
      {images.length > 1 && (
        <div aria-hidden className={C.galleryDots}>
          {images.map((m, i) => <span key={m.src ?? i} data-state={i === at ? ACTIVE : INACTIVE} className={C.galleryDot} />)}
        </div>
      )}
      {main && (
        <div className={cn(C.galleryStage, C.galleryMain)}>
          <button type={BUTTON_TYPE} onClick={() => setZoomed(at)} className={cn(C.galleryOpen, C.focus)}>
            <BlockMedia media={{ ...main, priority: true }} fallbackRatio={TRADE_NUMBERS.galleryRatio} data-slot={slot("image")} />
            <span className={C.galleryZoom}>
              <span aria-hidden className={cn(TRADE_ICON.zoom, C.icon)} />
              <span className={C.srOnly}>{texts.zoom}</span>
            </span>
          </button>
        </div>
      )}
      {images.length > 1 && (
        <div data-slot={slot("thumbs")} className={C.thumbs}>
          {images.map((m, i) => (
            <button key={m.src ?? i} type={BUTTON_TYPE} aria-current={i === at || undefined} data-state={i === at ? ACTIVE : INACTIVE}
              aria-label={fillText(texts.thumbnail, { n: formatNumber(i + 1) })} onClick={() => setIndex(i)} className={cn(C.thumb, C.colors, C.focus)}>
              <BlockMedia media={m} ratio={TRADE_NUMBERS.thumbRatio} fallbackRatio={TRADE_NUMBERS.thumbRatio} sizes={TRADE_DEFAULT.thumbSizes} decorative />
            </button>
          ))}
        </div>
      )}
      <Lightbox items={images.filter((m) => m.src).map(toItem)} index={zoomed} onIndexChange={setZoomed} />
    </div>
  );
}

/**
 * 商品详情 (设计稿 4.3, 审计 B14): 桌面左画廊右信息 (信息栏粘性), 移动端画廊横滑 + 圆点, 点图开灯箱.
 * 信息栏: 眉标 / 标题 / 评分 / Price / 规格 (色板, 尺码, 下拉) / 库存 / 数量 / 动作 / 折叠详情 (原生 details, 利于 SEO).
 * 色板值带 media 时替换画廊首图. 布局走容器查询, 放进窄栏也正确.
 */
export function ProductDetail(props: ProductDetailProps): React.JSX.Element {
  const {
    gallery, eyebrow, title, subtitle, price, rating, options, stock, ctas, details, headingLevel = 1,
    selection, defaultSelection, onSelectionChange, showQuantity = false, quantity, defaultQuantity = TRADE_NUMBERS.qtyMin,
    onQuantityChange, maxQuantity, texts, ref, labels: _labels, ...shell
  } = props;
  const { locale, formatNumber } = useBlocks();
  const t = useTradeTexts(texts);
  const titleId = React.useId();
  const [picked, setPicked] = useControllableState<Record<string, string>>({ value: selection, defaultValue: defaultSelection ?? initialSelection(options), onChange: onSelectionChange });
  const [qty, setQty] = useControllableState<number>({ value: quantity, defaultValue: defaultQuantity, onChange: onQuantityChange });
  const swatchMedia = options
    ?.filter((o) => o.type === DETAIL_OPTION_TYPE.swatch)
    .map((o) => o.values.find((v) => v.value === picked[o.name])?.media)
    .find(Boolean);
  const images = swatchMedia ? [swatchMedia, ...gallery.slice(1)] : gallery;
  const Heading = HEADING_TAG[headingLevel];

  return (
    <BlockShell {...shell} ref={ref} aria-labelledby={shell["aria-labelledby"] ?? titleId}>
      <div data-slot={slot()} className={C.detail}>
        <DetailGallery images={images} texts={t} />
        <div data-slot={slot("info")} className={C.info}>
          <div className={C.infoHead}>
            {eyebrow !== undefined && <p className={C.eyebrow}>{eyebrow}</p>}
            <Heading id={titleId} data-slot={slot("title")} className={C.title}>{title}</Heading>
            {subtitle !== undefined && <p className={C.muted}>{subtitle}</p>}
            {rating && <RatingSummary value={rating.value} count={rating.count} href={rating.href} locale={locale} />}
            <Price data-slot={slot("price")} amount={price.amount} originalAmount={price.originalAmount ?? price.compareAt} currency={price.currency} locale={locale} size={COMMERCE_SIZE.lg} />
            {price.note !== undefined && <p className={C.muted}>{price.note}</p>}
          </div>
          {options?.map((o) => (
            <OptionField key={o.name} option={o} value={picked[o.name]} onChange={(v) => setPicked({ ...picked, [o.name]: v })} />
          ))}
          {stock && <StockLine data-slot={slot("stock")} stock={stock} texts={t} formatCount={(n) => formatNumber(n)} />}
          {showQuantity && <QuantityStepper data-slot={slot("quantity")} value={qty} onChange={setQty} max={maxQuantity} describedBy={titleId} texts={t} />}
          <div data-slot={slot("actions")} className={C.actions}>
            {ctas.map((cta, i) => <CtaButton key={typeof cta.label === "string" ? cta.label : i} cta={cta} className={C.action} />)}
          </div>
          {details && details.length > 0 && (
            <div data-slot={slot("details")} role="group" aria-label={t.details} className={C.detailsList}>
              {details.map((d, i) => (
                <details key={typeof d.title === "string" ? d.title : i} open={d.open} className={C.detailsItem}>
                  <summary className={cn(C.detailsSummary, C.focus)}>
                    {d.title}
                    <span aria-hidden className={cn(TRADE_ICON.chevron, C.icon, C.detailsChevron)} />
                  </summary>
                  <div className={C.detailsBody}>{d.body}</div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </BlockShell>
  );
}
