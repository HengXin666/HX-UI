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
	type DisplayWeight,
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
	"3xl": "text-[length:var(--fs-display-3xl)]",
};

/**
 * 行高与字距按字号档读 token, 不写 leading-tight / tracking-tight 字面量:
 * - 行高 (A1): 读 --lh-display (1.05), 2xl / 3xl 单行巨字读 --lh-display-tight (1.0). 字面量 leading-tight 是 1.25,
 *   tokens.css 的 display 行高写了却从未生效; 读 token 后改一处 tokens.css, 全部 Display 与区块标题同步.
 * - 字距 (A2): sm / md 读 --tracking-display, lg 以上读 --tracking-display-tight. 字号越大拉丁字母需要收得越紧,
 *   字面量 tracking-tight 只有 -0.025em 一档, 做不出随字号收紧; token 也让皮肤能整体调字距.
 * 排在字号类之后, 理由同上 (tailwind-merge 的字号 / 行距冲突).
 */
const DISPLAY_RHYTHM_CLASS: Record<DisplaySize, string> = {
	sm: "leading-(--lh-display) tracking-(--tracking-display)",
	md: "leading-(--lh-display) tracking-(--tracking-display)",
	lg: "leading-(--lh-display) tracking-(--tracking-display-tight)",
	xl: "leading-(--lh-display) tracking-(--tracking-display-tight)",
	"2xl": "leading-(--lh-display-tight) tracking-(--tracking-display-tight)",
	"3xl": "leading-(--lh-display-tight) tracking-(--tracking-display-tight)",
};

/**
 * 字重 (A3): 默认读 --fw-display (600), 不写 700 的粗体字面量. 真实站点的展示字重是 300..600 的可变字重,
 * 各皮肤在自己的作用域覆盖 --fw-display (450 / 510 / 300) 即可换档, 不必改组件.
 * weight 是单点覆盖, 同样读 --fw-light..--fw-bold, 不传时只出默认类 (行为等于读 --fw-display);
 * 传了就不出默认类, 两个字重类不会同时落到元素上靠生成顺序决胜.
 * 不改 --fw-semibold / --fw-bold 本身, primitives 里按钮 / 输入框的字重不受影响.
 */
const DISPLAY_WEIGHT_DEFAULT = "font-(--fw-display)";
const DISPLAY_WEIGHT_CLASS: Record<DisplayWeight, string> = {
	light: "font-(--fw-light)",
	regular: "font-(--fw-regular)",
	medium: "font-(--fw-medium)",
	semibold: "font-(--fw-semibold)",
	bold: "font-(--fw-bold)",
};

/**
 * 基线: 关闭字重合成 (中文无真粗体时浏览器伪粗会糊), 断行用 strict 避免标点落到行首.
 * - 字体 (A4): 读 --font-display, 不写字体栈字面量. 皮肤 (src/skins/*.css) 各自覆盖 --font-display,
 *   切到 linear 皮肤标题即换 Inter Display; 未加皮肤时 tokens.css 让它回到 --font-sans, 外观与正文同族.
 *   data-cjk 时读 --font-display-cjk: 中文标题单独一位, 苹方排在 Noto 之前.
 * - CJK 行高 (A6): data-cjk 时读 --lh-display-cjk (1.2), 不写 leading-snug (1.375) 字面量.
 *   方块字无升降部, 拉丁的 1.05 太挤, 1.375 在 80px 下两行之间约 30px 空白偏松; 取值待中文站点实测, 改 token 即可.
 * - CJK 字距: 读 --tracking-display-cjk (0), 负字距会把汉字挤到一起.
 */
const DISPLAY_BASE = cn(
	"scroll-m-20 [font-family:var(--font-display)] [font-synthesis:none]",
	"data-balance:text-balance",
	"data-cjk:[font-family:var(--font-display-cjk)] data-cjk:leading-(--lh-display-cjk) data-cjk:tracking-(--tracking-display-cjk) data-cjk:[line-break:strict]",
);

export interface DisplayProps extends Omit<React.ComponentProps<"h1">, "data-slot"> {
	/** 根标签, 默认 h1. 语义级别由调用方决定, 视觉尺寸只由 size 决定. */
	as?: DisplayTag;
	/**
	 * 营销字号档, 默认 lg. 偏离契约 1.1 的 xs..xl: Display 的档位与 --fs-display-sm..2xl 令牌一一对应,
	 * 营销标题没有 xs 的用途, 却需要 2xl 的首屏大字.
	 */
	size?: DisplaySize;
	/** 字重单点覆盖. 不传时读 --fw-display (默认 600, 皮肤可覆盖). */
	weight?: DisplayWeight;
	/** 语义色, 默认 neutral (标题色). */
	tone?: TextTone;
	/** 多行时各行长度均衡 (text-wrap: balance), 默认 true. */
	balance?: boolean;
	/** 中文回退: auto 按 lang 与文本判定, 默认 auto. */
	cjk?: CjkMode;
	classNames?: SlotClassNames<RootSlot, TypographyState>;
	styles?: SlotStyles<RootSlot, TypographyState>;
}

/** 区块把 Display 当作自己的标题槽时会传 data-slot (Hero / SectionHeading), 有则沿用, 无则为 display. */
const DEFAULT_SLOT = "display";

/**
 * Display: 营销级大标题 (Hero, 区块主标题). 文档内的标题用 TypographyH1..H4.
 * 遵循 docs/architecture/component-contract.md; React 19 下 ref 是普通 prop, 指向根标题元素, 不使用 forwardRef.
 *
 * .agents/notes/implemented/feature/2026-11-02-typography.md
 */
export function Display({
	as = TYPOGRAPHY_DEFAULTS.displayTag,
	size = TYPOGRAPHY_DEFAULTS.displaySize,
	weight,
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
	const slot = (props as { "data-slot"?: string })["data-slot"] ?? DEFAULT_SLOT;
	const weightClass = weight === undefined ? DISPLAY_WEIGHT_DEFAULT : DISPLAY_WEIGHT_CLASS[weight];
	return (
		<Tag
			{...props}
			ref={ref}
			lang={lang}
			data-slot={slot}
			data-size={size}
			data-weight={weight}
			data-tone={tone}
			data-cjk={dataFlag(isCjk)}
			data-balance={dataFlag(balance)}
			className={cn(
				DISPLAY_SIZE_CLASS[size],
				DISPLAY_RHYTHM_CLASS[size],
				weightClass,
				DISPLAY_BASE,
				DISPLAY_TONE_CLASS[tone],
				slotClass.root,
				className,
			)}
			style={{ ...slotStyle.root, ...style }}
		>
			{children}
		</Tag>
	);
}
