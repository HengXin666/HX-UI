/**
 * 站点外壳零件 (src/site/) 的取值: slot 元组, 高度 / 容器 / tone 档, 存储键, 阈值, 按键与复用类名.
 * 维度取值 as const 保留字面量类型, 组件 props 的联合类型从这里推导.
 */

/**
 * 顶栏高度档 (Tailwind 标准档), collapse="shrink" 滚动后退一档.
 *
 * .agents/notes/implemented/feature/2026-11-02-site-shell-parts.md
 */
export const SITE_HEIGHT = { sm: "h-12", md: "h-14", lg: "h-16" } as const;
export const SITE_HEIGHT_SHRUNK = { sm: "data-shrunk:h-10", md: "data-shrunk:h-12", lg: "data-shrunk:h-14" } as const;

/** 容器宽度档, 映射 tokens.css 的 --container-* 令牌. */
export const SITE_CONTAINER = {
	narrow: "max-w-(--container-narrow)",
	content: "max-w-(--container-content)",
	wide: "max-w-(--container-wide)",
	display: "max-w-(--container-display)",
	full: "max-w-none",
} as const;

/** 顶栏滚动后的形态: 不变, 下滚隐藏上滚出现, 收矮一档. */
export const SITE_COLLAPSE = { none: "none", hide: "hide", shrink: "shrink" } as const;

/** 语义色档 (契约 1.1 的 tone 词汇). */
export const SITE_TONE = {
	neutral: "neutral",
	primary: "primary",
	success: "success",
	warning: "warning",
	danger: "danger",
	info: "info",
} as const;

/** LocaleSwitcher 的弹出形态. */
export const SITE_OVERLAY_MODE = { popover: "popover", dialog: "dialog" } as const;

/** ThemeSwitcher 的两种外观: 三段单选组, 单按钮循环. */
export const SITE_THEME_VARIANT = { segmented: "segmented", cycle: "cycle" } as const;

/** MobileNav 抽屉滑入的方向. */
export const SITE_DRAWER_SIDE = { left: "left", right: "right" } as const;

/** 默认 localStorage 键. ThemeSwitcher 存原始字符串, 与 getThemeScript({ storageKey }) 读法一致. */
export const SITE_STORAGE = { announcement: "hx-site-announcement", theme: "hx-site-theme" } as const;

/** 滚动判定 (px): 超过 threshold 视为已滚动, 单帧位移超过 delta 才切换隐藏状态 (去抖动). */
export const SITE_SCROLL = { threshold: 8, delta: 4 } as const;
export const SITE_SCROLL_EVENT = "scroll";

/** 选项数超过它时 LocaleSwitcher 自动显示搜索框. */
export const SITE_LOCALE_SEARCH_MIN = 8;

/** 键盘事件 key 值. */
export const SITE_KEY = {
	arrowUp: "ArrowUp",
	arrowDown: "ArrowDown",
	arrowLeft: "ArrowLeft",
	arrowRight: "ArrowRight",
	home: "Home",
	end: "End",
} as const;

/** 外链属性. */
export const SITE_EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

/** 复用三次以上的类名组合. */
export const SITE_CLASSES = {
	focus: "outline-none focus-visible:outline-1 focus-visible:outline-ring focus-visible:outline-offset-2",
	icon: "size-4 shrink-0",
	iconButton:
		"inline-flex size-(--control-h-md) shrink-0 items-center justify-center rounded-(--radius-md) text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-accent hover:text-foreground",
	link: "text-sm text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground",
	heading: "text-sm font-medium text-foreground",
	description: "text-xs text-muted-foreground",
	container: "mx-auto w-full px-(--container-padding-x)",
	list: "flex flex-col gap-1",
	row: "flex w-full items-center gap-3 rounded-(--radius-md) px-3 py-2 text-sm text-foreground transition-colors duration-(--duration-fast) hover:bg-accent",
} as const;

/** 各组件的 slot 元组 (契约第 4 节), data-slot = 组件名 + "-" + slot, root 即组件名. */
export const SITE_HEADER_SLOTS = ["root", "container", "brand", "nav", "actions", "mobile"] as const;
export const MEGA_MENU_SLOTS = [
	"root", "list", "item", "trigger", "link", "content", "panel", "columns", "group", "group-title", "group-list",
	"group-link", "link-description", "featured", "featured-image", "featured-title", "featured-description",
] as const;
export const MOBILE_NAV_SLOTS = [
	"root", "trigger", "header", "title", "back-button", "close-button", "search", "body", "list", "item",
	"link", "next-button", "level", "group", "group-title", "account",
] as const;
export const ANNOUNCEMENT_BAR_SLOTS = ["root", "inner", "icon", "content", "link", "close-button"] as const;
export const LOCALE_SWITCHER_SLOTS = [
	"root", "trigger-icon", "value", "region", "content", "title", "search", "list", "group", "item",
	"item-indicator", "empty",
] as const;
export const SEARCH_OVERLAY_SLOTS = [
	"root", "trigger", "content", "input", "list", "popular", "popular-item", "group", "item",
	"item-description", "loading", "empty",
] as const;
export const SITE_FOOTER_SLOTS = [
	"root", "container", "top", "brand", "subscribe", "nav", "columns", "accordion", "group", "group-title",
	"group-list", "link", "bottom", "meta", "copyright", "legal", "legal-list", "legal-link", "end", "locale",
	"social", "social-link",
] as const;
export const THEME_SWITCHER_SLOTS = ["root", "item", "item-icon"] as const;
