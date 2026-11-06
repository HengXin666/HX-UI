"use client";

import * as React from "react";
import {
	COMMERCE_CLASSES as K,
	COMMERCE_SIZE,
	COMMERCE_SLOT,
	COMMERCE_TEXT,
	PRICE_CLASSES as C,
	PRICE_PERIOD,
	type CommerceSize,
	type PricePeriod,
	type PRICE_SLOTS,
} from "../constants/commerce";
import type { CommerceMessages } from "../locale/core";
import { discountRate, useCommerceFormat } from "./shared/money";
import { dataFlag, resolveSlots, slotName, type SlotClassNames, type SlotStyles } from "./shared/slots";

export type PriceSlot = (typeof PRICE_SLOTS)[number];

/** Price 的公开状态, 同时写在 data 属性上. */
export interface PriceState {
	discounted: boolean;
	rate: number | null;
}

export interface PriceProps
	extends Omit<React.ComponentProps<"span">, "children"> {
	/** 按 slot 覆盖内部部件类名 (契约 4.1), 可传对象或按 PriceState 计算的函数. */
	classNames?: SlotClassNames<PriceSlot, PriceState>;
	/** 按 slot 覆盖内部部件内联样式 (契约 4.1). */
	styles?: SlotStyles<PriceSlot, PriceState>;
	/** 现价 (实付金额), 主货币单位. */
	amount: number;
	/** 原价. 高于现价时以删除线显示并可自动算折扣率. */
	originalAmount?: number;
	/** ISO 4217 币种代码. 不传时取 LocaleProvider 的 commerce.currency. */
	currency?: string;
	/** BCP 47 地区. 不传时取 LocaleProvider. */
	locale?: string;
	/** 计价周期, 显示为 "/月" 之类的后缀. */
	period?: PricePeriod;
	/** true 显示 "含税", false 显示 "不含税", 不传不显示. */
	taxIncluded?: boolean;
	/** 折扣率 (0 到 1). 不传时由原价与现价自动算. */
	discount?: number;
	/** 是否显示折扣率徽记. 默认 true (有折扣时). */
	showDiscount?: boolean;
	/** 透传给 Intl.NumberFormat 的选项 (小数位, 记数法等); style 与 currency 由组件决定. */
	formatOptions?: Intl.NumberFormatOptions;
	/** 现价字号档. 默认 md. */
	size?: CommerceSize;
	labels?: Partial<CommerceMessages>;
}

const PERIOD_KEY: Readonly<Record<PricePeriod, keyof CommerceMessages>> = {
	[PRICE_PERIOD.day]: "perDay",
	[PRICE_PERIOD.week]: "perWeek",
	[PRICE_PERIOD.month]: "perMonth",
	[PRICE_PERIOD.year]: "perYear",
};

/**
 * 价格展示. 金额全部走 Intl.NumberFormat (货币符号, 千分位, 小数位随地区),
 * 原价用 <s> 并带读屏前缀 "原价 / 现价", 折扣率显示为 "-30%". 纯展示, 不含计价逻辑.
 * ref 指向根 <span>.
 * .agents/notes/implemented/feature/2026-11-02-commerce-atoms.md
 */
export function Price({
	amount,
	originalAmount,
	currency,
	locale,
	period,
	taxIncluded,
	discount,
	showDiscount = true,
	formatOptions,
	size = COMMERCE_SIZE.md,
	labels,
	classNames,
	styles,
	className,
	style,
	...props
}: PriceProps): React.JSX.Element {
	const f = useCommerceFormat(labels, locale, currency);
	const rate = discount ?? discountRate(originalAmount, amount);
	const struck = originalAmount !== undefined && originalAmount > amount;
	const state: PriceState = { discounted: struck || (rate ?? 0) > 0, rate };
	const s = resolveSlots<PriceSlot, PriceState>({ classNames, styles, className, style }, state);
	const name = (slot: PriceSlot): string => slotName(COMMERCE_SLOT.price, slot);
	const srLabel = (text: string): React.JSX.Element => (
		<span data-slot={name("sr-label")} className={s.className("sr-label", K.srOnly)}>
			{text}
		</span>
	);

	return (
		<span
			{...props}
			data-slot={name("root")}
			data-size={size}
			data-discounted={dataFlag(state.discounted)}
			className={s.className("root", C.root)}
			style={s.style("root")}
		>
			<span data-slot={name("current")} className={s.className("current", C.current, COMMERCE_TEXT[size], K.nums)} style={s.style("current")}>
				{struck && srLabel(f.text.currentPrice)}
				{f.money(amount, formatOptions)}
			</span>
			{period && (
				<span data-slot={name("period")} className={s.className("period", C.period)} style={s.style("period")}>
					{f.text[PERIOD_KEY[period]] as string}
				</span>
			)}
			{struck && (
				<s data-slot={name("original")} className={s.className("original", C.original, K.nums)} style={s.style("original")}>
					{srLabel(f.text.originalPrice)}
					{f.money(originalAmount, formatOptions)}
				</s>
			)}
			{showDiscount && rate !== null && rate > 0 && (
				<span data-slot={name("discount")} className={s.className("discount", C.discount, K.nums)} style={s.style("discount")}>
					<span aria-hidden="true">{f.off(rate)}</span>
					{srLabel(f.text.discount(f.percent(rate)))}
				</span>
			)}
			{taxIncluded !== undefined && (
				<span data-slot={name("tax")} className={s.className("tax", C.tax)} style={s.style("tax")}>
					{taxIncluded ? f.text.taxIncluded : f.text.taxExcluded}
				</span>
			)}
		</span>
	);
}
