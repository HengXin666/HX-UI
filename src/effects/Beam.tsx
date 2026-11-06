"use client";

import type { ComponentPropsWithoutRef, CSSProperties, JSX } from "react";
import { EFFECT_DEFAULTS, EFFECT_LAYER, EFFECT_TOKEN_FALLBACK, EFFECT_VAR, PERCENT_MAX } from "../constants/effects";
import { cn } from "../primitives/utils";
import { tokenMix } from "./effect-color";

export interface BeamProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
	/** 光束偏转角 (deg), 0 为竖直向下. */
	readonly angle?: number;
	/** 光源横向位置 (%). */
	readonly x?: number;
	/** 光源纵向位置 (%). */
	readonly y?: number;
	/** 光束宽度 (px). */
	readonly width?: number;
	/** 取色的语义令牌名. */
	readonly color?: string;
	/** 强度 0..1. */
	readonly intensity?: number;
	/** 缓慢呼吸. 减弱动效时总是静止. */
	readonly animated?: boolean;
}

/**
 * 光束 / 光晕层: 从光源处投下一道模糊的锥形光, 光源处带一团光晕 (resend / supabase 式).
 *
 * 垫在内容下面 (z-index -1), 放进 isolate 宿主里使用: Backdrop, MeshGradient, GridLines 都是.
 * 颜色由令牌名经 effect-color.ts 混出, 写到 --hx-light-beam-color.
 * animated 的呼吸只动 opacity; prefers-reduced-motion: reduce 时停在静止态.
 */
export function Beam({
	angle = EFFECT_DEFAULTS.lightBeamAngle,
	x = EFFECT_DEFAULTS.lightBeamX,
	y = EFFECT_DEFAULTS.lightBeamY,
	width = EFFECT_DEFAULTS.lightBeamWidth,
	color = EFFECT_TOKEN_FALLBACK,
	intensity = EFFECT_DEFAULTS.lightBeamIntensity,
	animated = false,
	className,
	style,
	...props
}: BeamProps): JSX.Element {
	const vars = {
		[EFFECT_VAR.lightBeamAngle]: `${angle}deg`,
		[EFFECT_VAR.lightBeamX]: `${x}%`,
		[EFFECT_VAR.lightBeamY]: `${y}%`,
		[EFFECT_VAR.lightBeamWidth]: `${width}px`,
		[EFFECT_VAR.lightBeamColor]: tokenMix(color, intensity * PERCENT_MAX),
	};
	return (
		<span
			aria-hidden
			{...props}
			className={cn(EFFECT_LAYER, "hx-light-beam", className)}
			data-animated={animated || undefined}
			style={{ ...vars, ...style } as CSSProperties}
		/>
	);
}
