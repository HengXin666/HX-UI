// StashFolder 的纸片拖动: 过 dragMin 才起拖, 限制在文件夹上方的活动区内; 没拖动的松手算选中, 拖过的松手回到槽位.
import { useRef, type PointerEvent, type RefObject } from "react";
import { clamp, snapAxis, type Axis } from "../../feel";
import { STASH } from "../../tokens";
import type { ChipSlot } from "../evade-math";

const TWO = 2;

export interface StashChip {
	x: Axis;
	y: Axis;
	phase: number;
	mass: number;
}

interface Hold {
	index: number;
	x0: number;
	y0: number;
	moved: boolean;
	bx: number;
	by: number;
}

interface StashDragOptions<I> {
	readonly chips: RefObject<StashChip[]>;
	readonly slots: readonly ChipSlot[];
	readonly spread: number;
	readonly lift: number;
	/** 漂移物理在跑时由逐帧循环带回槽位, 否则松手直接落位. */
	readonly live: boolean;
	readonly paint: (i: number) => void;
	readonly select: (item: I, i: number) => void;
}

export interface StashDrag<I> {
	readonly hold: RefObject<Hold | null>;
	readonly onChipDown: (event: PointerEvent<HTMLButtonElement>, i: number) => void;
	readonly onChipMove: (event: PointerEvent<HTMLButtonElement>, i: number) => void;
	readonly onChipUp: (event: PointerEvent<HTMLButtonElement>, item: I, i: number) => void;
	readonly cancel: () => void;
}

export function useStashDrag<I>({ chips, slots, spread, lift, live, paint, select }: StashDragOptions<I>): StashDrag<I> {
	const hold = useRef<Hold | null>(null);

	const onChipDown = (event: PointerEvent<HTMLButtonElement>, i: number): void => {
		if (event.button !== 0) return;
		const chip = chips.current[i];
		hold.current = { index: i, x0: event.clientX, y0: event.clientY, moved: false, bx: chip.x.current, by: chip.y.current };
	};

	const onChipMove = (event: PointerEvent<HTMLButtonElement>, i: number): void => {
		const d = hold.current;
		if (!d || d.index !== i) return;
		const dx = event.clientX - d.x0;
		const dy = event.clientY - d.y0;
		if (!d.moved && Math.hypot(dx, dy) < STASH.dragMin) return;
		if (!d.moved) event.currentTarget.setPointerCapture?.(event.pointerId);
		d.moved = true;
		const chip = chips.current[i];
		const zoneX = spread / TWO + STASH.zonePad;
		const zoneTop = -(lift + STASH.row * Math.max(1, slots.length)) - STASH.zonePad;
		snapAxis(chip.x, clamp(d.bx + dx, -zoneX, zoneX));
		snapAxis(chip.y, clamp(d.by + dy, zoneTop, STASH.zonePad));
		paint(i);
	};

	const onChipUp = (event: PointerEvent<HTMLButtonElement>, item: I, i: number): void => {
		const d = hold.current;
		hold.current = null;
		if (!d || d.index !== i) return;
		event.currentTarget.releasePointerCapture?.(event.pointerId);
		if (!d.moved) {
			select(item, i);
			return;
		}
		const chip = chips.current[i];
		chip.x.target = slots[i].x;
		chip.y.target = slots[i].y;
		if (!live) {
			snapAxis(chip.x, slots[i].x);
			snapAxis(chip.y, slots[i].y);
			paint(i);
		}
	};

	const cancel = (): void => {
		hold.current = null;
	};

	return { hold, onChipDown, onChipMove, onChipUp, cancel };
}
