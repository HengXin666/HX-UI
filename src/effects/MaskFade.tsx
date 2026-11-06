"use client";

import type { ComponentPropsWithoutRef, CSSProperties, JSX } from "react";
import { EFFECT_VAR, MASK_FADE_DIRECTION, type MaskFadeDirection } from "../constants/effects";
import { cn } from "../primitives/utils";

export interface MaskFadeProps extends ComponentPropsWithoutRef<"div"> {
	/** 淡出的边: top / bottom / left / right, x (左右), y (上下), radial (四周). */
	readonly direction?: MaskFadeDirection;
	/** 淡出长度: 数字按 px, 字符串为任意 CSS 长度. 不传读主题的 --mask-fade 令牌. */
	readonly length?: number | string;
}

/**
 * 边缘淡出遮罩容器: 用 mask-image 让子内容在指定边渐隐到透明 (clerk / nextjs 式).
 *
 * 遮罩只用 alpha, 与颜色无关, 亮暗主题都成立; 长度写到 --mask-fade, 规则在 effects.css 的
 * .hx-mask-fade[data-direction]. 遮罩是静态的, 不涉及动效.
 */
export function MaskFade({
	direction = MASK_FADE_DIRECTION.bottom,
	length,
	className,
	style,
	...props
}: MaskFadeProps): JSX.Element {
	const vars: Record<string, string> = {};
	if (length !== undefined) vars[EFFECT_VAR.maskFade] = typeof length === "number" ? `${length}px` : length;
	return (
		<div {...props} className={cn("hx-mask-fade", className)} data-direction={direction} style={{ ...vars, ...style } as CSSProperties} />
	);
}
