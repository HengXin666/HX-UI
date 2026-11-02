/**
 * 美式英语语言包, 键与 zh-CN 一一对应. 周起始日为周日.
 */
import { DIR, INTL, LOCALE_EN_US, WEEK_START } from "../constants/locale";
import type { LocalePack } from "./core";
import { monthNames, weekdayNames } from "./format";

const today = "Today";
const loading = "Loading...";
const pageSize = "Rows per page";
const clear = "Clear";

export const enUS: LocalePack = {
	locale: LOCALE_EN_US,
	dir: DIR.ltr,
	weekStartsOn: WEEK_START.sunday,
	messages: {
		date: {
			months: monthNames(LOCALE_EN_US, INTL.long),
			monthsShort: monthNames(LOCALE_EN_US, INTL.short),
			weekdays: weekdayNames(LOCALE_EN_US, INTL.long),
			weekdaysShort: weekdayNames(LOCALE_EN_US, INTL.short),
			today,
			clear,
			previousMonth: "Previous month",
			nextMonth: "Next month",
			placeholder: "Pick a date",
			selected: "Selected",
			month: "Month",
			year: "Year",
		},
		pagination: {
			nav: "Pagination",
			previous: "Previous page",
			next: "Next page",
			page: (page) => `Page ${page}`,
			pageSize,
			total: (count) => `${count} items in total`,
			jumpTo: "Go to",
		},
		combobox: {
			placeholder: "Select...",
			searchPlaceholder: "Search...",
			empty: "No matches",
			loading,
			selected: (count) => `${count} selected`,
		},
		dialog: { close: "Close" },
		upload: {
			dropHere: "Drop files here",
			chooseFile: "Choose file",
			uploading: "Uploading...",
			failed: "Upload failed",
			retry: "Retry",
			remove: "Remove",
		},
		table: {
			empty: "No data",
			noResults: "No results",
			filter: "Filter",
			sortAscending: "Sort ascending",
			sortDescending: "Sort descending",
			pageSize,
		},
		confirm: { confirm: "Confirm", cancel: "Cancel" },
		datePresets: {
			today,
			yesterday: "Yesterday",
			thisWeek: "This week",
			thisMonth: "This month",
			last7Days: "Last 7 days",
			last30Days: "Last 30 days",
		},
		common: { loading, more: "More", clear },
	},
};
