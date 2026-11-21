/**
 * 模型到现有区块与 head 的适配: ProductModel + 当前选择 -> ProductDetail 的数据, Product JSON-LD 的输入.
 * 区块继续吃自己的 props, 适配只在这里写一次, 模板与业务方都不再手拼.
 */
import type { DetailOption, ProductDetailData } from "../blocks/commerce/ProductDetail";
import type { ProductCardData } from "../blocks/commerce/ProductCard";
import type { StockData } from "../blocks/commerce/commerce-v108-parts";
import type { Cta, Media } from "../blocks/_shared/types";
import { OPTION_KIND, VALUE_STATE } from "../constants/model-commerce";
import type { LdAvailability, ProductLdInput } from "../page/meta";
import type { ProductModel, Selection } from "./catalog";
import { axisAvailability, candidates, findVariant, priceRange } from "./variant";

const LD_IN_STOCK: LdAvailability = "inStock";
const LD_OUT: LdAvailability = "outOfStock";

/** 画廊顺序: 已选 swatch 值指定的几张排在最前, 其余按原顺序. */
export function galleryOrder(product: ProductModel, selection: Selection): number[] {
  const lead: number[] = [];
  for (const axis of product.options) {
    const picked = axis.values.find((v) => v.value === selection[axis.name]);
    for (const i of picked?.media ?? []) if (i < product.media.length && !lead.includes(i)) lead.push(i);
  }
  return [...lead, ...product.media.map((_, i) => i).filter((i) => !lead.includes(i))];
}

/** 当前选择下的选项: 每个值的 stock 与 disabled 按其他轴的已选值算. */
export function detailOptions(product: ProductModel, selection: Selection): DetailOption[] {
  return product.options.map((axis) => {
    const states = new Map(axisAvailability(product, axis, selection).map((a) => [a.value, a]));
    return {
      name: axis.name,
      type: axis.kind,
      values: axis.values.map((v) => {
        const a = states.get(v.value);
        return {
          value: v.value,
          label: v.label,
          color: v.color,
          stock: a?.stock,
          disabled: a?.state === VALUE_STATE.missing,
        };
      }),
    };
  });
}

/** 库存行: 选完时报该 SKU 的库存, 未选完时报候选合计. */
export function stockOf(product: ProductModel, selection: Selection): StockData {
  const variant = findVariant(product, selection);
  const quantity = variant ? variant.stock : candidates(product, selection).reduce((s, v) => s + Math.max(0, v.stock), 0);
  return { quantity };
}

/** ProductDetail 的全部数据. ctas 由调用方给 (加购, 收藏), 选完且缺货时自动禁用第一个. */
export function toProductDetail(product: ProductModel, selection: Selection, ctas: readonly Cta[]): ProductDetailData {
  const variant = findVariant(product, selection);
  const range = priceRange(variant ? [variant] : candidates(product, selection)) ?? priceRange(product.variants);
  const stock = stockOf(product, selection);
  const gallery: Media[] = galleryOrder(product, selection).map((i) => ({ ...product.media[i] }));
  const soldOut = variant !== undefined && variant.stock <= 0;
  return {
    gallery,
    eyebrow: product.brand,
    title: product.title,
    subtitle: product.subtitle,
    price: { amount: range?.min ?? 0, currency: product.currency, originalAmount: range?.compareAt },
    rating: product.rating,
    options: detailOptions(product, selection),
    stock,
    ctas: ctas.map((c, i) => (i === 0 && soldOut ? { ...c, disabled: true } : { ...c })),
    details: product.details?.map((d) => ({ title: d.title, body: d.body })),
  };
}

/** Product JSON-LD 的输入: 选完时用该 SKU, 否则用最低价候选. */
export function productLdInput(product: ProductModel, selection: Selection, url?: string): ProductLdInput {
  const variant = findVariant(product, selection) ?? [...candidates(product, selection)].sort((a, b) => a.price - b.price)[0];
  const anyStock = variant ? variant.stock > 0 : product.variants.some((v) => v.stock > 0);
  return {
    name: product.title,
    image: product.media.filter((m) => m.alt !== "").map((m) => m.src),
    description: product.description,
    sku: variant?.sku,
    brand: product.brand,
    price: variant?.price ?? 0,
    currency: product.currency,
    availability: anyStock ? LD_IN_STOCK : LD_OUT,
    url,
    rating: product.rating && product.rating.count > 0 ? product.rating : undefined,
  };
}

/** 商品卡数据 (列表, 推荐轨): 最低价 SKU 定价, 全部缺货时标售罄, swatch 轴转色板. */
export function toProductCard(product: ProductModel, href: string): ProductCardData {
  const range = priceRange(product.variants);
  const swatch = product.options.find((a) => a.kind === OPTION_KIND.swatch);
  const cover = product.media[0];
  return {
    id: product.id,
    href,
    title: product.title,
    subtitle: product.subtitle,
    media: { src: cover?.src, alt: cover?.alt ?? "" },
    price: { amount: range?.min ?? 0, currency: product.currency, originalAmount: range?.compareAt },
    rating: product.rating,
    soldOut: product.variants.every((v) => v.stock <= 0),
    swatches: swatch?.values.filter((v) => v.color).map((v) => ({ value: v.value, label: v.label, color: v.color })),
  };
}
