/**
 * 国际化层的桶文件. 根入口 src/index.ts 的导出由 P0-Z 统一接入.
 */
export { LocaleProvider, useLocale, useLocaleText } from "./LocaleProvider";
export type { LocaleProviderProps, LocaleState } from "./LocaleProvider";
export { directionOf, mergeMessages, resolveText } from "./core";
export type {
	ComboboxMessages,
	CommonMessages,
	ConfirmMessages,
	DateMessages,
	DatePresetMessages,
	DialogMessages,
	LocaleDomain,
	LocaleMessages,
	LocalePack,
	PaginationMessages,
	PartialMessages,
	TableMessages,
	TextDirection,
	UploadMessages,
	WeekStart,
} from "./core";
export { formatCurrency, formatDate, formatDateTime, formatNumber, formatRelative, monthNames, weekdayNames } from "./format";
export type { DateInput } from "./format";
export { zhCN } from "./zh-CN";
export { enUS } from "./en-US";
