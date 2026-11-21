/**
 * 内容模型: 评价分布与商品校验.
 */
import { describe, expect, it } from "vitest";
import { filterReviews, PRODUCT_ISSUE, sampleProduct, sampleRelated, sampleReviews, summarizeReviews, validateProduct, type ProductModel } from "@src/commerce/model";

describe("summarizeReviews", () => {
  it("分布按 5 到 1 星, 占比和为 1, 平均分一位小数", () => {
    const s = summarizeReviews(sampleReviews());
    expect(s.buckets.map((b) => b.stars)).toEqual([5, 4, 3, 2, 1]);
    expect(s.buckets.reduce((sum, b) => sum + b.count, 0)).toBe(18);
    expect(s.buckets.reduce((sum, b) => sum + b.share, 0)).toBeCloseTo(1);
    expect(s.rating).toEqual({ value: 4.1, count: 18 });
  });

  it("没有评价时为 0, 不出 NaN", () => {
    const s = summarizeReviews([]);
    expect(s.rating).toEqual({ value: 0, count: 0 });
    expect(s.buckets.every((b) => b.share === 0)).toBe(true);
  });

  it("按星级筛选", () => {
    const all = sampleReviews();
    expect(filterReviews(all, 1).map((r) => r.stars)).toEqual([1]);
    expect(filterReviews(all)).toBe(all);
  });
});

describe("validateProduct", () => {
  it("样例数据没有问题", () => {
    expect(validateProduct(sampleProduct())).toEqual([]);
    for (const p of sampleRelated()) expect(validateProduct(p)).toEqual([]);
  });

  it("挑出未知值, 缺轴, 重复组合, 坏价格, 坏划线价, 坏库存, 缺 alt", () => {
    const base = sampleProduct();
    const bad: ProductModel = {
      ...base,
      media: [{ src: "a", alt: " " }, { src: "b", alt: "" }],
      variants: [
        { id: "a", options: { 颜色: "sand", 尺码: "40" }, price: 10, stock: 1 },
        { id: "b", options: { 颜色: "sand", 尺码: "40" }, price: 0, compareAt: 0, stock: -1 },
        { id: "c", options: { 颜色: "rose" }, price: 10, stock: 1 },
      ],
    };
    const codes = validateProduct(bad).map((i) => `${i.code}@${i.at}`);
    expect(codes).toEqual([
      `${PRODUCT_ISSUE.duplicateCombo}@b`,
      `${PRODUCT_ISSUE.price}@b`,
      `${PRODUCT_ISSUE.compareAt}@b`,
      `${PRODUCT_ISSUE.stock}@b`,
      `${PRODUCT_ISSUE.unknownValue}@c`,
      `${PRODUCT_ISSUE.missingAxis}@c`,
      `${PRODUCT_ISSUE.alt}@0`,
    ]);
    expect(validateProduct({ ...base, variants: [] })[0].code).toBe(PRODUCT_ISSUE.noVariant);
  });
});
