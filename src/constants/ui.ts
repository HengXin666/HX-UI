/**
 * 对标 shadcn/ui 的组件与文档站共用的取值: 方向, 对齐, 角色, 标签名, 状态名与常用类名.
 * 每个取值都 as const, 保留字面量类型供 cva 与组件 props 推断.
 */

/**
 * 排列方向 (radix 的 orientation, 分栏, 轮播, 按钮组共用).
 *
 * .agents/notes/implemented/feature/2026-10-18-shadcn-parity-components.md
 */
export const ORIENTATION = {
	horizontal: "horizontal",
	vertical: "vertical",
} as const;

/** 弹层 / 侧滑面板 / 侧栏的方位. */
export const SIDE = {
	top: "top",
	right: "right",
	bottom: "bottom",
	left: "left",
} as const;

/** 对齐: 弹层对齐, 消息与气泡的朝向. */
export const ALIGN = {
	start: "start",
	center: "center",
	end: "end",
	/** 输入组前后缀位置. */
	inlineEnd: "inline-end",
	/** 文档预览框撑满宽度. */
	stretch: "stretch",
} as const;

/** 单选 / 多选 (ToggleGroup, Accordion 等 radix 组件的 type). */
export const SELECT_MODE = {
	single: "single",
	multiple: "multiple",
} as const;

/** 组件尺寸与变体的补充取值 (基础取值见 VARIANT). */
export const SIZE = {
	xs: "xs",
	iconXs: "icon-xs",
	lg: "lg",
	md: "md",
} as const;

/** 视觉变体的补充取值. */
export const TONE_VARIANT = {
	outline: "outline",
	secondary: "secondary",
	destructive: "destructive",
	muted: "muted",
	image: "image",
	border: "border",
	separator: "separator",
	floating: "floating",
	inset: "inset",
	sidebar: "sidebar",
	legend: "legend",
	label: "label",
	responsive: "responsive",
	success: "success",
	info: "info",
} as const;

/** ARIA role 取值. */
export const ROLE = {
	group: "group",
	list: "list",
	separator: "separator",
	presentation: "presentation",
	link: "link",
	region: "region",
	slide: "slide",
	note: "note",
	combobox: "combobox",
	radio: "radio",
	radiogroup: "radiogroup",
	checkbox: "checkbox",
} as const;

/** asChild 不开启时渲染的原生标签. */
export const TAG = {
	div: "div",
	span: "span",
	a: "a",
	button: "button",
} as const;

/** 开合状态. */
export const OPEN_STATE = {
	expanded: "expanded",
	collapsed: "collapsed",
	offcanvas: "offcanvas",
	icon: "icon",
	none: "none",
} as const;

/** 进行中任务的状态 (Trace 步骤, 附件上传). */
export const TASK_STATUS = {
	idle: "idle",
	pending: "pending",
	running: "running",
	uploading: "uploading",
	done: "done",
	error: "error",
} as const;

/** 问卷题型. */
export const QUESTION_TYPE = {
	single: "single",
	multiple: "multiple",
	freeform: "freeform",
} as const;

/** DOM 事件名. */
export const EVENT = {
	change: "change",
	keydown: "keydown",
	select: "select",
	reInit: "reInit",
} as const;

/** 方向键的 key 值. */
export const ARROW_KEY = {
	left: "ArrowLeft",
	right: "ArrowRight",
} as const;

/** 系统 "减弱动效" 的媒体查询. */
export const MEDIA_REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** 百分比上限. */
export const PERCENT = 100;

/** 后退一步 / 不可聚焦的 tabIndex. */
export const STEP_BACK = -1;

/** 复用三次以上的类名组合 (shadcn 对标组件与文档站). */
export const UI_CLASSES = {
	srOnly: "sr-only",
	relative: "relative",
	transparent: "bg-transparent",
	muted: "text-muted-foreground",
	mutedSm: "text-[12px] text-muted-foreground",
	mutedHalf: "text-[12.5px] text-muted-foreground",
	strong: "font-medium text-foreground",
	row: "flex items-center gap-2",
	col: "flex flex-col",
	truncate: "min-w-0 flex-1 truncate",
	svgSlot: "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	iconHidden: "group-data-[collapsible=icon]:hidden",
	grid: "grid gap-2",
	description: "text-sm text-muted-foreground",
	link: "text-link",
} as const;

/** 类名数组拼接用的分隔符. */
export const SPACE = " ";

/** 菜单与命令面板里的分隔线. */
export const MENU_SEPARATOR_CLASS = "-mx-1 my-1 h-px bg-border";

/** 弹层与触发器之间的默认间距 (px), 菜单栏多一档 STEP. */
export const POPUP_OFFSET = 6;
export const POPUP_OFFSET_STEP = 2;

/** 与通用词同名的 data-slot / data-sidebar 取值. */
export const SLOT = {
	empty: "empty",
	label: "label",
	input: "input",
	separator: "separator",
	sidebar: "sidebar",
	trigger: "trigger",
} as const;

/** 切换应用侧栏的快捷键 (配合 Cmd / Ctrl). */
export const SIDEBAR_SHORTCUT = "b";

/** 组件内的尺寸与时长 (px / ms). */
export const UI_NUMBERS = {
	/** 可折叠气泡收起时的默认高度. */
	bubbleCollapsedHeight: 120,
	/** 问卷切题时的位移距离. */
	slideOffset: 24,
	/** 悬停卡片: 停留多久才弹出, 离开多久才收起. */
	hoverOpenDelay: 400,
	hoverCloseDelay: 150,
	/** 侧栏骨架条宽度在 min 到 min + spread 百分比之间随机. */
	skeletonMin: 50,
	skeletonSpread: 40,
	/** 代码高亮的规模上限: 超过就不跑 shiki, 直接退回纯文本. */
	codeMaxLength: 30000,
	codeMaxLineLength: 2000,
	codeMaxLines: 1000,
} as const;

/** 问卷切题动画的三个 motion variant 名. */
export const SLIDE_STATE = { enter: "enter", center: "center", exit: "exit" } as const;

/** 由字符串派生稳定伪随机数时的乘数 (取质数, 字符分布更均匀). */
export const HASH_MULTIPLIER = 31;

/** embla 轮播的滚动轴. */
export const EMBLA_AXIS = { x: "x", y: "y" } as const;

/** 平滑滚动与直接跳转. */
export const SCROLL_BEHAVIOR = { smooth: "smooth", instant: "auto" } as const;

/** 表单校验失败的 aria 属性名. */
export const ARIA_INVALID = "aria-invalid";
