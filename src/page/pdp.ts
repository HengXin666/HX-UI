/**
 * 电商详情页模板 (标杆页 A): 一份商品模型 + 评价 + 推荐, 产出带叙事节拍, 美术方向与 Product JSON-LD 的 PageSpec.
 * 换商品只换数据; 换气质只换 direction. 三拍: 购买 (慢), 口碑 (匀), 推荐 (快).
 */
import type { Cta } from "../blocks/_shared/types";
import { BEAT_LAYOUT as L, BEAT_PACE as P, DIRECTION_NAME } from "../constants/page-beat";
import { PDP_BEAT, PDP_PRODUCT_HREF, PDP_SHOT_PREFERENCE, PDP_TEXT } from "../constants/templates-pdp";
import { productLdInput, toProductCard } from "../commerce/adapt";
import type { ProductModel, ReviewModel, Selection, VariantModel } from "../commerce/catalog";
import { validateProduct, type ProductIssue } from "../commerce/validate";
import { defaultSelection } from "../commerce/variant";
import type { ShotRecipeName } from "../motion/recipe-cards";
import { DIRECTIONS, type DirectionName } from "./beat";
import { section, type PageSpec, type StoryBeat } from "./define";
import { productLd } from "./meta";

export interface PdpTemplateInput {
  product: ProductModel;
  reviews?: readonly ReviewModel[];
  related?: readonly ProductModel[];
  direction?: DirectionName;
  /** 本页的规范地址, 写进 canonical 与 JSON-LD. */
  url?: string;
  /** 默认是 "加入购物车" + "收藏". */
  ctas?: readonly Cta[];
  /** 推荐商品的链接; 默认锚点. */
  hrefOf?: (product: ProductModel) => string;
  texts?: Partial<typeof PDP_TEXT>;
  /** 受控选择: 页面外的 BuyBar 等要跟购买区同步时传. */
  selection?: Selection;
  onSelectionChange?: (selection: Selection, variant: VariantModel | undefined) => void;
}

export interface PdpTemplate {
  spec: PageSpec;
  /** 商品数据问题; 非空时页面仍能渲染, 但应在构建期报出来. */
  issues: ProductIssue[];
}

/** 在方向白名单里按偏好挑镜头. SaaS 等模板共用. */
export function shotFor(direction: DirectionName, preference: readonly string[]): ShotRecipeName {
  const allowed = DIRECTIONS[direction].shots;
  return (preference.find((s) => (allowed as readonly string[]).includes(s)) as ShotRecipeName | undefined) ?? allowed[0];
}

/**
 * 拼一张 PDP. 没有评价或推荐时对应的拍直接省掉, 不留空区块.
 */
export function pdpTemplate(input: PdpTemplateInput): PdpTemplate {
  const { product, reviews = [], related = [], direction = DIRECTION_NAME.retailLuxe, url } = input;
  const t = { ...PDP_TEXT, ...input.texts };
  const ctas = input.ctas ?? [{ label: t.addToCart }, { label: t.save, variant: "secondary" as const }];
  const hrefOf = input.hrefOf ?? ((p: ProductModel) => `${PDP_PRODUCT_HREF}${p.handle}`);
  const cover = product.media[0];
  const story: StoryBeat[] = [
    {
      id: PDP_BEAT.buy, lead: t.buyLead, shot: shotFor(direction, PDP_SHOT_PREFERENCE.buy), layout: L.split, pace: P.slow,
      media: cover ? [{ src: cover.src, alt: cover.alt }] : undefined,
      sections: [section("buy", { product, ctas: [...ctas], selection: input.selection, onSelectionChange: input.onSelectionChange }, PDP_BEAT.buy)],
    },
  ];
  if (reviews.length > 0) {
    story.push({
      id: PDP_BEAT.proof, lead: t.proofLead, shot: shotFor(direction, PDP_SHOT_PREFERENCE.proof), layout: L.stack, pace: P.even,
      sections: [section("reviews", { id: PDP_BEAT.proof, heading: { title: t.reviews }, reviews: [...reviews], product }, PDP_BEAT.proof)],
    });
  }
  if (related.length > 0) {
    story.push({
      id: PDP_BEAT.more, lead: t.moreLead, shot: shotFor(direction, PDP_SHOT_PREFERENCE.more), layout: L.rail, pace: P.fast,
      sections: [section("rail", { id: PDP_BEAT.more, heading: { title: t.related }, products: related.map((p) => toProductCard(p, hrefOf(p))) }, PDP_BEAT.more)],
    });
  }
  const spec: PageSpec = {
    direction,
    story,
    meta: {
      title: product.brand ? `${product.title} | ${product.brand}` : product.title,
      description: product.description,
      canonical: url,
      og: cover ? { image: cover.src, type: "product", url } : undefined,
      jsonLd: productLd(productLdInput(product, defaultSelection(product), url)),
    },
  };
  return { spec, issues: validateProduct(product) };
}
