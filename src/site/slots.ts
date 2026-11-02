/**
 * 站点外壳零件共用的 classNames / styles 解析 (契约 4.2 合并顺序) 与链接属性助手.
 */
import type * as React from "react";
import { isFunction } from "../constants/hooks";
import { SITE_EXTERNAL } from "../constants/site";
import { cn, type ClassValue } from "../primitives/utils";

/** 按 slot 名覆盖类名; 函数形态接收组件公开状态. */
export type SlotClassNames<S extends string, State = void> =
	| Partial<Record<S, string>>
	| ((state: State) => Partial<Record<S, string>>);

/** 按 slot 名覆盖内联样式. */
export type SlotStyles<S extends string, State = void> =
	| Partial<Record<S, React.CSSProperties>>
	| ((state: State) => Partial<Record<S, React.CSSProperties>>);

/** 组件 props 里的 classNames 与 styles 两件套. */
export interface SlotProps<S extends string, State = void> {
	classNames?: SlotClassNames<S, State>;
	styles?: SlotStyles<S, State>;
}

/** 解析后的读取器: className(slot, 内置类, 部件或 root 自身的 className). */
export interface SlotResolver<S extends string> {
	className: (slot: S, base?: ClassValue, own?: ClassValue) => string;
	style: (slot: S, own?: React.CSSProperties) => React.CSSProperties | undefined;
}

function read<T>(value: T | ((state: unknown) => T) | undefined, state: unknown): T | undefined {
	return isFunction(value) ? (value as (s: unknown) => T)(state) : (value as T | undefined);
}

/**
 * 合并顺序: 内置类 < classNames[slot] < 部件自身 className (root 即根组件 className).
 * 纯计算, 每次渲染调用.
 */
export function resolveSlots<S extends string, State>(props: SlotProps<S, State>, state: State): SlotResolver<S> {
	const classes = read<Partial<Record<S, string>>>(props.classNames, state);
	const styles = read<Partial<Record<S, React.CSSProperties>>>(props.styles, state);
	return {
		className: (slot, base, own) => cn(base, classes?.[slot], own),
		style: (slot, own) => {
			const mine = styles?.[slot];
			return mine || own ? { ...mine, ...own } : undefined;
		},
	};
}

/** 外链时补 target 与 rel. */
export function linkTarget(external?: boolean): { target?: string; rel?: string } {
	return external ? { target: SITE_EXTERNAL.target, rel: SITE_EXTERNAL.rel } : {};
}

/** 当前页链接的 aria-current. */
export function currentPage(current?: boolean): "page" | undefined {
	return current ? "page" : undefined;
}
