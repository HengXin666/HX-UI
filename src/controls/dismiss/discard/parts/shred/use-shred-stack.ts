// ShredBin 卡片堆的布局状态: 元素与模拟表, 量高度, 按顺序排出各槽位顶边, 每次渲染后落位并唤醒逐帧循环.
import { useLayoutEffect, useRef, type RefObject } from "react";
import { snapAxis } from "../../../../../motion/drive/axis";
import { paintCard } from "./shred-paint";
import { newCardSim, type CardSim } from "./shred-sim";

export interface ShredStack<T> {
	readonly cards: RefObject<Map<string, HTMLDivElement>>;
	readonly sims: RefObject<Map<string, CardSim>>;
	readonly heights: RefObject<Map<string, number>>;
	/** 按 order 排出每张卡片的顶边. */
	readonly slots: (order: readonly T[]) => number[];
	/** 取卡片模拟, 没有就在 y 处新建 (第 born 张). */
	readonly simFor: (id: string, y: number, born: number) => CardSim;
}

export function useShredStack<T extends { readonly id: string }>(list: readonly T[], inset: number, gap: number, reduced: boolean, wake: () => void): ShredStack<T> {
	const cards = useRef(new Map<string, HTMLDivElement>());
	const sims = useRef(new Map<string, CardSim>());
	const heights = useRef(new Map<string, number>());

	const slots = (order: readonly T[]): number[] => {
		let y = inset;
		return order.map((item) => {
			const top = y;
			y += (heights.current.get(item.id) ?? 0) + gap;
			return top;
		});
	};

	const simFor = (id: string, y: number, born: number): CardSim => {
		let sim = sims.current.get(id);
		if (!sim) {
			sim = newCardSim(y, born);
			sims.current.set(id, sim);
		}
		return sim;
	};

	useLayoutEffect(() => {
		for (const item of list) {
			const el = cards.current.get(item.id);
			if (el) heights.current.set(item.id, el.offsetHeight);
		}
		const tops = slots(list);
		list.forEach((item, i) => {
			const sim = simFor(item.id, tops[i], i);
			if (reduced) {
				snapAxis(sim.y, tops[i]);
				sim.delay = 0;
			}
			paintCard(cards.current.get(item.id), sim);
		});
		wake();
	});

	return { cards, sims, heights, slots, simFor };
}
