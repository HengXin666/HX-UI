/**
 * radiogroup 的 roving tabindex (WAI-ARIA Radio Group 模式): 组内只有一个 Tab 停靠点,
 * 方向键移动焦点并同时选中, 跳过禁用项并循环; Home / End 到首尾. RTL 下左右方向翻转.
 * .agents/notes/implemented/feature/2026-11-02-commerce-atoms.md
 */
import * as React from "react";

export interface RovingItem {
	value: string;
	disabled?: boolean;
}

export interface RovingApi {
	/** 给第 index 个按钮挂的 ref 回调. */
	register: (index: number) => (node: HTMLButtonElement | null) => void;
	/** 第 index 个按钮的 tabIndex: 已选项 (无已选时首个可用项) 为 0, 其余 -1. */
	tabIndexOf: (index: number) => 0 | -1;
	/** 挂在 radiogroup 根上. */
	onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
}

const KEYS = {
	left: "ArrowLeft",
	right: "ArrowRight",
	up: "ArrowUp",
	down: "ArrowDown",
	home: "Home",
	end: "End",
} as const;

export function useRoving(
	items: readonly RovingItem[],
	current: string | null,
	select: (index: number) => void,
	rtl = false,
): RovingApi {
	const nodes = React.useRef<(HTMLButtonElement | null)[]>([]);
	nodes.current.length = items.length;

	const enabled = (index: number): boolean => index >= 0 && index < items.length && !items[index].disabled;
	const selected = items.findIndex((item) => item.value === current);
	const stop = enabled(selected) ? selected : items.findIndex((item) => !item.disabled);

	/** 从 from 起按 step 方向找下一个可用项, 循环; 找不到返回 -1. */
	const next = (from: number, step: 1 | -1): number => {
		const total = items.length;
		for (let offset = 1; offset <= total; offset += 1) {
			const index = (((from + step * offset) % total) + total) % total;
			if (enabled(index)) return index;
		}
		return -1;
	};

	const move = (index: number): void => {
		if (index < 0) return;
		nodes.current[index]?.focus();
		select(index);
	};

	const onKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
		if (items.length === 0) return;
		const focused = nodes.current.findIndex((node) => node === event.target);
		const from = focused >= 0 ? focused : stop;
		const forward: 1 | -1 = rtl ? -1 : 1;
		let target: number;
		switch (event.key) {
			case KEYS.right:
				target = next(from, forward);
				break;
			case KEYS.left:
				target = next(from, forward === 1 ? -1 : 1);
				break;
			case KEYS.down:
				target = next(from, 1);
				break;
			case KEYS.up:
				target = next(from, -1);
				break;
			case KEYS.home:
				target = next(-1, 1);
				break;
			case KEYS.end:
				target = next(items.length, -1);
				break;
			default:
				return;
		}
		event.preventDefault();
		move(target);
	};

	return {
		register: (index) => (node) => {
			nodes.current[index] = node;
		},
		tabIndexOf: (index) => (index === stop ? 0 : -1),
		onKeyDown,
	};
}
