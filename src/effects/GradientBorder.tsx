"use client";

import type { ComponentPropsWithoutRef, CSSProperties, JSX } from "react";
import { EFFECT_DEFAULTS, EFFECT_LAYER, EFFECT_VAR, GRADIENT_BORDER_DEFAULT_TOKENS } from "../constants/effects";
import { cn } from "../primitives/utils";
import { linearTokens } from "./effect-color";

export interface GradientBorderProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
	/** 渐变色标的语义令牌名, 按顺序排列. */
	readonly colors?: readonly string[];
	/** 渐变角度 (deg). */
	readonly angle?: number;
}

/**
 * 静态渐变描边: 叠在宿主的 1px 边框上.
 *
 * 与 BorderBeam 同一手法: `padding: 1px` 的渐变层加 mask 的 content-box 挖空, 只剩 1px 环,
 * 永远不比边框粗 (线条红线). 放进任意 `relative` 且带圆角的容器即可; 静态, 无动效.
 */
export function GradientBorder({
	colors = GRADIENT_BORDER_DEFAULT_TOKENS,
	angle = EFFECT_DEFAULTS.gradientBorderAngle,
	className,
	style,
	...props
}: GradientBorderProps): JSX.Element {
	const vars = { [EFFECT_VAR.gradientBorder]: linearTokens(colors, angle) };
	return <span aria-hidden {...props} className={cn(EFFECT_LAYER, "hx-gradient-border", className)} style={{ ...vars, ...style } as CSSProperties} />;
}
