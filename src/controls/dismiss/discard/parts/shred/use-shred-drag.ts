// ShredBin 的卡片拖动: 跟手平移与按速度倾斜, 拖过刀口即待送入, 未送入时按中心位置上下重排.
import { useRef, type PointerEvent, type RefObject } from "react";
import { approach, clamp } from "../../../feel";
import { SHRED } from "../../../tokens";
import { feedArmed, moveItem, reorderIndex } from "../../discard-math";
import type { CardSim } from "./shred-sim";

const TWO = 2;
const MS = 1000;

interface Grab {
	id: string;
	x0: number;
	y0: number;
	vx: number;
	t: number;
	index: number;
	armed: boolean;
}

interface ShredDragOptions<T extends { readonly id: string }> {
	readonly sims: RefObject<Map<string, CardSim>>;
	readonly heights: RefObject<Map<string, number>>;
	readonly listRef: RefObject<T[]>;
	readonly slots: (order: readonly T[]) => number[];
	readonly slitY: number;
	readonly dragTilt: number;
	readonly lift: number;
	/** 不接受新拖动 (禁用或正在送入). */
	readonly blocked: () => boolean;
	readonly reorder: (moved: T[]) => void;
	readonly shred: (item: T) => void;
	readonly wake: () => void;
}

export interface ShredDrag<T> {
	readonly grab: RefObject<Grab | null>;
	readonly onPointerDown: (event: PointerEvent<HTMLDivElement>, item: T, index: number) => void;
	readonly onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
	readonly onPointerUp: (event: PointerEvent<HTMLDivElement>, item: T) => void;
}

export function useShredDrag<T extends { readonly id: string }>({ sims, heights, listRef, slots, slitY, dragTilt, lift, blocked, reorder, shred, wake }: ShredDragOptions<T>): ShredDrag<T> {
	const grab = useRef<Grab | null>(null);

	const onPointerDown = (event: PointerEvent<HTMLDivElement>, item: T, index: number): void => {
		if (blocked() || event.button !== 0) return;
		event.currentTarget.setPointerCapture?.(event.pointerId);
		grab.current = { id: item.id, x0: event.clientX, y0: event.clientY, vx: 0, t: event.timeStamp, index, armed: false };
		wake();
	};

	const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
		const d = grab.current;
		const sim = d && sims.current.get(d.id);
		if (!d || !sim) return;
		const dt = Math.max(SHRED.sliver, event.timeStamp - d.t) / MS;
		const nx = event.clientX - d.x0;
		d.vx = (nx - sim.dx) / dt;
		d.t = event.timeStamp;
		sim.dx = approach(sim.dx, nx, dt, 1 / SHRED.follow);
		sim.dy = event.clientY - d.y0;
		sim.tilt = approach(sim.tilt, clamp(d.vx / MS, -1, 1) * dragTilt, dt, SHRED.tauTilt);
		sim.lift = approach(sim.lift, lift, dt, SHRED.tauLift);
		const order = listRef.current;
		const tops = slots(order);
		const h = heights.current.get(d.id) ?? 0;
		const cardTop = sim.y.current + sim.dy;
		d.armed = feedArmed(cardTop + h - slitY, d.armed);
		const next = reorderIndex(d.index, cardTop + h / TWO, tops, h);
		if (next !== d.index && !d.armed) {
			const moved = moveItem(order, d.index, next);
			const landed = slots(moved)[next];
			sim.dy += sim.y.current - landed;
			sim.y.current = landed;
			d.y0 = event.clientY - sim.dy;
			d.index = next;
			reorder(moved);
		}
	};

	const onPointerUp = (event: PointerEvent<HTMLDivElement>, item: T): void => {
		const d = grab.current;
		grab.current = null;
		event.currentTarget.releasePointerCapture?.(event.pointerId);
		if (d?.armed) shred(item);
		wake();
	};

	return { grab, onPointerDown, onPointerMove, onPointerUp };
}
