"use client";

import { useId, type ComponentPropsWithoutRef, type JSX } from "react";
import { EFFECT_DEFAULTS, EFFECT_HOST, EFFECT_LAYER } from "../constants/effects";
import { cn } from "../primitives/utils";

export interface GridLinesProps extends ComponentPropsWithoutRef<"div"> {
	/** 格距 (px). */
	readonly size?: number;
	/** 每隔几格在交点放一个十字准星, 0 关闭. */
	readonly crossEvery?: number;
	/** 从中心向四周渐隐. */
	readonly fade?: boolean;
}

/** 半像素偏移: 1px 线落在像素格中间, 不糊成 2px. */
const HALF = 0.5;
/** 铺满宿主. */
const FILL_HOST = { width: "100%", height: "100%" } as const;
const STROKE_PROPS = { fill: "none", stroke: "currentColor", strokeWidth: 1, vectorEffect: "non-scaling-stroke" } as const;

/**
 * 网格线背景 + 交点十字准星 (vercel 式). 用一张内联 SVG 的两个 pattern 画:
 * 格线 pattern 每格画右上两条 1px 线, 准星 pattern 每 size*crossEvery 一个, 偏移单臂长让中心落在交点.
 * 线色走 currentColor, 由 effects.css 从语义令牌混出; 静态, 无动效.
 */
export function GridLines({
	size = EFFECT_DEFAULTS.gridLinesSize,
	crossEvery = EFFECT_DEFAULTS.gridCrossEvery,
	fade = true,
	className,
	children,
	...props
}: GridLinesProps): JSX.Element {
	const id = useId().replace(/[^\w-]/g, "");
	const gridId = `${id}-grid`;
	const crossId = `${id}-cross`;
	const arm = EFFECT_DEFAULTS.gridCrossArm;
	const step = size * Math.max(0, Math.floor(crossEvery));
	const mid = arm + HALF;
	return (
		<div {...props} className={cn(EFFECT_HOST, className)}>
			<svg aria-hidden className={cn(EFFECT_LAYER, "hx-grid-lines")} data-fade={fade || undefined} {...FILL_HOST}>
				<defs>
					<pattern id={gridId} width={size} height={size} patternUnits="userSpaceOnUse">
						<path d={`M ${size} ${HALF} H ${HALF} V ${size}`} {...STROKE_PROPS} />
					</pattern>
					{step > 0 && (
						<pattern id={crossId} x={-arm} y={-arm} width={step} height={step} patternUnits="userSpaceOnUse">
							<path d={`M 0 ${mid} H ${2 * arm + 1} M ${mid} 0 V ${2 * arm + 1}`} {...STROKE_PROPS} />
						</pattern>
					)}
				</defs>
				<rect {...FILL_HOST} fill={`url(#${gridId})`} />
				{step > 0 && <rect className="hx-grid-lines-cross" {...FILL_HOST} fill={`url(#${crossId})`} />}
			</svg>
			{children}
		</div>
	);
}
