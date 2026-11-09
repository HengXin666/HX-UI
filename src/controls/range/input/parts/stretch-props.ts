// 行为规格参照 docs/research/catalog/components-1.md 的 ElasticSlider 条目, 实现为 HX 自有.
/**
 * StretchSlider 的 props 与聚焦判定. 组件文件只留状态与绘制.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-range.md
 */
import type { ReactNode } from "react";

/** 只有键盘聚焦时轨道才变粗; 不认 :focus-visible 的环境按聚焦算. */
export function focusVisible(node: HTMLElement): boolean {
	try {
		return node.matches(":focus-visible");
	} catch {
		return true;
	}
}
/** 不给 radius 时的圆角 (px), 等价全圆. */
export const STRETCH_FULL_RADIUS = 9999;

export interface StretchSliderProps {
	readonly value?: number;
	readonly defaultValue?: number;
	readonly min?: number;
	readonly max?: number;
	/** 为 true 时指针取值吸附到 step; 否则连续取值, step 只给键盘与滚轮用. */
	readonly stepped?: boolean;
	readonly step?: number;
	readonly onChange?: (value: number) => void;
	/** 拖动松手, 键盘松键, 滚轮一格之后各报一次. */
	readonly onChangeEnd?: (value: number) => void;
	readonly orientation?: "horizontal" | "vertical";
	/** 低端图标. 给 null 不画. */
	readonly startIcon?: ReactNode;
	readonly endIcon?: ReactNode;
	readonly valuePosition?: "top" | "bottom" | "none";
	readonly formatValue?: (value: number) => string;
	/** stepped 时在每一步画刻度. */
	readonly ticks?: boolean;
	readonly thumb?: boolean;
	/** 填充的起点值. 不给时从 min 填. */
	readonly fillFrom?: number;
	/** 静止粗细 (px). */
	readonly thickness?: number;
	/** 激活时粗细 (px). */
	readonly activeThickness?: number;
	/** 圆角 (px). 不给时全圆. */
	readonly radius?: number;
	/** 静止时轨道不透明度, 激活时到 1. */
	readonly restOpacity?: number;
	readonly growOnHover?: boolean;
	/** 越界拉伸上限 (px). */
	readonly maxStretch?: number;
	/** 0 到 0.9, 回弹的弹性. */
	readonly bounce?: number;
	readonly disabled?: boolean;
	readonly ariaLabel?: string;
	readonly className?: string;
}

