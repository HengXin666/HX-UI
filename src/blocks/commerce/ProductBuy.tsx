"use client";

import * as React from "react";
import { ProductDetail, type ProductDetailProps } from "./ProductDetail";
import type { Cta } from "../_shared/types";
import type { ProductModel, Selection } from "../../commerce/catalog";
import { toProductDetail } from "../../commerce/adapt";
import { defaultSelection, describeSelection, findVariant, selectValue } from "../../commerce/variant";
import type { VariantModel } from "../../commerce/catalog";

export interface ProductBuyProps extends Omit<ProductDetailProps, keyof ReturnType<typeof toProductDetail> | "selection" | "defaultSelection" | "onSelectionChange"> {
  product: ProductModel;
  /** 加购, 收藏等按钮; 选完且缺货时第一个自动禁用. */
  ctas: readonly Cta[];
  /** 受控选择. */
  selection?: Selection;
  defaultSelection?: Selection;
  onSelectionChange?: (selection: Selection, variant: VariantModel | undefined) => void;
}

/**
 * 模型驱动的购买区: 包现有 ProductDetail, 选择变化时按 SKU 矩阵重算每个选项的库存与可选态, 价格跟随当前 SKU,
 * 画廊把所选颜色的实拍排到最前; 改颜色后与之组合不出 SKU 的尺码会被清掉. 读屏在 aria-live 里报当前组合.
 * .agents/notes/implemented/architecture/2026-11-20-omni-content-model.md
 */
export function ProductBuy({ product, ctas, selection, defaultSelection: initial, onSelectionChange, ...rest }: ProductBuyProps): React.JSX.Element {
  const [own, setOwn] = React.useState<Selection>(() => initial ?? defaultSelection(product));
  const current = selection ?? own;
  const data = React.useMemo(() => toProductDetail(product, current, ctas), [product, current, ctas]);

  const change = (next: Record<string, string>): void => {
    const axis = product.options.find((a) => next[a.name] !== current[a.name]);
    const resolved = axis ? selectValue(product, current, axis.name, next[axis.name]) : next;
    if (selection === undefined) setOwn(resolved);
    onSelectionChange?.(resolved, findVariant(product, resolved));
  };

  return (
    <>
      <ProductDetail {...rest} {...data} selection={{ ...current }} onSelectionChange={change} />
      <p aria-live="polite" className="sr-only" data-slot="product-buy-status">{describeSelection(product, current)}</p>
    </>
  );
}
