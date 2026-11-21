/**
 * 电商内容模型: 商品, 选项轴, SKU, 评价. 纯类型, 可 JSON 序列化, 所有电商区块与模板吃同一份.
 */
import type { OPTION_KIND, VALUE_STATE } from "../constants/model-commerce";

export type OptionKind = (typeof OPTION_KIND)[keyof typeof OPTION_KIND];
export type ValueState = (typeof VALUE_STATE)[keyof typeof VALUE_STATE];

export interface ModelMedia {
  readonly src: string;
  /** 必填; 纯装饰图写空串. */
  readonly alt: string;
  readonly srcSet?: string;
  readonly kind?: "image" | "video";
}

export interface OptionValueModel {
  readonly value: string;
  readonly label: string;
  /** swatch: 商品数据给的 CSS 颜色. */
  readonly color?: string;
  /** 选中后画廊从 media 的这几张开始 (颜色对应的实拍). */
  readonly media?: readonly number[];
}

export interface OptionAxis {
  /** 轴名 (颜色, 尺码), 也是 selection 的键. */
  readonly name: string;
  readonly kind: OptionKind;
  readonly values: readonly OptionValueModel[];
}

export interface VariantModel {
  readonly id: string;
  readonly sku?: string;
  /** 每个轴取一个值: { 颜色: "sand", 尺码: "42" }. */
  readonly options: Readonly<Record<string, string>>;
  readonly price: number;
  /** 划线原价, 必须高于 price. */
  readonly compareAt?: number;
  readonly stock: number;
}

export interface RatingModel {
  readonly value: number;
  readonly count: number;
}

export interface ProductModel {
  readonly id: string;
  readonly handle: string;
  readonly title: string;
  readonly brand?: string;
  readonly subtitle?: string;
  readonly description?: string;
  /** ISO 4217. */
  readonly currency: string;
  readonly media: readonly ModelMedia[];
  readonly options: readonly OptionAxis[];
  readonly variants: readonly VariantModel[];
  readonly rating?: RatingModel;
  readonly details?: ReadonlyArray<{ readonly title: string; readonly body: string }>;
}

export interface ReviewModel {
  readonly id: string;
  /** 1 到 5 的整数. */
  readonly stars: number;
  readonly author: string;
  readonly body: string;
  /** ISO 日期. */
  readonly date: string;
  /** 买的哪个 SKU 的选项, 用来显示 "颜色: 沙色 / 尺码: 42". */
  readonly options?: Readonly<Record<string, string>>;
}

export type Selection = Readonly<Record<string, string>>;
