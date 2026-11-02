/**
 * 国际化层的类型与纯逻辑: 语言包结构, 方向推断, 文案合并与三层回退.
 * 不依赖 React, 所以测试可以直接用 Node 运行.
 */
import { DIR, LANGUAGE_SEPARATOR, RTL_LANGUAGES } from "../constants/locale";

export type TextDirection = "ltr" | "rtl";
/** 0 为周日, 与 Date.getDay 同口径. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DateMessages {
	/** 12 个月的全称与简称, 从一月开始. */
	months: string[];
	monthsShort: string[];
	/** 7 个星期名的全称与简称, 从周日开始 (按 weekStartsOn 旋转由使用方决定). */
	weekdays: string[];
	weekdaysShort: string[];
	today: string;
	clear: string;
	previousMonth: string;
	nextMonth: string;
	placeholder: string;
	selected: string;
	month: string;
	year: string;
}

export interface PaginationMessages {
	nav: string;
	previous: string;
	next: string;
	page: (page: number) => string;
	pageSize: string;
	total: (count: number) => string;
	jumpTo: string;
}

export interface ComboboxMessages {
	placeholder: string;
	searchPlaceholder: string;
	empty: string;
	loading: string;
	selected: (count: number) => string;
}

export interface DialogMessages {
	close: string;
}

export interface UploadMessages {
	dropHere: string;
	chooseFile: string;
	uploading: string;
	failed: string;
	retry: string;
	remove: string;
}

export interface TableMessages {
	empty: string;
	noResults: string;
	filter: string;
	sortAscending: string;
	sortDescending: string;
	pageSize: string;
}

export interface ConfirmMessages {
	confirm: string;
	cancel: string;
}

export interface DatePresetMessages {
	today: string;
	yesterday: string;
	thisWeek: string;
	thisMonth: string;
	last7Days: string;
	last30Days: string;
}

export interface CommonMessages {
	loading: string;
	more: string;
	clear: string;
}

/** 一套完整文案, 按组件域分组. */
export interface LocaleMessages {
	date: DateMessages;
	pagination: PaginationMessages;
	combobox: ComboboxMessages;
	dialog: DialogMessages;
	upload: UploadMessages;
	table: TableMessages;
	confirm: ConfirmMessages;
	datePresets: DatePresetMessages;
	common: CommonMessages;
}

export type LocaleDomain = keyof LocaleMessages;

/** 只覆盖部分域, 部分键的文案. */
export type PartialMessages = { [K in LocaleDomain]?: Partial<LocaleMessages[K]> };

/** 一种语言的完整描述: 标识, 方向, 周起始日与文案. */
export interface LocalePack {
	locale: string;
	dir: TextDirection;
	weekStartsOn: WeekStart;
	messages: LocaleMessages;
}

/** 按语言子标签推断书写方向, 未知语言一律 ltr. */
export function directionOf(locale: string): TextDirection {
	const language = locale.split(LANGUAGE_SEPARATOR)[0].toLowerCase();
	return RTL_LANGUAGES.includes(language) ? DIR.rtl : DIR.ltr;
}

/**
 * 逐键取第一个不是 undefined 的值.
 * 不用对象展开: 展开会让显式传入的 undefined 盖掉下层文案, 按钮因此失去无障碍名称.
 */
function layer<T extends object>(layers: Array<Partial<T> | undefined>): T {
	const keys = new Set<string>();
	for (const item of layers) {
		for (const key of Object.keys(item ?? {})) {
			keys.add(key);
		}
	}
	const out: Record<string, unknown> = {};
	for (const key of keys) {
		for (const item of layers) {
			const value = (item as Record<string, unknown> | undefined)?.[key];
			if (value !== undefined) {
				out[key] = value;
				break;
			}
		}
	}
	return out as T;
}

/** 在完整语言包上叠加部分覆盖, 得到新的完整文案. */
export function mergeMessages(base: LocaleMessages, override?: PartialMessages): LocaleMessages {
	if (!override) {
		return base;
	}
	const out = { ...base };
	for (const domain of Object.keys(base) as LocaleDomain[]) {
		(out as Record<string, unknown>)[domain] = layer<object>([override[domain], base[domain]]);
	}
	return out;
}

/**
 * 三层回退: 组件 labels prop > LocaleProvider 文案 > 内置默认.
 * provided 为 undefined 表示没有 Provider, 此时结果只由 labels 与内置默认决定,
 * 与接入国际化之前的组件行为一致.
 */
export function resolveText<K extends LocaleDomain>(
	domain: K,
	labels: Partial<LocaleMessages[K]> | undefined,
	provided: LocaleMessages | undefined,
	fallback: LocaleMessages[K],
): LocaleMessages[K] {
	return layer<LocaleMessages[K]>([labels, provided?.[domain], fallback]);
}
