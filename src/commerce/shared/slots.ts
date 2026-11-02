/**
 * 商业原子共用的插槽工具 (契约第 4 节): classNames / styles 类型, 合并解析, data-slot 命名, data 布尔属性.
 * .agents/notes/implemented/feature/2026-11-02-commerce-atoms.md
 */
import type * as React from "react";
import { cn, type ClassValue } from "../../primitives/utils";

/** 按 slot 覆盖类名; 函数形态接收组件公开状态 (契约 4.1). */
export type SlotClassNames<S extends string, State = void> =
	| Partial<Record<S, string>>
	| ((state: State) => Partial<Record<S, string>>);

/** 按 slot 覆盖内联样式; 函数形态接收组件公开状态 (契约 4.1). */
export type SlotStyles<S extends string, State = void> =
	| Partial<Record<S, React.CSSProperties>>
	| ((state: State) => Partial<Record<S, React.CSSProperties>>);

/** 组件 props 里的插槽覆盖字段. */
export interface SlotProps<S extends string, State = void> {
	classNames?: SlotClassNames<S, State>;
	styles?: SlotStyles<S, State>;
}

/** resolveSlots 的入参: 插槽覆盖 + 根元素的 className / style. */
export interface SlotInput<S extends string, State> extends SlotProps<S, State> {
	className?: string;
	style?: React.CSSProperties;
}

/** 解析后的取值器: 每个部件按 slot 名取最终类名与样式. */
export interface SlotResolver<S extends string> {
	className: (slot: S, ...base: ClassValue[]) => string;
	style: (slot: S, base?: React.CSSProperties) => React.CSSProperties | undefined;
}

const ROOT = "root";

/**
 * 按契约 4.2 的顺序合并: 内置类 → classNames[slot] → (root) className; 样式同理, 后者覆盖前者.
 * 函数形态只在这里调用一次, 纯计算.
 */
export function resolveSlots<S extends string, State>(input: SlotInput<S, State>, state: State): SlotResolver<S> {
	const classMap = typeof input.classNames === "function" ? input.classNames(state) : input.classNames;
	const styleMap = typeof input.styles === "function" ? input.styles(state) : input.styles;
	return {
		className: (slot, ...base) => cn(...base, classMap?.[slot], slot === ROOT && input.className),
		style: (slot, base) => {
			const own = styleMap?.[slot];
			const root = slot === ROOT ? input.style : undefined;
			if (!base && !own && !root) return undefined;
			return { ...base, ...own, ...root };
		},
	};
}

/** data-slot 取值 (契约 4.4): root 为组件名本身, 其余为 <组件名>-<slot>. */
export function slotName(component: string, slot: string): string {
	return slot === ROOT ? component : `${component}-${slot}`;
}

/** data 布尔属性 (契约 5.2): 真时写空字符串, 假时不写. */
export function dataFlag(value: boolean | undefined): "" | undefined {
	return value ? "" : undefined;
}
