/**
 * 商品数据校验: 在渲染前把会让页面出错或误导的数据挑出来 (SKU 指向不存在的选项值, 组合重复, 划线价不高于现价, 图片缺 alt).
 */
import { COMBO_SEP, PRODUCT_ISSUE } from "../constants/model-commerce";
import type { ProductModel } from "./catalog";

export type ProductIssueCode = (typeof PRODUCT_ISSUE)[keyof typeof PRODUCT_ISSUE];

export interface ProductIssue {
  readonly code: ProductIssueCode;
  /** 出问题的 SKU id 或图片序号; 整个商品级问题为 undefined. */
  readonly at?: string;
  readonly message: string;
}

/** 返回全部问题; 空数组表示可以渲染. */
export function validateProduct(product: ProductModel): ProductIssue[] {
  const issues: ProductIssue[] = [];
  const push = (code: ProductIssueCode, message: string, at?: string): void => {
    issues.push({ code, message, at });
  };
  if (product.variants.length === 0) push(PRODUCT_ISSUE.noVariant, "没有任何 SKU");
  const seen = new Map<string, string>();
  for (const v of product.variants) {
    for (const axis of product.options) {
      const value = v.options[axis.name];
      if (value === undefined) push(PRODUCT_ISSUE.missingAxis, `缺少 ${axis.name}`, v.id);
      else if (!axis.values.some((x) => x.value === value)) push(PRODUCT_ISSUE.unknownValue, `${axis.name} 没有值 ${value}`, v.id);
    }
    const key = product.options.map((axis) => v.options[axis.name] ?? "").join(COMBO_SEP);
    const first = seen.get(key);
    if (first !== undefined) push(PRODUCT_ISSUE.duplicateCombo, `与 ${first} 组合相同`, v.id);
    else seen.set(key, v.id);
    if (!Number.isFinite(v.price) || v.price <= 0) push(PRODUCT_ISSUE.price, `价格无效: ${v.price}`, v.id);
    if (v.compareAt !== undefined && v.compareAt <= v.price) push(PRODUCT_ISSUE.compareAt, `划线价 ${v.compareAt} 不高于现价 ${v.price}`, v.id);
    if (!Number.isInteger(v.stock) || v.stock < 0) push(PRODUCT_ISSUE.stock, `库存无效: ${v.stock}`, v.id);
  }
  product.media.forEach((m, i) => {
    if (m.alt === undefined || (m.alt !== "" && m.alt.trim() === "")) push(PRODUCT_ISSUE.alt, `第 ${i + 1} 张图缺 alt`, String(i));
  });
  return issues;
}
