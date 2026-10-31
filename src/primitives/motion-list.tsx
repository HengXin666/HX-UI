"use client";

import { useLayoutEffect, useRef, type JSX, type ReactNode } from "react";
import { playLayout, readLayout, type LayoutBox } from "./motion";
import { retainedIds } from "./motion-math";

export interface MotionListItem {
	readonly id: string;
}

/**
 * 按 id 保持身份的列表. 换位时每一项从自己的上一帧滑到新格子, 新来的项没有上一帧, 不滑.
 * 子节点由调用方画, 本组件只负责那一下相对位移.
 */
export function MotionList<T extends MotionListItem>({
	items,
	children,
	className,
}: {
	items: readonly T[];
	children: (item: T) => ReactNode;
	className?: string;
}): JSX.Element {
	const ref = useRef<HTMLUListElement>(null);
	const previous = useRef(new Map<string, LayoutBox>());
	const signature = items.map((item) => item.id).join("|");

	useLayoutEffect(() => {
		const root = ref.current;
		if (!root) return;
		const next = new Map<string, LayoutBox>();
		const ids = items.map((item) => item.id);
		const keep = new Set(retainedIds([...previous.current.keys()], ids));
		for (const node of root.querySelectorAll<HTMLElement>("[data-layout-id]")) {
			const id = node.dataset.layoutId;
			if (!id) continue;
			if (keep.has(id)) playLayout(node, previous.current.get(id));
			next.set(id, readLayout(node));
		}
		previous.current = next;
	}, [signature]);

	return (
		<ul ref={ref} className={className}>
			{items.map((item) => (
				<li key={item.id} data-layout-id={item.id}>
					{children(item)}
				</li>
			))}
		</ul>
	);
}
