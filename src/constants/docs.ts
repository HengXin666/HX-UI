/**
 * 文档站专用的取值: 示例里反复出现的标签页值, 演示数据与类名. 库本身不引用这里.
 */

/** 预览框的两个标签页. */
export const DOC_TAB = {
	preview: "preview",
	code: "code",
} as const;

/** 文档站示例与排版里复用的取值. */
export const DOC = {
	/** 属性表里 "无默认值" 的写法. */
	none: "-",
	/** 名字列表的分隔. */
	listSep: ", ",
	/** 多行清单的行分隔. */
	newline: "\n",
	/** 示例容器的常用排版. */
	stack: "flex w-full flex-col gap-3",
	stackMd: "flex w-full max-w-md flex-col gap-3",
	widthMd: "w-full max-w-md",
	wrap: "flex flex-wrap gap-2",
	tight: "flex flex-col gap-1",
	dangerText: "text-danger-fg",
	/** 外链在新标签页打开. */
	newTab: "_blank",
	/** 示例里的通用文案. */
	settings: "设置",
	copy: "复制",
} as const;

/** 文档站示例里的演示数据 (页码, 进度, 长度限制等). */
export const DOC_SAMPLE = {
	turns: 6,
	streamStep: 2,
	streamInterval: 40,
	progress: 42,
	progressStep: 19,
	full: 100,
	collapsedHeight: 64,
	slider: 30,
	page: 4,
	pageCount: 20,
	nameMin: 2,
	nameMax: 16,
	bioMax: 80,
	otpLength: 6,
	otpHalf: 3,
	wideRatio: 16 / 9,
	invoiceLabelSpan: 3,
} as const;
