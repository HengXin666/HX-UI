/**
 * 媒体组件共用的 slot 解析: 把 classNames / styles (对象或函数) 按当前状态展开成按 slot 取值的读取器.
 */
import type { CSSProperties } from "react";
import type { SlotClassNames, SlotStyles } from "../constants/media";

/** 按 slot 读取类名与内联样式. */
export interface SlotResolver<S extends string> {
	className: (slot: S) => string | undefined;
	style: (slot: S) => CSSProperties | undefined;
}

/**
 * 展开 classNames 与 styles. 函数形态只做纯计算 (契约 4.1), 这里每次渲染调用一次.
 *
 * .agents/notes/implemented/feature/2026-11-02-media-primitives.md
 */
export function resolveSlots<S extends string, State>(
	classNames: SlotClassNames<S, State> | undefined,
	styles: SlotStyles<S, State> | undefined,
	state: State,
): SlotResolver<S> {
	const names = typeof classNames === "function" ? classNames(state) : classNames;
	const inline = typeof styles === "function" ? styles(state) : styles;
	return {
		className: (slot) => names?.[slot],
		style: (slot) => inline?.[slot],
	};
}

/** 把根 style 合到 styles.root 之后 (契约 4.2: 根的 className / style 最后合并). */
export function mergeStyle(base: CSSProperties | undefined, own: CSSProperties | undefined): CSSProperties | undefined {
	if (!base) return own;
	if (!own) return base;
	return { ...base, ...own };
}

/** 数值夹在区间内. */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/** 先调调用方处理器, 未 preventDefault 时再跑内部处理器 (契约 7.2). */
export function composeEventHandlers<E extends { defaultPrevented: boolean }>(
	user: ((event: E) => void) | undefined,
	internal: (event: E) => void,
): (event: E) => void {
	return (event) => {
		user?.(event);
		if (!event.defaultPrevented) internal(event);
	};
}
