"use client";

import type { ComponentPropsWithoutRef, CSSProperties, JSX } from "react";
import { EFFECT_DEFAULTS, EFFECT_LAYER, EFFECT_VAR, GRAIN_BLEND, type GrainBlend } from "../constants/effects";
import { cn } from "../primitives/utils";
import { clamp } from "./effect-color";

export interface GrainProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
	/** 颗粒不透明度 0..1. */
	readonly opacity?: number;
	/** 与下层的混合方式. */
	readonly blend?: GrainBlend;
}

/**
 * 噪点颗粒叠加层. 放在任意 `relative` 宿主的最后一个子元素, 盖在内容上方但不接收指针.
 *
 * 噪声是 effects.css 里内联的 SVG feTurbulence data URI (去饱和为灰阶, 不引图片, 不含色值);
 * 颗粒是静态的, 不涉及动效.
 */
export function Grain({
	opacity = EFFECT_DEFAULTS.grainOpacity,
	blend = GRAIN_BLEND.overlay,
	className,
	style,
	...props
}: GrainProps): JSX.Element {
	const vars = { [EFFECT_VAR.grainOpacity]: String(clamp(opacity, 0, 1)), mixBlendMode: blend };
	return <span aria-hidden {...props} className={cn(EFFECT_LAYER, "hx-grain", className)} style={{ ...vars, ...style } as CSSProperties} />;
}
