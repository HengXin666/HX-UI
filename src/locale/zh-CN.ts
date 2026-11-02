/**
 * 简体中文语言包. 与现有组件内置的中文默认文案保持一致 (分页, 组合框, 表格空态, 确认框),
 * 所以挂上 zh-CN 的 Provider 不会改变任何组件的显示.
 */
import { DIR, INTL, LOCALE_ZH_CN, WEEK_START, ZH_TEXT } from "../constants/locale";
import type { LocalePack } from "./core";
import { monthNames, weekdayNames } from "./format";

const today = ZH_TEXT.today;
const loading = ZH_TEXT.loading;
const pageSize = "每页条数";

export const zhCN: LocalePack = {
	locale: LOCALE_ZH_CN,
	dir: DIR.ltr,
	weekStartsOn: WEEK_START.monday,
	messages: {
		date: {
			months: monthNames(LOCALE_ZH_CN, INTL.long),
			monthsShort: monthNames(LOCALE_ZH_CN, INTL.short),
			weekdays: weekdayNames(LOCALE_ZH_CN, INTL.long),
			weekdaysShort: weekdayNames(LOCALE_ZH_CN, INTL.short),
			today,
			clear: "清除",
			previousMonth: ZH_TEXT.previousMonth,
			nextMonth: ZH_TEXT.nextMonth,
			placeholder: "选择日期",
			selected: ZH_TEXT.selected,
			month: "月份",
			year: "年份",
		},
		pagination: {
			nav: "分页",
			previous: ZH_TEXT.previousPage,
			next: "下一页",
			page: (page) => `第 ${page} 页`,
			pageSize,
			total: (count) => `共 ${count} 条`,
			jumpTo: "跳到",
		},
		combobox: {
			placeholder: "请选择",
			searchPlaceholder: "搜索...",
			empty: "没有匹配项",
			loading,
			selected: (count) => `已选 ${count} 项`,
		},
		dialog: { close: "关闭" },
		upload: {
			dropHere: "拖到这里",
			chooseFile: "选择文件",
			uploading: ZH_TEXT.uploading,
			failed: "上传失败",
			retry: ZH_TEXT.retry,
			remove: ZH_TEXT.remove,
		},
		table: {
			empty: ZH_TEXT.noData,
			noResults: "无匹配结果",
			filter: "筛选",
			sortAscending: "升序排列",
			sortDescending: "降序排列",
			pageSize,
		},
		confirm: { confirm: "确认", cancel: ZH_TEXT.cancel },
		datePresets: {
			today,
			yesterday: "昨天",
			thisWeek: "本周",
			thisMonth: ZH_TEXT.thisMonth,
			last7Days: "近 7 天",
			last30Days: "近 30 天",
		},
		common: { loading, more: "更多", clear: ZH_TEXT.clearAll },
	},
};
