/**
 * 国际化层 (src/locale/) 共用的字面量: 语言标识, 文字方向, Intl 选项取值与相对时间的单位表.
 * 同一字面量在库与文档站出现 3 次及以上时收在这里, 由 PROJECT-CONST-DUP 约束.
 */

/** 内置语言包的标识. 库的历史默认文案是中文, 所以 zh-CN 也是无 Provider 时的内置默认. */
export const LOCALE_ZH_CN = "zh-CN";
export const LOCALE_EN_US = "en-US";

/** BCP 47 标识里语言与地区的分隔符. */
export const LANGUAGE_SEPARATOR = "-";

/** 文字方向取值, 与 DirectionProvider 的 dir 一致. */
export const DIR = { ltr: "ltr", rtl: "rtl" } as const;

/** 从右往左书写的语言 (取语言子标签比较). */
export const RTL_LANGUAGES: readonly string[] = ["ar", "he", "fa", "ur", "ps", "yi", "dv", "ug", "ckb", "sd"];

/** 一周的起始日, 0 为周日 (与 Date.getDay 及 react-day-picker 的 weekStartsOn 同口径). */
export const WEEK_START = { sunday: 0, monday: 1 } as const;

/** Intl 选项里用到的取值. */
export const INTL = {
	long: "long",
	short: "short",
	medium: "medium",
	numeric: "numeric",
	auto: "auto",
	currency: "currency",
	utc: "UTC",
} as const;

/** formatRelative 的单位与每单位秒数, 从大到小匹配第一个不小于它的单位. */
export const RELATIVE_UNITS: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> = [
	["year", 31536000],
	["month", 2592000],
	["week", 604800],
	["day", 86400],
	["hour", 3600],
	["minute", 60],
	["second", 1],
];

export const MS_PER_SECOND = 1000;

/** 生成月份名与星期名用的参照日历: 2024-01-07 是周日. */
export const CALENDAR_REFERENCE = { year: 2024, firstSunday: 7, months: 12, weekdays: 7 } as const;

/** zh-CN 语言包里已在库与文档站其他位置出现过的中文文案, 收在这里避免重复字面量. */
export const ZH_TEXT = {
	today: "今天",
	loading: "加载中",
	previousPage: "上一页",
	previousMonth: "上个月",
	nextMonth: "下个月",
	selected: "已选中",
	uploading: "上传中",
	remove: "移除",
	retry: "重试",
	noData: "暂无数据",
	cancel: "取消",
	thisMonth: "本月",
	clearAll: "清空",
} as const;
