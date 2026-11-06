/**
 * 格式化工具: 数字, 货币, 日期, 日期时间, 相对时间与月份 / 星期名.
 * 全部交给 Intl, 不手工拼接; locale 省略时使用运行环境的默认语言.
 */
import { CALENDAR_REFERENCE, INTL, MS_PER_SECOND, RELATIVE_UNITS } from "../constants/locale";

export type DateInput = Date | number | string;

function toDate(value: DateInput): Date {
	return value instanceof Date ? value : new Date(value);
}

export function formatNumber(value: number, locale?: string, options?: Intl.NumberFormatOptions): string {
	return new Intl.NumberFormat(locale, options).format(value);
}

export function formatCurrency(
	value: number,
	currency: string,
	locale?: string,
	options?: Intl.NumberFormatOptions,
): string {
	return new Intl.NumberFormat(locale, { ...options, style: INTL.currency, currency }).format(value);
}

export function formatDate(value: DateInput, locale?: string, options?: Intl.DateTimeFormatOptions): string {
	return new Intl.DateTimeFormat(locale, options ?? { dateStyle: INTL.medium }).format(toDate(value));
}

export function formatDateTime(value: DateInput, locale?: string, options?: Intl.DateTimeFormatOptions): string {
	return new Intl.DateTimeFormat(locale, options ?? { dateStyle: INTL.medium, timeStyle: INTL.short }).format(
		toDate(value),
	);
}

/**
 * 相对时间 (3 天前, in 2 hours). 选不小于差值的最大单位, 措辞由 Intl.RelativeTimeFormat 决定.
 * now 可注入, 方便测试与服务端渲染对齐.
 */
export function formatRelative(
	value: DateInput,
	locale?: string,
	now: DateInput = Date.now(),
	options?: Intl.RelativeTimeFormatOptions,
): string {
	const seconds = (toDate(value).getTime() - toDate(now).getTime()) / MS_PER_SECOND;
	const [unit, size] = RELATIVE_UNITS.find(([, span]) => Math.abs(seconds) >= span) ?? RELATIVE_UNITS[RELATIVE_UNITS.length - 1];
	const format = new Intl.RelativeTimeFormat(locale, options ?? { numeric: INTL.auto });
	return format.format(Math.round(seconds / size), unit);
}

/** 12 个月名, 从一月开始. 固定 UTC 取值, 不受运行时区影响. */
export function monthNames(locale: string, width: Intl.DateTimeFormatOptions["month"] = INTL.long): string[] {
	const format = new Intl.DateTimeFormat(locale, { month: width, timeZone: INTL.utc });
	return Array.from({ length: CALENDAR_REFERENCE.months }, (_, index) =>
		format.format(Date.UTC(CALENDAR_REFERENCE.year, index, 1)),
	);
}

/** 7 个星期名, 从周日开始. */
export function weekdayNames(locale: string, width: Intl.DateTimeFormatOptions["weekday"] = INTL.long): string[] {
	const format = new Intl.DateTimeFormat(locale, { weekday: width, timeZone: INTL.utc });
	return Array.from({ length: CALENDAR_REFERENCE.weekdays }, (_, index) =>
		format.format(Date.UTC(CALENDAR_REFERENCE.year, 0, CALENDAR_REFERENCE.firstSunday + index)),
	);
}
