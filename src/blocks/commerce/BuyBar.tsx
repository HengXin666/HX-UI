"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import { BUYBAR_CLASS as C, BUYBAR_TEXT } from "../../constants/sections-commerce";
import { Price } from "../../commerce";
import type { ProductModel, Selection, VariantModel } from "../../commerce/catalog";
import { candidates, describeSelection, findVariant, priceRange } from "../../commerce/variant";

export interface BuyBarProps {
  product: ProductModel;
  selection: Selection;
  /** 主按钮文案, 默认 "加入购物车" 由调用方给. */
  ctaLabel: string;
  /** 选完且有货时点主按钮. */
  onBuy?: (variant: VariantModel) => void;
  /** 盯住的购买区元素 id; 它滚出视口上沿后购买条才出现. */
  watchId: string;
  texts?: Partial<typeof BUYBAR_TEXT>;
}

/** 购买区是否已经整个滚到视口上方. 没有 IntersectionObserver 时永远不出现, 不打扰. */
function useScrolledPast(id: string): boolean {
  const [past, setPast] = React.useState(false);
  React.useEffect(() => {
    const el = document.getElementById(id);
    if (!el || typeof IntersectionObserver !== "function") return;
    const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [id]);
  return past;
}

/**
 * 粘性购买条: 购买区滚出视口后从底部滑入, 显示当前组合与价格.
 * 没选完时主按钮变成 "选择尺码" 并滚回购买区, 选到售罄组合时禁用; 隐藏时整条 inert, 键盘与读屏都跳过它.
 */
export function BuyBar({ product, selection, ctaLabel, onBuy, watchId, texts }: BuyBarProps): React.JSX.Element {
  const t = { ...BUYBAR_TEXT, ...texts };
  const shown = useScrolledPast(watchId);
  const variant = findVariant(product, selection);
  const missing = product.options.find((a) => selection[a.name] === undefined);
  const range = priceRange(candidates(product, selection));
  const soldOut = variant !== undefined && variant.stock <= 0;
  const cover = product.media[0];

  const act = (): void => {
    if (variant && !soldOut) onBuy?.(variant);
    else document.getElementById(watchId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const label = missing ? `${t.choose}${missing.name}` : soldOut ? t.soldOut : ctaLabel;

  return (
    <div role="region" aria-label={t.region} data-slot="buy-bar" data-shown={shown} className={C.bar} inert={!shown || undefined} aria-hidden={!shown || undefined}>
      <div className={C.inner}>
        {cover ? <img src={cover.src} alt="" className={C.thumb} /> : null}
        <div className={C.text}>
          <span className={C.title}>{product.title}</span>
          <span className={C.meta}>{describeSelection(product, selection)}</span>
        </div>
        <span className={C.price} data-slot="buy-bar-price">
          {variant ? (
            <Price amount={variant.price} originalAmount={variant.compareAt} currency={product.currency} />
          ) : range ? (
            <>
              <Price amount={range.min} currency={product.currency} />
              {range.max > range.min ? ` ${t.from}` : null}
            </>
          ) : null}
        </span>
        <button type={BUTTON_TYPE} className={C.cta} disabled={soldOut} onClick={act} data-slot="buy-bar-cta">
          {label}
        </button>
      </div>
    </div>
  );
}
