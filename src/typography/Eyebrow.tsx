import type * as React from "react";
import {
	KICKER_MARKER,
	TEXT_TONE,
	TONE_TEXT_CLASS,
	TYPOGRAPHY_DEFAULTS,
	dataFlag,
	detectCjk,
	resolveSlots,
	type CjkMode,
	type KickerMarker,
	type KickerSlot,
	type LineTag,
	type RootSlot,
	type SlotClassNames,
	type SlotStyles,
	type TextSize,
	type TextTone,
	type TypographyState,
} from "../constants/typography";
import { cn } from "../primitives/utils";

/* Eyebrow 与 Kicker 同属标题前的单行标识, 放在同一文件以守住目录 6 文件上限. */

/** 眉标字号: 比正文小, 引用 --fs-* 令牌. */
const EYEBROW_SIZE_CLASS: Record<TextSize, string> = {
	sm: "text-[length:var(--fs-2xs)]",
	md: "text-[length:var(--fs-xs)]",
	lg: "text-[length:var(--fs-sm)]",
};

/**
 * 大写 + 放宽字距是拉丁文眉标的识别特征. 中文没有大小写, 放宽到 widest 会让字散开,
 * 所以 data-cjk 时取消大写并改用 --tracking-display-cjk.
 */
const EYEBROW_BASE = cn(
	"inline-block font-semibold uppercase leading-none tracking-widest",
	"data-cjk:normal-case data-cjk:tracking-[var(--tracking-display-cjk)]",
);

export interface EyebrowProps extends Omit<React.ComponentProps<"p">, "data-slot"> {
	/** 根标签, 默认 p. */
	as?: LineTag;
	/** 字号档, 默认 md. */
	size?: TextSize;
	/** 语义色, 默认 primary (取 --link, 深色底上可读). */
	tone?: TextTone;
	/** 中文回退, 默认 auto. */
	cjk?: CjkMode;
	classNames?: SlotClassNames<RootSlot, TypographyState>;
	styles?: SlotStyles<RootSlot, TypographyState>;
}

/**
 * Eyebrow: 区块标题上方的小号大写眉标. 遵循 docs/architecture/component-contract.md; ref 指向根元素.
 */
export function Eyebrow({
	as = TYPOGRAPHY_DEFAULTS.lineTag,
	size = TYPOGRAPHY_DEFAULTS.textSize,
	tone = TEXT_TONE.primary,
	cjk,
	lang,
	classNames,
	styles,
	className,
	style,
	children,
	ref,
	...props
}: EyebrowProps): React.JSX.Element {
	const Tag = as as React.ElementType;
	const isCjk = detectCjk(cjk, lang, children);
	const state: TypographyState = { size, tone, cjk: isCjk };
	const slotClass = resolveSlots(classNames, state);
	const slotStyle = resolveSlots(styles, state);
	return (
		<Tag
			{...props}
			ref={ref}
			lang={lang}
			data-slot="eyebrow"
			data-size={size}
			data-tone={tone}
			data-cjk={dataFlag(isCjk)}
			className={cn(EYEBROW_SIZE_CLASS[size], EYEBROW_BASE, TONE_TEXT_CLASS[tone], slotClass.root, className)}
			style={{ ...slotStyle.root, ...style }}
		>
			{children}
		</Tag>
	);
}

/** 字号与标记尺寸同档变化. */
const KICKER_SIZE_CLASS: Record<TextSize, string> = {
	sm: "gap-1.5 text-[length:var(--fs-xs)]",
	md: "gap-2 text-[length:var(--fs-sm)]",
	lg: "gap-2.5 text-[length:var(--fs-base)]",
};

const KICKER_BASE = cn(
	"inline-flex items-center font-medium leading-none",
	"data-cjk:tracking-[var(--tracking-display-cjk)]",
);
/** 短竖线: 宽 1px (契约线宽), 高度随字号 (1em), 颜色跟随 tone 的 currentColor. */
const KICKER_BAR = "inline-block h-[1em] w-px shrink-0 bg-current";
/** 图标容器: 1em 见方, 子 svg 填满. */
const KICKER_ICON = "inline-flex size-[1em] shrink-0 items-center justify-center [&>svg]:size-full";

export interface KickerProps extends Omit<React.ComponentProps<"p">, "data-slot"> {
	/** 根标签, 默认 p. */
	as?: LineTag;
	/** 字号档, 默认 md. */
	size?: TextSize;
	/** 语义色, 默认 neutral (次要文字色). */
	tone?: TextTone;
	/** 前导标记: none 或 bar (1px 短竖线). 给了 icon 时以 icon 为准. */
	marker?: KickerMarker;
	/** 前导图标 (装饰性, 自动 aria-hidden). */
	icon?: React.ReactNode;
	/** 中文回退, 默认 auto. */
	cjk?: CjkMode;
	classNames?: SlotClassNames<KickerSlot, TypographyState>;
	styles?: SlotStyles<KickerSlot, TypographyState>;
}

/**
 * Kicker: 标题前的小标识行 (栏目名, 日期, 分类), 可带图标或 1px 短竖线.
 * 遵循 docs/architecture/component-contract.md; ref 指向根元素.
 */
export function Kicker({
	as = TYPOGRAPHY_DEFAULTS.lineTag,
	size = TYPOGRAPHY_DEFAULTS.textSize,
	tone = TEXT_TONE.neutral,
	marker = KICKER_MARKER.none,
	icon,
	cjk,
	lang,
	classNames,
	styles,
	className,
	style,
	children,
	ref,
	...props
}: KickerProps): React.JSX.Element {
	const Tag = as as React.ElementType;
	const isCjk = detectCjk(cjk, lang, children);
	const state: TypographyState = { size, tone, cjk: isCjk };
	const sc = resolveSlots(classNames, state);
	const ss = resolveSlots(styles, state);
	const showBar = !icon && marker === KICKER_MARKER.bar;
	return (
		<Tag
			{...props}
			ref={ref}
			lang={lang}
			data-slot="kicker"
			data-size={size}
			data-tone={tone}
			data-marker={icon ? undefined : marker}
			data-cjk={dataFlag(isCjk)}
			className={cn(KICKER_SIZE_CLASS[size], KICKER_BASE, TONE_TEXT_CLASS[tone], sc.root, className)}
			style={{ ...ss.root, ...style }}
		>
			{icon ? (
				<span data-slot="kicker-icon" aria-hidden="true" className={cn(KICKER_ICON, sc.icon)} style={ss.icon}>
					{icon}
				</span>
			) : null}
			{showBar ? <span data-slot="kicker-bar" aria-hidden="true" className={cn(KICKER_BAR, sc.bar)} style={ss.bar} /> : null}
			<span data-slot="kicker-label" className={sc.label} style={ss.label}>
				{children}
			</span>
		</Tag>
	);
}
