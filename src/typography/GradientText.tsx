import type * as React from "react";
import {
	GRADIENT_DEFAULT,
	GRADIENT_STOP,
	GRADIENT_VAR,
	TYPOGRAPHY_DEFAULTS,
	resolveSlots,
	type GradientStop,
	type RootSlot,
	type SlotClassNames,
	type SlotStyles,
} from "../constants/typography";
import { cn } from "../primitives/utils";

/**
 * 渐变经 CSS 变量传入, 类名只读变量: bg-clip-text 把背景裁成字形, 文字本身透明.
 * 强制色模式 (高对比) 下背景图被丢弃, 退回系统文字色, 保证可读.
 */
const GRADIENT_BASE = cn(
	"bg-(image:--hx-text-gradient) bg-clip-text text-transparent [-webkit-text-fill-color:transparent]",
	"box-decoration-clone",
	"forced-colors:bg-none forced-colors:text-current forced-colors:[-webkit-text-fill-color:currentcolor]",
);

export interface GradientTextState {
	from: GradientStop | undefined;
	to: GradientStop | undefined;
}

export interface GradientTextProps extends Omit<React.ComponentProps<"span">, "data-slot"> {
	/** 起点色标 (语义令牌名). from 与 to 都不给时使用品牌渐变令牌 --gradient-brand. */
	from?: GradientStop;
	/** 可选中间色标. */
	via?: GradientStop;
	/** 终点色标. */
	to?: GradientStop;
	/** 渐变角度 (deg), 默认 135. */
	angle?: number;
	classNames?: SlotClassNames<RootSlot, GradientTextState>;
	styles?: SlotStyles<RootSlot, GradientTextState>;
}

/** 由语义色标拼出 linear-gradient; 只缺一端时另一端取主色. */
function buildGradient(from: GradientStop | undefined, via: GradientStop | undefined, to: GradientStop | undefined, angle: number): string {
	if (!from && !to) return GRADIENT_DEFAULT;
	const stops = [from ?? "primary", via, to ?? "primary"].filter(Boolean).map((s) => GRADIENT_STOP[s as string]);
	return `linear-gradient(${angle}deg, ${stops.join(", ")})`;
}

/**
 * GradientText: 文字渐变, 嵌在 Display 或正文里使用. 颜色只来自语义令牌, 不接受任意色值.
 * 遵循 docs/architecture/component-contract.md; ref 指向根 span. 无动画, 无需减弱动效分支.
 */
export function GradientText({
	from,
	via,
	to,
	angle = TYPOGRAPHY_DEFAULTS.gradientAngle,
	classNames,
	styles,
	className,
	style,
	ref,
	...props
}: GradientTextProps): React.JSX.Element {
	const state: GradientTextState = { from, to };
	const slotClass = resolveSlots(classNames, state);
	const slotStyle = resolveSlots(styles, state);
	const gradientStyle = { [GRADIENT_VAR]: buildGradient(from, via, to, angle) } as React.CSSProperties;
	return (
		<span
			{...props}
			ref={ref}
			data-slot="gradient-text"
			data-from={from}
			data-to={to}
			className={cn(GRADIENT_BASE, slotClass.root, className)}
			style={{ ...gradientStyle, ...slotStyle.root, ...style }}
		/>
	);
}
