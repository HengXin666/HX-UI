/**
 * 内容模型 (src/commerce/model.ts) 的常量: 选项轴类型, 可售状态, 校验问题代号, 评价星级.
 */

/**
 * 选项轴的呈现方式, 与 ProductDetail 的 DETAIL_OPTION_TYPE 取值一致.
 * .agents/notes/implemented/architecture/2026-11-20-omni-content-model.md
 */
export const OPTION_KIND = { swatch: "swatch", size: "size", select: "select" } as const;

/** 某个选项值在当前已选条件下的状态. */
export const VALUE_STATE = {
  /** 有货. */
  available: "available",
  /** 存在这个组合, 但库存为 0. */
  soldOut: "sold-out",
  /** 与已选的其他轴组合不出任何 SKU. */
  missing: "missing",
} as const;

/** 低库存阈值: 不超过它显示 "仅剩 N". 与 TRADE_NUMBERS.lowStock 同值. */
export const MODEL_LOW_STOCK = 5;

/** 评价分档: 5 星到 1 星. */
export const REVIEW_STARS = [5, 4, 3, 2, 1] as const;

/** 评分保留的小数位. */
export const REVIEW_DIGITS = 1;

/** validateProduct 的问题代号. */
export const PRODUCT_ISSUE = {
  noVariant: "PRODUCT-NO-VARIANT",
  unknownValue: "PRODUCT-UNKNOWN-VALUE",
  missingAxis: "PRODUCT-MISSING-AXIS",
  duplicateCombo: "PRODUCT-DUPLICATE-COMBO",
  price: "PRODUCT-PRICE",
  compareAt: "PRODUCT-COMPARE-AT",
  alt: "PRODUCT-ALT",
  stock: "PRODUCT-STOCK",
} as const;

/** 组合键里分隔轴值的字符. 选项值里不允许出现. */
export const COMBO_SEP = "\u0001";
