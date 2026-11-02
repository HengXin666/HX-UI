/**
 * 商业语义原子桶文件: 价格, 促销徽标, 商品色板, 尺码选择, 评分摘要 (邮箱订阅, 脚注, 横滑轨道待 engage/ 落盘).
 * 根入口 src/index.ts 的导出由集成任务统一接入, 本目录不改根入口.
 */

/**
 * 展示类原子.
 * .agents/notes/implemented/feature/2026-11-02-commerce-atoms.md
 */
export { Price } from "./Price";
export type { PriceProps, PriceSlot, PriceState } from "./Price";
export { PromoBadge } from "./PromoBadge";
export type { PromoBadgeProps, PromoBadgeSlot, PromoBadgeState } from "./PromoBadge";
export { ProductSwatch } from "./ProductSwatch";
export type { ProductSwatchOption, ProductSwatchProps, ProductSwatchSlot, ProductSwatchState } from "./ProductSwatch";
export { SizeSelector } from "./SizeSelector";
export type { SizeOption, SizeSelectorProps, SizeSelectorSlot, SizeSelectorState } from "./SizeSelector";
export { RatingSummary } from "./RatingSummary";
export type { RatingSummaryProps, RatingSummarySlot, RatingSummaryState } from "./RatingSummary";

/**
 * 互动与内容类原子 (NewsletterForm, Footnote, Rail) 暂不导出: 源文件位于 ./engage/,
 * 该目录尚未在本机建立, 文件未落盘. 建好 src/commerce/engage/ 并写入后恢复以下导出:
 * export { NewsletterForm } from "./engage/NewsletterForm";
 * export type { NewsletterFormProps, NewsletterFormSlot, NewsletterFormState } from "./engage/NewsletterForm";
 * export { FootnoteList, FootnoteProvider, FootnoteRef } from "./engage/Footnote";
 * export type {
 * 	FootnoteListProps,
 * 	FootnoteListSlot,
 * 	FootnoteNote,
 * 	FootnoteProviderProps,
 * 	FootnoteRefProps,
 * 	FootnoteRefSlot,
 * } from "./engage/Footnote";
 * export { Rail } from "./engage/Rail";
 * export type { RailProps, RailSlot } from "./engage/Rail";
 * export type { RailScroll } from "./engage/use-rail";
 */

/** 共享工具: 折扣率计算, 格式化 hook, 插槽类型. */
export { discountRate, useCommerceFormat } from "./shared/money";
export type { CommerceFormat } from "./shared/money";
export type { SlotClassNames, SlotProps, SlotStyles } from "./shared/slots";
export type { RovingApi, RovingItem } from "./shared/use-roving";
export {
	COMMERCE_SIZE,
	COMMERCE_TONE,
	COMMERCE_VARIANT,
	NEWSLETTER_STATUS,
	PRICE_PERIOD,
	PROMO_KIND,
	PROMO_PLACEMENT,
	RAIL_ITEM_SIZE,
} from "../constants/commerce";
export type {
	CommerceSize,
	CommerceTone,
	CommerceVariant,
	NewsletterStatus,
	PricePeriod,
	PromoKind,
	PromoPlacement,
	RailItemSize,
} from "../constants/commerce";
