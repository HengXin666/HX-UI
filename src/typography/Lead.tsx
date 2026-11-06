import type * as React from "react";
import {
	LEAD_MEASURE,
	TEXT_TONE,
	TONE_TEXT_CLASS,
	TYPOGRAPHY_DEFAULTS,
	dataFlag,
	detectCjk,
	resolveSlots,
	type CjkMode,
	type LeadMeasure,
	type LineTag,
	type RootSlot,
	type SlotClassNames,
	type SlotStyles,
	type TextSize,
	type TextTone,
	type TypographyState,
} from "../constants/typography";
import { cn } from "../primitives/utils";

/** 比正文 (--fs-base) 大一号起: sm=15, md=导语档, lg=19, 全部引用令牌. */
const LEAD_SIZE_CLASS: Record<TextSize, string> = {
	sm: "text-[length:var(--fs-lg)]",
	md: "text-[length:var(--fs-lead)]",
	lg: "text-[length:var(--fs-xl)]",
};

/** 行宽档 (字符数): 中文每字约 1em, 同一 ch 档读起来偏宽, 所以 CJK 在 CSS 里收窄. */
const LEAD_MEASURE_CLASS: Record<LeadMeasure, string> = {
	narrow: "max-w-[45ch] data-cjk:max-w-[28em]",
	default: "max-w-[60ch] data-cjk:max-w-[36em]",
	wide: "max-w-[75ch] data-cjk:max-w-[44em]",
	none: "max-w-none",
};

const LEAD_BASE = cn("leading-relaxed text-pretty", "data-balance:text-balance", "data-cjk:leading-loose data-cjk:[line-break:strict]");

export interface LeadProps extends Omit<React.ComponentProps<"p">, "data-slot"> {
	/** 根标签, 默认 p. */
	as?: LineTag;
	/** 字号档, 默认 md (--fs-lead). */
	size?: TextSize;
	/** 语义色, 默认 neutral (次要文字色). */
	tone?: TextTone;
	/** 最大行宽档, 默认 default (约 60 字符). */
	measure?: LeadMeasure;
	/** 各行均衡, 默认 false (导语多为长段, 用 pretty 避免孤字即可). */
	balance?: boolean;
	/** 中文回退, 默认 auto. */
	cjk?: CjkMode;
	classNames?: SlotClassNames<RootSlot, TypographyState>;
	styles?: SlotStyles<RootSlot, TypographyState>;
}

/**
 * Lead: 标题下的导语段, 比正文大一号, 行高放松, 最大宽度受控.
 * 遵循 docs/architecture/component-contract.md; ref 指向根元素.
 */
export function Lead({
	as = TYPOGRAPHY_DEFAULTS.lineTag,
	size = TYPOGRAPHY_DEFAULTS.textSize,
	tone = TEXT_TONE.neutral,
	measure = LEAD_MEASURE.default,
	balance = false,
	cjk,
	lang,
	classNames,
	styles,
	className,
	style,
	children,
	ref,
	...props
}: LeadProps): React.JSX.Element {
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
			data-slot="lead"
			data-size={size}
			data-tone={tone}
			data-measure={measure}
			data-cjk={dataFlag(isCjk)}
			data-balance={dataFlag(balance)}
			className={cn(LEAD_SIZE_CLASS[size], LEAD_BASE, LEAD_MEASURE_CLASS[measure], TONE_TEXT_CLASS[tone], slotClass.root, className)}
			style={{ ...slotStyle.root, ...style }}
		>
			{children}
		</Tag>
	);
}
