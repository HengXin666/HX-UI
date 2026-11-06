/**
 * 商业语义原子 (src/commerce) 的取值, slot 元组, 结构类名与阈值.
 * 颜色只引用 tokens.css 桥接出的语义类; 不出现调色盘色, 函数色值与货币符号 (符号一律由 Intl 产出).
 */

/**
 * 控件尺寸五档 (契约 1.1), 商业原子共用.
 */
export const COMMERCE_SIZE = { xs: "xs", sm: "sm", md: "md", lg: "lg", xl: "xl" } as const;
export type CommerceSize = (typeof COMMERCE_SIZE)[keyof typeof COMMERCE_SIZE];

/** 语义色 (契约 1.1 的 tone 词汇). info 没有独立令牌, 落到 primary / link. */
export const COMMERCE_TONE = {
	neutral: "neutral",
	primary: "primary",
	info: "info",
	success: "success",
	warning: "warning",
	danger: "danger",
} as const;
export type CommerceTone = (typeof COMMERCE_TONE)[keyof typeof COMMERCE_TONE];

/** 徽标的视觉结构. */
export const COMMERCE_VARIANT = { solid: "solid", soft: "soft", outline: "outline" } as const;
export type CommerceVariant = (typeof COMMERCE_VARIANT)[keyof typeof COMMERCE_VARIANT];

/** 计价周期. */
export const PRICE_PERIOD = { day: "day", week: "week", month: "month", year: "year" } as const;
export type PricePeriod = (typeof PRICE_PERIOD)[keyof typeof PRICE_PERIOD];

/** 促销徽标的语义种类, 决定默认文案与默认 tone. */
export const PROMO_KIND = {
	new: "new",
	sale: "sale",
	discount: "discount",
	limited: "limited",
	lowStock: "low-stock",
	custom: "custom",
} as const;
export type PromoKind = (typeof PROMO_KIND)[keyof typeof PROMO_KIND];

/** 徽标贴角位置 (逻辑方位, RTL 下自动翻转). */
export const PROMO_PLACEMENT = {
	topStart: "top-start",
	topEnd: "top-end",
	bottomStart: "bottom-start",
	bottomEnd: "bottom-end",
} as const;
export type PromoPlacement = (typeof PROMO_PLACEMENT)[keyof typeof PROMO_PLACEMENT];

/** 订阅表单的提交状态. */
export const NEWSLETTER_STATUS = { idle: "idle", submitting: "submitting", success: "success", error: "error" } as const;
export type NewsletterStatus = (typeof NEWSLETTER_STATUS)[keyof typeof NEWSLETTER_STATUS];

/** 轨道条目宽度档. auto 由内容决定. */
export const RAIL_ITEM_SIZE = { auto: "auto", sm: "sm", md: "md", lg: "lg", full: "full" } as const;
export type RailItemSize = (typeof RAIL_ITEM_SIZE)[keyof typeof RAIL_ITEM_SIZE];

/** 单选项的 data-state 取值 (契约 5.2 勾选类). */
export const CHOICE_STATE = { checked: "checked", unchecked: "unchecked" } as const;

/** 激活类 data-state (分页点). */
export const ACTIVE_STATE = { active: "active", inactive: "inactive" } as const;

/** Intl 选项取值. */
export const COMMERCE_INTL = {
	currency: "currency",
	percent: "percent",
	compact: "compact",
	always: "always",
	exceptZero: "exceptZero",
	short: "short",
} as const;

/** 阈值与默认数字. */
export const COMMERCE_NUMBERS = {
	/** 色板默认最多露出几个, 其余折叠成 +N. */
	swatchMax: 6,
	/** 评分满分. */
	ratingMax: 5,
	/** 分数保留一位小数. */
	ratingDigits: 1,
	/** 库存小于等于该值时显示 "仅剩 N". */
	lowStock: 5,
	/** 左右按钮一次滚动视口宽度的比例. */
	railStep: 0.9,
	/** 判定 "已到边缘" 的容差 (px), 抵消亚像素滚动. */
	railEpsilon: 2,
	/** 溢出淡出遮罩宽度 (视口百分比). */
	railFade: 8,
	/** 折扣率计算结果保留的小数位 (0.3 → 30%). */
	discountDigits: 2,
} as const;

/** 溢出淡出遮罩的组成: 遮罩只看 alpha, 用前景令牌做不透明段, 不写色值. */
export const RAIL_MASK = {
	opaque: "var(--foreground)",
	clear: "transparent",
	ltr: "to right",
	rtl: "to left",
	/** getComputedStyle().direction 的从右往左取值. */
	rtlDir: "rtl",
} as const;

/** 各组件的 slot 元组 (契约 4.1), data-slot = <组件名>-<slot>. */
export const PRICE_SLOTS = ["root", "current", "original", "discount", "period", "tax", "sr-label"] as const;
export const PROMO_BADGE_SLOTS = ["root"] as const;
export const PRODUCT_SWATCH_SLOTS = ["root", "item", "swatch", "indicator", "more"] as const;
export const SIZE_SELECTOR_SLOTS = ["root", "item", "item-text", "item-hint"] as const;
export const RATING_SUMMARY_SLOTS = ["root", "stars", "star", "star-icon", "star-fill", "score", "count"] as const;
export const NEWSLETTER_FORM_SLOTS = ["root", "label", "field", "input", "submit", "message"] as const;
export const FOOTNOTE_REF_SLOTS = ["root", "link"] as const;
export const FOOTNOTE_LIST_SLOTS = ["root", "title", "list", "item", "content", "back-button", "back-icon"] as const;
export const RAIL_SLOTS = ["root", "viewport", "item", "controls", "previous-button", "next-button", "button-icon", "pagination", "dot"] as const;

/** data-slot 根名. */
export const COMMERCE_SLOT = {
	price: "price",
	promoBadge: "promo-badge",
	productSwatch: "product-swatch",
	sizeSelector: "size-selector",
	ratingSummary: "rating-summary",
	newsletterForm: "newsletter-form",
	footnoteRef: "footnote-ref",
	footnoteList: "footnote-list",
	rail: "rail",
} as const;

/** 1px 焦点环 (契约 8.2), 只在键盘聚焦时出现. */
export const COMMERCE_FOCUS = "outline-none focus-visible:outline-1 focus-visible:outline-ring focus-visible:outline-offset-2";

/** 复用三次以上的类名组合. */
export const COMMERCE_CLASSES = {
	srOnly: "sr-only",
	nums: "tabular-nums",
	muted: "text-muted-foreground",
	row: "inline-flex flex-wrap items-center",
	colors: "transition-[color,background-color,border-color,opacity] duration-(--duration-fast) ease-out",
	disabled: "data-disabled:cursor-not-allowed data-disabled:opacity-50",
} as const;

/** 字号随 size 走 (Tailwind 标准档). */
export const COMMERCE_TEXT: Readonly<Record<CommerceSize, string>> = {
	xs: "text-xs",
	sm: "text-sm",
	md: "text-base",
	lg: "text-xl",
	xl: "text-3xl",
};

/** 控件高度与内边距随 size 走. */
export const COMMERCE_CONTROL: Readonly<Record<CommerceSize, string>> = {
	xs: "min-h-6 min-w-6 px-1.5 text-xs",
	sm: "min-h-7 min-w-7 px-2 text-xs",
	md: "min-h-8 min-w-8 px-2.5 text-sm",
	lg: "min-h-9 min-w-9 px-3 text-sm",
	xl: "min-h-10 min-w-10 px-4 text-base",
};

/** 圆形色块边长随 size 走. */
export const SWATCH_DIAMETER: Readonly<Record<CommerceSize, string>> = {
	xs: "size-4",
	sm: "size-5",
	md: "size-6",
	lg: "size-8",
	xl: "size-10",
};

/** 徽标: tone × variant 的语义色. */
export const PROMO_TONE_CLASSES: Readonly<Record<CommerceTone, Record<CommerceVariant, string>>> = {
	neutral: { solid: "bg-foreground text-background", soft: "bg-muted text-foreground", outline: "border-border text-foreground" },
	primary: { solid: "bg-primary text-primary-foreground", soft: "bg-primary/10 text-link", outline: "border-primary/40 text-link" },
	info: { solid: "bg-primary text-primary-foreground", soft: "bg-primary/10 text-link", outline: "border-primary/40 text-link" },
	success: { solid: "bg-success-emphasis text-primary-foreground", soft: "bg-success/15 text-success-fg", outline: "border-success/40 text-success-fg" },
	warning: { solid: "bg-warning-emphasis text-primary-foreground", soft: "bg-warning/15 text-warning-fg", outline: "border-warning/40 text-warning-fg" },
	danger: { solid: "bg-danger-emphasis text-primary-foreground", soft: "bg-danger/15 text-danger-fg", outline: "border-danger/40 text-danger-fg" },
};

/** 徽标每种语义种类的默认 tone. */
export const PROMO_DEFAULT_TONE: Readonly<Record<PromoKind, CommerceTone>> = {
	new: "info",
	sale: "danger",
	discount: "danger",
	limited: "warning",
	"low-stock": "warning",
	custom: "neutral",
};

/** 徽标贴角的绝对定位 (逻辑属性). */
export const PROMO_PLACEMENT_CLASSES: Readonly<Record<PromoPlacement, string>> = {
	"top-start": "absolute top-2 start-2 z-10",
	"top-end": "absolute top-2 end-2 z-10",
	"bottom-start": "absolute bottom-2 start-2 z-10",
	"bottom-end": "absolute bottom-2 end-2 z-10",
};

/** 徽标结构类与尺寸. */
export const PROMO_CLASSES = {
	base: "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-transparent font-medium leading-none",
	xs: "px-1.5 py-0.5 text-xs",
	sm: "px-2 py-0.5 text-xs",
	md: "px-2.5 py-1 text-xs",
	lg: "px-3 py-1 text-sm",
	xl: "px-3.5 py-1.5 text-sm",
} as const;

/** 价格的结构类. */
export const PRICE_CLASSES = {
	root: "inline-flex flex-wrap items-baseline gap-x-2 gap-y-1",
	current: "font-semibold text-foreground",
	original: "text-sm text-muted-foreground line-through",
	discount: "rounded-sm bg-danger/15 px-1.5 py-0.5 text-xs font-medium text-danger-fg",
	period: "text-sm text-muted-foreground",
	tax: "text-xs text-muted-foreground",
} as const;

/** 选择类 (色板, 尺码) 共用结构类. */
export const CHOICE_CLASSES = {
	group: "flex flex-wrap items-center gap-2",
	swatchItem: "relative inline-flex items-center justify-center rounded-full border border-border p-0.5 data-[state=checked]:border-foreground",
	swatch: "block rounded-full border border-border",
	indicator: "absolute inset-0 m-auto size-1.5 rounded-full bg-background",
	more: "inline-flex items-center justify-center rounded-full border border-border px-2 text-xs text-muted-foreground hover:text-foreground",
	moreWidth: "w-auto",
	soldOut: "data-[sold-out]:line-through",
	sizeItem: "inline-flex flex-col items-center justify-center rounded-(--radius-md) border border-border bg-background text-foreground hover:bg-muted data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background",
	sizeHint: "text-xs text-warning-fg",
} as const;

/** 评分摘要的结构类. 星色取 warning 语义色, 与 Rating 一致. */
export const RATING_SUMMARY_CLASSES = {
	root: "inline-flex items-center gap-1.5 text-sm",
	link: "rounded-sm hover:underline",
	stars: "inline-flex items-center gap-0.5",
	star: "relative inline-flex size-4 shrink-0",
	glyph: "size-4",
	empty: "text-muted-foreground/60",
	fill: "absolute inset-y-0 start-0 overflow-hidden text-warning",
	score: "font-semibold text-foreground",
} as const;

/** 订阅表单的结构类. */
export const NEWSLETTER_CLASSES = {
	root: "flex w-full flex-col gap-2",
	label: "text-sm font-medium text-foreground",
	field: "flex w-full items-center gap-2",
	input: "h-9 min-w-0 flex-1 rounded-(--radius-md) border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring outline-none aria-invalid:border-danger",
	submit: "inline-flex h-9 shrink-0 items-center justify-center rounded-(--radius-md) bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 data-loading:opacity-70",
	message: "min-h-5 text-sm text-muted-foreground data-[status=error]:text-danger-fg data-[status=success]:text-success-fg",
} as const;

/** 脚注的结构类. */
export const FOOTNOTE_CLASSES = {
	ref: "ms-0.5 align-super text-xs",
	refLink: "rounded-sm text-link hover:underline",
	root: "mt-8 border-t border-border pt-4 text-sm text-muted-foreground",
	title: "mb-2 text-sm font-medium text-foreground",
	list: "flex list-decimal flex-col gap-1.5 ps-5",
	item: "scroll-mt-20 rounded-sm outline-none data-[state=active]:text-foreground",
	back: "ms-1 rounded-sm text-link hover:underline",
} as const;

/** 横滑轨道的结构类. */
export const RAIL_CLASSES = {
	root: "relative flex w-full flex-col gap-3",
	viewport: "flex w-full gap-4 overflow-x-auto overscroll-x-contain scroll-smooth motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
	snap: "snap-x snap-mandatory",
	item: "shrink-0 snap-start",
	controls: "flex items-center justify-between gap-2",
	button: "inline-flex size-8 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
	pagination: "flex items-center gap-1.5",
	dot: "size-2 rounded-full bg-muted-foreground/40 data-[state=active]:bg-foreground",
	icon: "size-4",
} as const;

/** 轨道条目宽度档. */
export const RAIL_ITEM_WIDTH: Readonly<Record<RailItemSize, string>> = {
	auto: "w-auto",
	sm: "w-48",
	md: "w-64",
	lg: "w-80",
	full: "w-full",
};

/** 轨道左右按钮图标 (solar, 已在 peerDependencies 声明). */
export const RAIL_ICON = {
	previous: "icon-[solar--alt-arrow-left-linear]",
	next: "icon-[solar--alt-arrow-right-linear]",
} as const;
