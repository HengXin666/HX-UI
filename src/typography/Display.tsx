import type * as React from "react";
import {
	DISPLAY_TONE_CLASS,
	TEXT_TONE,
	TYPOGRAPHY_DEFAULTS,
	dataFlag,
	detectCjk,
	resolveSlots,
	type CjkMode,
	type DisplaySize,
	type DisplayTag,
	type RootSlot,
	type SlotClassNames,
	type SlotStyles,
	type TextTone,
	type TypographyState,
} from "../constants/typography";
import { cn } from "../primitives/utils";

/**
 * 营销尺度字号: 引用 V0-01 提供的 --fs-display-* 令牌, 不写死 px.
 * 类名整串写出, Tailwind 扫描才能生成对应规则. 字号类必须排在 leading 之前:
 * tailwind-merge 视字号与行距冲突, 后出现的字号会吃掉前面的 leading.
 */
const DISPLAY_SIZE_CLASS: Record<DisplaySize, string> = {
	sm: "text-[length:var(--fs-display-sm)]",
	md: "text-[length:var(--fs-display-md)]",
	lg: "text-[length:var(--fs-display-lg)]",
	xl: "text-[length:var(--fs-display-xl)]",
	"2xl": "text-[length:var(--fs-display-2xl)]",
};

/**
 * 基线: 紧行距与收紧字距适配拉丁文大字; data-cjk 时换成 --tracking-display-cjk, 行距放宽一档,
 * 关闭字重合成 (中文无真粗体时浏览器伪粗会糊), 断行用 strict 避免标点落到行首.
 */
const DISPLAY_BASE = cn(
	"scroll-m-20 font-bold leading-tight tracking-tight [font-synthesis:none]",
	"data-balance:text-balance",
	"data-cjk:leading-snug data-cjk:tracking-[var(--tracking-display-cjk)] data-cjk:[line-break:strict]",
);

export interface DisplayProps extends Omit<React.ComponentProps<"h1">, "data-slot"> {
	/** 根标签, 默认 h1. 语义级别由调用方决定, 视觉尺寸只由 size 决定. */
	as?: DisplayTag;
	/**
	 * 营销字号档, 默认 lg. 偏离契约 1.1 的 xs..xl: Display 的档位与 --fs-display-sm..2xl 令牌一一对应,
	 * 营销标题没有 xs 的用途, 却需要 2xl 的首屏大字.
	 */
	size?: DisplaySize;
	/** 语义色, 默认 neutral (标题色). */
	tone?: TextTone;
	/** 多行时各行长度均衡 (text-wrap: balance), 默认 true. */
	balance?: boolean;
	/** 中文回退: auto 按 lang 与文本判定, 默认 auto. */
	cjk?: CjkMode;
	classNames?: SlotClassNames<RootSlot, TypographyState>;
	styles?: SlotStyles<RootSlot, TypographyState>;
}

/**
 * Display: 营销级大标题 (Hero, 区块主标题). 文档内的标题用 TypographyH1..H4.
 * 遵循 docs/architecture/component-contract.md; React 19 下 ref 是普通 prop, 指向根标题元素, 不使用 forwardRef.
 *
 * .agents/notes/implemented/feature/2026-11-02-typography.md
 */
export function Display({
	as = TYPOGRAPHY_DEFAULTS.displayTag,
	size = TYPOGRAPHY_DEFAULTS.displaySize,
	tone = TEXT_TONE.neutral,
	balance = true,
	cjk,
	lang,
	classNames,
	styles,
	className,
	style,
	children,
	ref,
	...props
}: DisplayProps): React.JSX.Element {
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
			data-slot="display"
			data-size={size}
			data-tone={tone}
			data-cjk={dataFlag(isCjk)}
			data-balance={dataFlag(balance)}
			className={cn(DISPLAY_SIZE_CLASS[size], DISPLAY_BASE, DISPLAY_TONE_CLASS[tone], slotClass.root, className)}
			style={{ ...slotStyle.root, ...style }}
		>
			{children}
		</Tag>
	);
}
