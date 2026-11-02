import type { JSX } from "react";
import {
  BlocksSiteFooter,
  BlocksSiteHeader,
  ComparisonMatrix,
  Faq,
  FeatureAlternating,
  ProductDetail,
  ProductRail,
  Testimonials,
  type BlockRegistry,
} from "@hx/ui";
import { TemplateShell } from "../page-commerce-home/TemplateShell";
import { PRODUCT_BLOCKS, type ProductBlockProps } from "./data";

/** 商品页 registry: 键与 data.ts 的 ProductBlockProps 一一对应. */
export const PRODUCT_REGISTRY = {
  SiteHeader: BlocksSiteHeader,
  ProductDetail,
  FeatureAlternating,
  ComparisonMatrix,
  ProductRail,
  Testimonials,
  Faq,
  SiteFooter: BlocksSiteFooter,
} satisfies BlockRegistry & Record<keyof ProductBlockProps, unknown>;

/**
 * 商品详情页模板 (apple / nike 产品页型), 只组合区块 + 数据:
 * SiteHeader(透明覆盖 + 本地导航) -> ProductDetail(画廊 + 购买面板) -> FeatureAlternating(卖点)
 * -> ComparisonMatrix(规格对比) -> ProductRail(相关推荐) -> Testimonials(评价) -> Faq -> SiteFooter.
 * 皮肤 default / retail / mono 切换.
 */
export function ProductPage(): JSX.Element {
  return <TemplateShell blocks={PRODUCT_BLOCKS} registry={PRODUCT_REGISTRY} />;
}
