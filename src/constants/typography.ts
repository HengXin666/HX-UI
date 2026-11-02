/**
 * 版式组件 (src/typography/) 与其文档页共用的取值: 档位, 语气色, 标签, slot 元组, CJK 判定与默认值.
 * 颜色只以语义令牌工具类或 var(--语义名) 出现, 字号只引用 --fs-* 令牌, 这里不写任何 px 与色值.
 *
 * .agents/notes/implemented/feature/2026-11-02-typography.md
 */
import type * as React from "react";

/** Display 的营销字号档, 一一对应 tokens.css 的 --fs-display-sm..2xl (由 V0-01 提供). */
export const DISPLAY_SIZE = { sm: "sm", md: "md", lg: "lg", xl: "xl", "2xl": "2xl" } as const;
export type DisplaySize = (typeof DISPLAY_SIZE)[keyof typeof DISPLAY_SIZE];

/** 文字件 (Eyebrow / Kicker / Lead / Prose) 的三档, 是契约 size 词汇 xs..xl 的子集. */
export const TEXT_SIZE = { sm: "sm", md: "md", lg: "lg" } as const;
export type TextSize = (typeof TEXT_SIZE)[keyof typeof TEXT_SIZE];

/** 契约 1.1 的 tone 词汇. */
export const TEXT_TONE = {
	neutral: "neutral",
	primary: "primary",
	success: "success",
	warning: "warning",
	danger: "danger",
	info: "info",
} as const;
export type TextTone = (typeof TEXT_TONE)[keyof typeof TEXT_TONE];

/** tone 到文字色: 全部是语义令牌工具类. 深色底上实底蓝做文字对比不够, 所以 primary / info 取 --link. */
export const TONE_TEXT_CLASS: Record<TextTone, string> = {
	neutral: "text-muted-foreground",
	primary: "text-link",
	success: "text-success-fg",
	warning: "text-warning-fg",
	danger: "text-danger-fg",
	info: "text-link",
};

/** Display 的 tone: neutral 用标题色而不是次要色. */
export const DISPLAY_TONE_CLASS: Record<TextTone, string> = { ...TONE_TEXT_CLASS, neutral: "text-heading" };

/** CJK 开关: auto 依据 lang 与文本内容判定, true / false 强制. */
export const CJK_MODE = { auto: "auto" } as const;
export type CjkMode = typeof CJK_MODE.auto | boolean;

/** 中日韩文字区段: 统一表意文字, 扩展 A, 兼容表意, 假名, 谚文, 全角标点. */
export const CJK_PATTERN = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/;
/** 视为 CJK 的 lang 前缀. */
export const CJK_LANG_PATTERN = /^(zh|ja|ko|yue)(-|$)/i;

/** 可选的根标签. */
export const DISPLAY_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "div", "span"] as const;
export type DisplayTag = (typeof DISPLAY_TAGS)[number];
export const LINE_TAGS = ["p", "span", "div"] as const;
export type LineTag = (typeof LINE_TAGS)[number];
export const PROSE_TAGS = ["div", "article", "section", "main"] as const;
export type ProseTag = (typeof PROSE_TAGS)[number];

/** 默认值. */
export const TYPOGRAPHY_DEFAULTS = {
	displaySize: DISPLAY_SIZE.lg,
	textSize: TEXT_SIZE.md,
	displayTag: "h1",
	lineTag: "p",
	proseTag: "div",
	gradientAngle: 135,
} as const;

/** Lead 的最大行宽档: 以字符数控制阅读长度 (measure). */
export const LEAD_MEASURE = { narrow: "narrow", default: "default", wide: "wide", none: "none" } as const;
export type LeadMeasure = (typeof LEAD_MEASURE)[keyof typeof LEAD_MEASURE];

/** Kicker 前导标记: 无, 1px 短竖线, 或调用方给的图标. */
export const KICKER_MARKER = { none: "none", bar: "bar" } as const;
export type KickerMarker = (typeof KICKER_MARKER)[keyof typeof KICKER_MARKER];

/** GradientText 可选的色标, 全部映射到语义令牌. */
export const GRADIENT_STOP: Record<string, string> = {
	primary: "var(--primary)",
	link: "var(--link)",
	accent: "var(--accent-2, var(--link))",
	heading: "var(--heading)",
	success: "var(--success)",
	warning: "var(--warning)",
	danger: "var(--danger)",
};
export type GradientStop = "primary" | "link" | "accent" | "heading" | "success" | "warning" | "danger";
/** GradientText 写到元素上, 类名读取的 CSS 变量. */
export const GRADIENT_VAR = "--hx-text-gradient";
/** 未给色标时的默认渐变: 品牌渐变令牌, 缺席时回退主色到链接色. */
export const GRADIENT_DEFAULT = "var(--gradient-brand, linear-gradient(135deg, var(--primary), var(--link)))";

/** slot 元组 (契约 4.1). */
export const DISPLAY_SLOTS = ["root"] as const;
export const EYEBROW_SLOTS = ["root"] as const;
export const LEAD_SLOTS = ["root"] as const;
export const KICKER_SLOTS = ["root", "icon", "bar", "label"] as const;
export const GRADIENT_TEXT_SLOTS = ["root"] as const;
export const PROSE_SLOTS = ["root"] as const;
export type KickerSlot = (typeof KICKER_SLOTS)[number];
export type RootSlot = "root";

/** 契约 4.1 的 classNames / styles 形态, 函数形态接收组件公开状态. */
export type SlotClassNames<S extends string, State> = Partial<Record<S, string>> | ((state: State) => Partial<Record<S, string>>);
export type SlotStyles<S extends string, State> =
	| Partial<Record<S, React.CSSProperties>>
	| ((state: State) => Partial<Record<S, React.CSSProperties>>);

/** 所有版式件共有的公开状态, 与 data-* 属性一致. */
export interface TypographyState {
	size: string;
	tone: TextTone;
	cjk: boolean;
}

/** 解析 classNames / styles 的对象或函数形态. 纯函数, 无副作用. */
export function resolveSlots<S extends string, State, V>(
	value: Partial<Record<S, V>> | ((state: State) => Partial<Record<S, V>>) | undefined,
	state: State,
): Partial<Record<S, V>> {
	if (!value) return {};
	return typeof value === "function" ? value(state) : value;
}

/** 从 children 里收集纯文本, 供 CJK 自动判定. 只看字符串与数字, 不深入元素. */
function collectText(node: React.ReactNode): string {
	if (typeof node === "string" || typeof node === "number") return String(node);
	if (Array.isArray(node)) return node.map(collectText).join("");
	return "";
}

/**
 * CJK 判定: 显式 true / false 直接用; auto 时先看 lang (zh / ja / ko), 再看直接文本是否含 CJK 字符.
 * 文本藏在子元素里时自动判定看不到, 这时请传 cjk 或 lang.
 */
export function detectCjk(mode: CjkMode | undefined, lang: string | undefined, children: React.ReactNode): boolean {
	if (typeof mode === "boolean") return mode;
	if (lang) return CJK_LANG_PATTERN.test(lang);
	return CJK_PATTERN.test(collectText(children));
}

/** 布尔 data 属性: 真时写空字符串, 假时不写 (契约 5.2). */
export const dataFlag = (on: boolean): "" | undefined => (on ? "" : undefined);

/** 文档页示例文案 (多处复用). */
export const TYPOGRAPHY_DOC = {
	display: "Ship interfaces people remember",
	displayCjk: "让界面被记住",
	eyebrow: "New in 0.2",
	kicker: "Changelog",
	lead: "A typography layer for marketing pages and long-form docs, built entirely on semantic tokens so every theme stays in tune.",
	gradient: "semantic gradients",
	stage: "flex w-full flex-col gap-3",
} as const;
