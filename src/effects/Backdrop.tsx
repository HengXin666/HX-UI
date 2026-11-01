"use client";

import type { ComponentPropsWithoutRef, CSSProperties, JSX } from "react";
import { BACKDROP_VARIANT, EFFECT_DEFAULTS, EFFECT_HOST, EFFECT_LAYER, EFFECT_VAR, type BackdropVariant } from "../constants/effects";
import { cn } from "../primitives/utils";

export interface BackdropProps extends ComponentPropsWithoutRef<"div"> {
	/**
	 * 底纹种类:
	 * - grid: 1px 网格线, 适合工具型首屏与空状态
	 * - dots: 点阵, 比网格安静, 适合大面积铺底
	 * - aurora: 主色与辅色的柔光极光, 适合落地页首屏与强调区
	 */
	readonly variant?: BackdropVariant;
	/** grid 的格距与 dots 的点距 (px). aurora 不使用. */
	readonly size?: number;
	/** 从中心向四周渐隐, 避免底纹在边缘硬切. */
	readonly fade?: boolean;
	/** aurora 缓慢漂移. 减弱动效时总是静止. */
	readonly animated?: boolean;
}

/**
 * 背景底纹容器: 底纹是一层垫在子内容下面的装饰层 (负 z-index + isolate), 不影响子内容布局与点击.
 *
 * 线色与光色都由 effects.css 从语义令牌混出, 亮暗主题自动跟随; 这里只决定种类与尺寸.
 * aurora 的漂移只动 transform, 走合成线程, 不触发布局与重绘.
 */
export function Backdrop({
	variant = BACKDROP_VARIANT.grid,
	size = EFFECT_DEFAULTS.backdropSize,
	fade = true,
	animated = true,
	className,
	children,
	...props
}: BackdropProps): JSX.Element {
	return (
		<div {...props} className={cn(EFFECT_HOST, className)}>
			<div
				aria-hidden
				className={cn(EFFECT_LAYER, "hx-backdrop")}
				data-variant={variant}
				data-fade={fade || undefined}
				data-animated={animated || undefined}
				style={{ [EFFECT_VAR.backdropSize]: `${size}px` } as CSSProperties}
			/>
			{children}
		</div>
	);
}
