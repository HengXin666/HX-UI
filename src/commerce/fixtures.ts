/**
 * 假数据工厂: 文档站, 模板与测试共用. 量级与价格取真实商品的样子 (非整数, 有缺货, 有不存在的组合), 不写 10,000+ 这类假数字.
 * 数据表在 src/constants/model-fixtures.ts, 这里只拼装.
 */
import { OPTION_KIND } from "../constants/model-commerce";
import {
  FIXTURE_AXIS as AXIS,
  FIXTURE_BRAND,
  FIXTURE_COLORS as COLORS,
  FIXTURE_CURRENCY,
  FIXTURE_MEDIA,
  FIXTURE_NONE,
  FIXTURE_PIC,
  FIXTURE_PIC_SIZE,
  FIXTURE_PRICE,
  FIXTURE_RATING,
  FIXTURE_RELATED,
  FIXTURE_REVIEW as R,
  FIXTURE_SIZES as SIZES,
  FIXTURE_STOCK,
} from "../constants/model-fixtures";
import type { ProductModel, ReviewModel, VariantModel } from "./catalog";

const pic = (seed: string): string => `${FIXTURE_PIC}${seed}${FIXTURE_PIC_SIZE}`;

function variants(): VariantModel[] {
  const out: VariantModel[] = [];
  for (const c of COLORS) {
    FIXTURE_STOCK[c.value].forEach((stock, i) => {
      if (stock === FIXTURE_NONE) return;
      const sale = c.value === FIXTURE_PRICE.saleColor;
      out.push({
        id: `fell-${c.value}-${SIZES[i]}`,
        sku: `FL24-${c.value.toUpperCase()}-${SIZES[i]}`,
        options: { [AXIS.color]: c.value, [AXIS.size]: SIZES[i] },
        price: sale ? FIXTURE_PRICE.sale : FIXTURE_PRICE.regular,
        compareAt: sale ? FIXTURE_PRICE.regular : undefined,
        stock,
      });
    });
  }
  return out;
}

/** 一双三色七码的越野跑鞋, 苔绿限量且有缺码. */
export function sampleProduct(): ProductModel {
  return {
    id: "fell-24",
    handle: "fell-trail-runner",
    title: "Fell 越野跑鞋",
    brand: FIXTURE_BRAND,
    subtitle: "Vibram Megagrip 外底, 前掌 8mm 落差",
    description: "为碎石与湿滑木栈道调校的轻量越野鞋, 单只 286g (42 码).",
    currency: FIXTURE_CURRENCY,
    media: FIXTURE_MEDIA.map((m) => ({ src: pic(m.seed), alt: m.alt })),
    options: [
      { name: AXIS.color, kind: OPTION_KIND.swatch, values: COLORS.map((c) => ({ ...c, media: [...c.media] })) },
      { name: AXIS.size, kind: OPTION_KIND.size, values: SIZES.map((s) => ({ value: s, label: s })) },
    ],
    variants: variants(),
    rating: { ...FIXTURE_RATING },
    details: [
      { title: "尺码建议", body: "楦型偏窄, 脚背高或常穿厚袜建议大半码." },
      { title: "配送与退换", body: "下单后 48 小时内发货, 30 天内未下地可退换." },
    ],
  };
}

/** 18 条评价, 分布偏右但有差评. */
export function sampleReviews(): ReviewModel[] {
  return R.stars.map((stars, i) => ({
    id: `r${i + 1}`,
    stars,
    author: R.authors[i % R.authors.length],
    body: R.bodies[i % R.bodies.length],
    date: `${R.month}${String((i % R.days) + 1).padStart(String(R.days).length, "0")}`,
    options: { [AXIS.color]: COLORS[i % COLORS.length].value, [AXIS.size]: SIZES[(i * R.sizeStep) % SIZES.length] },
  }));
}

/** 搭配推荐: 四件单 SKU 商品, 其中一件售罄, 一件在打折. */
export function sampleRelated(): ProductModel[] {
  return FIXTURE_RELATED.map((r) => ({
    id: r.id,
    handle: r.id,
    title: r.title,
    brand: FIXTURE_BRAND,
    currency: FIXTURE_CURRENCY,
    media: [{ src: pic(r.id), alt: r.alt }],
    options: [],
    variants: [{ id: `${r.id}-one`, options: {}, price: r.price, compareAt: "compareAt" in r ? r.compareAt : undefined, stock: r.stock }],
  }));
}
