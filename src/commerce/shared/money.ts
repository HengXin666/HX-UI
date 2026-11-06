/**
 * 商业原子的金额与数字格式化. 全部经 src/locale/format.ts 的 Intl 工具, 不手拼货币符号, 千分位与百分号.
 * 文案回退顺序: labels prop > LocaleProvider > 内置 zh-CN.
 * .agents/notes/implemented/feature/2026-11-02-commerce-atoms.md
 */
import { COMMERCE_INTL, COMMERCE_NUMBERS } from "../../constants/commerce";
import type { CommerceMessages } from "../../locale/core";
import { formatCurrency, formatNumber } from "../../locale/format";
import { useLocale, useLocaleText } from "../../locale/LocaleProvider";

/** useCommerceFormat 的返回: 当前文案 + 一组绑定了 locale / currency 的格式化函数. */
export interface CommerceFormat {
	locale: string;
	currency: string;
	text: CommerceMessages;
	/** 金额 (¥1,299.00 / $1,299.00). style 与 currency 由组件决定, 其余选项透传. */
	money: (amount: number, options?: Intl.NumberFormatOptions) => string;
	/** 百分比 (0.3 → 30%). */
	percent: (rate: number) => string;
	/** 折扣徽记 (0.3 → -30%). */
	off: (rate: number) => string;
	/** 整数计数; compact 为 true 时缩写 (1.2万 / 1.2K). */
	count: (value: number, compact?: boolean) => string;
	/** 固定小数位 (4.6). */
	decimal: (value: number, digits: number) => string;
	/** 带正号的计数 (+3). */
	plus: (value: number) => string;
}

/**
 * 由原价与现价算折扣率 (0 到 1), 保留 COMMERCE_NUMBERS.discountDigits 位小数.
 * 原价缺失, 非正或不高于现价时返回 null.
 */
export function discountRate(original: number | undefined, current: number): number | null {
	if (original === undefined || !Number.isFinite(original) || !Number.isFinite(current)) return null;
	if (original <= 0 || original <= current) return null;
	const scale = 10 ** COMMERCE_NUMBERS.discountDigits;
	return Math.round((1 - current / original) * scale) / scale;
}

/** 读 LocaleProvider 并绑定 locale / currency; prop 优先于 Provider. */
export function useCommerceFormat(
	labels?: Partial<CommerceMessages>,
	locale?: string,
	currency?: string,
): CommerceFormat {
	const context = useLocale();
	const text = useLocaleText("commerce", labels);
	const lang = locale ?? context.locale;
	const code = currency ?? text.currency;
	return {
		locale: lang,
		currency: code,
		text,
		money: (amount, options) => formatCurrency(amount, code, lang, options),
		percent: (rate) => formatNumber(rate, lang, { style: COMMERCE_INTL.percent }),
		off: (rate) => formatNumber(-Math.abs(rate), lang, { style: COMMERCE_INTL.percent, signDisplay: COMMERCE_INTL.exceptZero }),
		count: (value, compact = false) =>
			formatNumber(value, lang, compact ? { notation: COMMERCE_INTL.compact, compactDisplay: COMMERCE_INTL.short } : undefined),
		decimal: (value, digits) => formatNumber(value, lang, { minimumFractionDigits: digits, maximumFractionDigits: digits }),
		plus: (value) => formatNumber(value, lang, { signDisplay: COMMERCE_INTL.always }),
	};
}
