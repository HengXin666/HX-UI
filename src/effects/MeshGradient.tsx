"use client";

import type { ComponentPropsWithoutRef, CSSProperties, JSX } from "react";
import { EFFECT_DEFAULTS, EFFECT_HOST, EFFECT_LAYER, EFFECT_VAR, MESH_DEFAULT_TOKENS } from "../constants/effects";
import { cn } from "../primitives/utils";
import { meshLayers } from "./effect-color";

export interface MeshGradientProps extends ComponentPropsWithoutRef<"div"> {
	/** 语义令牌名, 每个一团径向光, 建议 3 个以上 ("primary", "accent-2", "success" ...). */
	readonly colors?: readonly string[];
	/** 强度 0..1, 决定每团光的令牌混入比例. */
	readonly intensity?: number;
	/** 光团缓慢漂移. 减弱动效时总是静止. */
	readonly animated?: boolean;
	/** 从中心向四周渐隐. */
	readonly fade?: boolean;
}

/**
 * 多色 mesh 背景: 多层 radial-gradient 叠加, 垫在子内容下面 (负 z-index + isolate).
 *
 * 拼色在 effect-color.ts 里完成, 只产出 var(--令牌) 与 color-mix; 这里把结果写到 --hx-mesh-layers,
 * effects.css 的 .hx-mesh::before 消费它. 漂移只动 transform; prefers-reduced-motion: reduce 时停在静止态.
 */
export function MeshGradient({
	colors = MESH_DEFAULT_TOKENS,
	intensity = EFFECT_DEFAULTS.meshIntensity,
	animated = true,
	fade = false,
	className,
	children,
	...props
}: MeshGradientProps): JSX.Element {
	const vars = { [EFFECT_VAR.meshLayers]: meshLayers(colors, intensity) } as CSSProperties;
	return (
		<div {...props} className={cn(EFFECT_HOST, className)}>
			<div
				aria-hidden
				className={cn(EFFECT_LAYER, "hx-mesh")}
				data-fade={fade || undefined}
				data-animated={animated || undefined}
				style={vars}
			/>
			{children}
		</div>
	);
}
