"use client";

import type { ComponentPropsWithoutRef, CSSProperties, JSX } from "react";
import { BEAM_TONE, EFFECT_DEFAULTS, EFFECT_LAYER, EFFECT_VAR, type BeamTone } from "../constants/effects";
import { cn } from "../primitives/utils";

export interface BorderBeamProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
	/** 绕边一圈的时长 (秒). */
	readonly duration?: number;
	/** 起步延迟 (秒), 多个光束错开时用. */
	readonly delay?: number;
	/** 取色: primary 主色, accent 辅色. */
	readonly tone?: BeamTone;
	/** 逆时针流动. */
	readonly reverse?: boolean;
}

/**
 * 沿宿主 1px 边框流动的光.
 *
 * 放进任意 `relative` 且带圆角的容器里即可, 不改宿主的盒模型. 光束是一层 conic-gradient,
 * 用 `padding: 1px` 加 mask 的 content-box 挖空中间, 只留下与边框重合的 1px 环,
 * 所以永远不会比边框粗 (hx-beam 的样式在 effects.css). 减弱动效时停转, 退化为一圈淡色描边.
 */
export function BorderBeam({
	duration = EFFECT_DEFAULTS.beamDurationS,
	delay = 0,
	tone = BEAM_TONE.primary,
	reverse = false,
	className,
	style,
	...props
}: BorderBeamProps): JSX.Element {
	const vars = { [EFFECT_VAR.beamDuration]: `${duration}s`, [EFFECT_VAR.beamDelay]: `${delay}s` };
	return (
		<span
			aria-hidden
			{...props}
			className={cn(EFFECT_LAYER, "hx-beam", className)}
			data-tone={tone}
			data-reverse={reverse || undefined}
			style={{ ...vars, ...style } as CSSProperties}
		/>
	);
}
