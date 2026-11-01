/**
 * 富交互件 (src/widgets) 的取值, 键位, 语义色类名与纯函数判据.
 * 颜色只引用 tokens.css 桥接出来的语义类, 不出现调色盘色或函数色值.
 */

/**
 * 语义色调: 时间线圆点, 色调徽记共用. neutral 是不带情绪的默认态.
 * .agents/notes/implemented/feature/2026-11-01-rich-widgets.md
 */
export const WIDGET_TONE = {
	neutral: "neutral",
	primary: "primary",
	success: "success",
	warning: "warning",
	danger: "danger",
} as const;

export type WidgetTone = (typeof WIDGET_TONE)[keyof typeof WIDGET_TONE];

/** 每种色调的三层类名: dot 是实心点, soft 是带图标时的浅底, text 是图标与强调文字色. */
export const TONE_CLASSES: Readonly<Record<WidgetTone, { dot: string; soft: string; text: string }>> = {
	neutral: { dot: "bg-muted-foreground", soft: "bg-muted", text: "text-muted-foreground" },
	primary: { dot: "bg-primary", soft: "bg-primary/10", text: "text-primary" },
	success: { dot: "bg-success-emphasis", soft: "bg-success/15", text: "text-success-fg" },
	warning: { dot: "bg-warning-emphasis", soft: "bg-warning/15", text: "text-warning-fg" },
	danger: { dot: "bg-danger-emphasis", soft: "bg-danger/15", text: "text-danger-fg" },
};

/** 交互件用到的 key 值. 逗号同时收全角, 中文输入法下直接敲逗号也能建签. */
export const WIDGET_KEY = {
	left: "ArrowLeft",
	right: "ArrowRight",
	up: "ArrowUp",
	down: "ArrowDown",
	home: "Home",
	end: "End",
	enter: "Enter",
	backspace: "Backspace",
	delete: "Delete",
	comma: ",",
	commaWide: "\uFF0C",
} as const;

/** 方向键归一: 往前 (左, 上) 记 -1, 往后 (右, 下) 记 +1, 其余键返回 0. */
export function arrowDelta(key: string): number {
	if (key === WIDGET_KEY.left || key === WIDGET_KEY.up) return -1;
	if (key === WIDGET_KEY.right || key === WIDGET_KEY.down) return 1;
	return 0;
}

/** 图标类名 (solar 图标集, 已在 peerDependencies 声明). */
export const WIDGET_ICON = {
	starFilled: "icon-[solar--star-bold]",
	starEmpty: "icon-[solar--star-linear]",
	upload: "icon-[solar--cloud-upload-linear]",
	file: "icon-[solar--file-text-linear]",
	remove: "icon-[solar--close-circle-linear]",
	error: "icon-[solar--danger-circle-linear]",
	check: "icon-[solar--check-circle-bold]",
} as const;

/** 评分: 默认星数, 整星步长与半星步长. */
export const RATING = { count: 5, step: 1, halfStep: 0.5 } as const;

/** 交互件共用的类名组合. 各件自有的类名串也收在这里, 组件里只引用不重写. */
export const WIDGET_CLASSES = {
	/** 键盘焦点环: 只在键盘聚焦时出现, 线宽 1px. */
	focusRing: "outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
	/** 小号图标槽. */
	iconSm: "size-3.5 shrink-0",
	/** 次要说明文字. */
	hint: "text-xs text-muted-foreground",
	/** 屏幕阅读器播报区. */
	live: "sr-only",
	/** 输入框外观的容器 (TagInput) 与虚线投放区 (FileDropzone) 共用的 1px 边框与圆角. */
	field: "rounded-md border border-input bg-background",
	/** 前景与弱化文字色. */
	fg: "text-foreground",
	muted: "text-muted-foreground",
	strong: "font-medium",
	nums: "tabular-nums",
	truncate: "truncate",
	icon: "size-4",
	/** 列表与提示的纵向排布. */
	column: "flex flex-col gap-1",
	list: "flex flex-col gap-1.5",
	grow: "flex min-w-0 flex-1 flex-col",
	row: "flex flex-wrap items-center gap-2",
	/** 可清除的小图标按钮. */
	iconButton: "rounded-sm text-muted-foreground hover:text-foreground",
} as const;

/** 时间线的结构类名. */
export const TIMELINE_CLASSES = {
	list: "relative flex flex-col",
	item: "relative flex gap-3 pb-5 last:pb-0",
	line: "absolute top-6 bottom-0 left-3 w-px -translate-x-1/2 bg-border",
	marker: "relative flex size-6 shrink-0 items-center justify-center",
	badge: "flex size-6 items-center justify-center rounded-full",
	dot: "size-2.5 rounded-full ring-1 ring-background",
	body: "flex min-w-0 flex-1 flex-col gap-1 pt-0.5",
	head: "flex items-baseline justify-between gap-3",
	title: "min-w-0 truncate text-sm font-medium text-foreground",
	time: "shrink-0",
} as const;

/** 评分的结构类名. 星色取 warning 语义色, 与 "评级, 收藏" 的通用心智一致. */
export const RATING_CLASSES = {
	group: "inline-flex items-center gap-0.5",
	star: "relative inline-flex size-5 shrink-0",
	glyph: "size-5",
	empty: "text-muted-foreground/60",
	filled: "text-warning",
	clip: "absolute inset-y-0 left-0 overflow-hidden",
	slot: "absolute inset-y-0 rounded-sm",
	halfLeft: "left-0 w-1/2",
	halfRight: "right-0 w-1/2",
	whole: "inset-x-0",
	active: "cursor-pointer",
	inert: "cursor-default",
	disabled: "opacity-50",
} as const;

/** 拖放上传区的结构类名. data-dragging 时整体放大 1% 并换主色底, 给出明确的 "可以松手" 反馈. */
export const DROPZONE_CLASSES = {
	zone: "flex w-full flex-col items-center justify-center gap-2 border-dashed px-6 py-8 text-center",
	motion: "transition-[background-color,border-color,transform] duration-(--duration-fast) ease-out",
	states: "hover:border-primary/60 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50",
	dragging: "data-[dragging]:scale-[1.01] data-[dragging]:border-primary data-[dragging]:bg-primary/10",
	invalid: "border-danger/60",
	glyph: "size-7",
	title: "text-sm font-medium text-foreground",
	errors: "flex flex-col gap-1 rounded-md border border-danger/40 bg-danger/10 px-3 py-2",
	error: "flex items-start gap-2 text-xs text-danger-fg",
	errorIcon: "mt-px",
	errorText: "min-w-0 break-all",
	file: "flex items-center gap-3 px-2.5 py-2",
	thumb: "size-9 shrink-0 rounded-sm border border-border object-cover",
	placeholder: "flex size-9 shrink-0 items-center justify-center rounded-sm bg-muted",
	name: "truncate text-sm text-foreground",
	remove: "p-1",
} as const;

/** 标签输入的结构类名. */
export const TAG_CLASSES = {
	box: "flex min-h-9 w-full cursor-text flex-wrap items-center gap-1.5 px-2 py-1.5",
	motion: "transition-[border-color,box-shadow] duration-(--duration-fast) ease-out focus-within:border-ring",
	invalid: "border-danger/60",
	disabled: "pointer-events-none opacity-50",
	chip: "inline-flex max-w-full items-center gap-1 rounded-sm bg-secondary py-0.5 pr-0.5 pl-2 text-xs text-secondary-foreground",
	remove: "p-0.5",
	input: "min-w-24 flex-1 bg-transparent py-0.5 text-sm text-foreground outline-none placeholder:text-muted-foreground",
	error: "text-danger-fg",
} as const;

/** 色块的结构类名. 选中态是 1px 前景环加偏移, 与色块自身颜色无关, 任何底色上都看得见. */
export const SWATCH_CLASSES = {
	swatch: "relative flex items-center justify-center rounded-full border border-border",
	motion: "transition-[transform,box-shadow] duration-(--duration-fast) ease-out hover:scale-110",
	disabled: "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100",
	checked: "ring-1 ring-foreground ring-offset-2 ring-offset-background",
	mark: "flex items-center justify-center rounded-full bg-background/80",
	sm: "size-5",
	md: "size-7",
} as const;

/** 文本拼接用的分隔: 列表项之间的逗号空格, 括号. */
export const WIDGET_TEXT = { listJoin: ", ", open: " (", close: ")", clipboard: "text" } as const;

/** 动效参数: 交错间隔 (秒), 入场位移 (px) 与标签进出的弹簧. */
export const WIDGET_MOTION = {
	stagger: 0.06, rise: 8, popScale: 0.85, spring: { type: "spring", stiffness: 520, damping: 32, mass: 0.7 },
} as const;

/** 拆分粘贴文本的分隔符: 半角与全角逗号, 换行, 制表符, 分号. */
export const TAG_SPLIT = /[,\uFF0C;\n\t]+/;

/** 文件体积的进位与单位. */
const BYTE_STEP = 1024;
const BYTE_UNITS = ["B", "KB", "MB", "GB"] as const;
const BYTE_DIGITS = 1;

/** 把字节数格式化成人能读的体积 (1.5 MB). */
export function formatBytes(bytes: number): string {
	let size = bytes;
	let unit = 0;
	while (size >= BYTE_STEP && unit < BYTE_UNITS.length - 1) {
		size /= BYTE_STEP;
		unit += 1;
	}
	return (unit === 0 ? String(size) : size.toFixed(BYTE_DIGITS)) + " " + BYTE_UNITS[unit];
}

const DOT = ".";
const WILDCARD_SUFFIX = "/*";

/**
 * 文件是否满足 input 的 accept 串 (".png,image/*,application/pdf").
 * 规则与浏览器一致: 点开头比扩展名, 斜杠星结尾比主类型, 其余比完整 MIME. accept 为空时全收.
 */
export function matchesAccept(file: Pick<File, "name" | "type">, accept: string | undefined): boolean {
	if (!accept) return true;
	const name = file.name.toLowerCase();
	const mime = file.type.toLowerCase();
	return accept
		.split(WIDGET_KEY.comma)
		.map((part) => part.trim().toLowerCase())
		.filter(Boolean)
		.some((rule) => {
			if (rule.startsWith(DOT)) return name.endsWith(rule);
			if (rule.endsWith(WILDCARD_SUFFIX)) return mime.startsWith(rule.slice(0, -1));
			return mime === rule;
		});
}

/** 投放区校验失败的原因. 文案由组件按原因拼, 原因本身是稳定的机器值. */
export const REJECT_REASON = { type: "type", size: "size", count: "count" } as const;

export type RejectReason = (typeof REJECT_REASON)[keyof typeof REJECT_REASON];

/** 可预览成缩略图的 MIME 前缀. */
export const IMAGE_MIME_PREFIX = "image/";

/** 文件选择框的 input type. */
export const FILE_INPUT_TYPE = "file";

/** 屏幕阅读器播报区的礼貌级别: 不打断正在朗读的内容. */
export const LIVE_POLITE = "polite";

const STR = "string";
const NUM = "number";
const BOOL = "boolean";
const NODE = "ReactNode";
const VALUE_PAIR = "value / defaultValue";

/** 文档页 (docs/src/pages/widgets) 的示例数据与属性表. 色块示例只引用语义令牌. */
export const WIDGET_DOCS = {
	swatches: [
		{ value: WIDGET_TONE.primary, label: "主色", color: "var(--primary)" },
		{ value: WIDGET_TONE.success, label: "成功", color: "var(--success)" },
		{ value: WIDGET_TONE.warning, label: "警告", color: "var(--warning)" },
		{ value: WIDGET_TONE.danger, label: "危险", color: "var(--danger)" },
		{ value: WIDGET_TONE.neutral, label: "中性", color: "var(--muted-foreground)" },
		{ value: "foreground", label: "前景 (不可选)", color: "var(--foreground)", disabled: true },
	],
	initialScore: 3.5,
	readOnlyScore: 4,
	disabledScore: 2,
	initialTags: ["react", "motion"],
	maxTags: 8,
	maxFiles: 5,
	maxUpload: 2 * BYTE_STEP * BYTE_STEP,
	accept: "image/*,.pdf",
	tagJoin: " / ",
	props: {
		timeline: [
			{ name: "title", type: NODE, desc: "事件标题." },
			{ name: "time", type: NODE, desc: "时间或元信息, 显示在右侧." },
			{ name: "tone", type: "neutral | primary | success | warning | danger", default: WIDGET_TONE.neutral, desc: "圆点语义色." },
			{ name: "icon", type: STR, desc: "以图标替代圆点." },
			{ name: "last", type: BOOL, default: "false", desc: "末项不画连接线." },
		],
		rating: [
			{ name: VALUE_PAIR, type: NUM, desc: "当前分值, 0 为未评." },
			{ name: "count", type: NUM, default: String(RATING.count), desc: "星数." },
			{ name: "allowHalf", type: BOOL, default: "false", desc: "半星, 步长 0.5." },
			{ name: "allowClear", type: BOOL, default: "true", desc: "再点当前值或 Backspace 清零." },
			{ name: "readOnly / disabled", type: BOOL, desc: "只读仍可聚焦朗读, 禁用不可聚焦." },
		],
		dropzone: [
			{ name: "accept", type: STR, desc: "与 input accept 同语法." },
			{ name: "maxSize", type: NUM, desc: "单个文件字节上限." },
			{ name: "maxFiles", type: NUM, desc: "列表容量上限." },
			{ name: "onFilesChange", type: "(files: File[]) => void", desc: "完整列表变化时回调." },
			{ name: "onReject", type: "(list: FileRejection[]) => void", desc: "拒收回调, 组件也会显示原因." },
		],
		tagInput: [
			{ name: VALUE_PAIR, type: "string[]", desc: "标签列表." },
			{ name: "maxTags", type: NUM, desc: "上限, 到达后输入框只读." },
			{ name: "allowDuplicates", type: BOOL, default: "false", desc: "重复输入留在框内并标红." },
			{ name: "validate", type: "(tag: string) => boolean", desc: "自定义校验." },
			{ name: "addOnBlur", type: BOOL, default: "true", desc: "失焦时提交剩余文字." },
		],
		swatch: [
			{ name: "options", type: "ColorSwatchOption[]", desc: "value, label, color, disabled." },
			{ name: VALUE_PAIR, type: STR, desc: "选中值." },
			{ name: "size", type: "sm | md", default: "md", desc: "色块尺寸." },
		],
	},
} as const;
