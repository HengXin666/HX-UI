// RipStub 的存根拖动: 平滑指针速度, 按阻力打折拉伸并偏转, 超过 stretch 撕下, 未撕松手给票身反冲.
import { useRef, type PointerEvent, type RefObject } from "react";
import { approach } from "../../../feel";
import { RIP } from "../../../tokens";
import { ripAngle, ripPull, ripTorn } from "../../discard-math";
import type { RipSim } from "./rip-sim";

const MS = 1000;

interface RipDragOptions {
	readonly sim: RefObject<RipSim>;
	readonly vertical: boolean;
	readonly torn: boolean;
	readonly holeSize: number;
	readonly resistance: number;
	readonly stretch: number;
	readonly tearAngle: number;
	readonly rotate: number;
	readonly wake: () => void;
	readonly tear: () => void;
}

interface Grip {
	id: number;
	x0: number;
	y0: number;
	px: number;
	py: number;
	t: number;
}

export interface RipDrag {
	/** 正在按住存根. */
	readonly grip: RefObject<Grip | null>;
	/** 拖过之后浏览器仍会补发 click, 用它区分键盘激活与拖动松手. */
	readonly dragged: RefObject<boolean>;
	readonly onStubDown: (event: PointerEvent<HTMLDivElement>) => void;
	readonly onStubMove: (event: PointerEvent<HTMLDivElement>) => void;
	readonly onStubUp: (event: PointerEvent<HTMLDivElement>) => void;
}

export function useRipDrag({ sim, vertical, torn, holeSize, resistance, stretch, tearAngle, rotate, wake, tear }: RipDragOptions): RipDrag {
	const grip = useRef<Grip | null>(null);
	const dragged = useRef(false);

	const onStubDown = (event: PointerEvent<HTMLDivElement>): void => {
		if (torn || event.button !== 0) return;
		event.currentTarget.setPointerCapture?.(event.pointerId);
		grip.current = { id: event.pointerId, x0: event.clientX, y0: event.clientY, px: event.clientX, py: event.clientY, t: event.timeStamp };
		dragged.current = false;
		wake();
	};

	const onStubMove = (event: PointerEvent<HTMLDivElement>): void => {
		const d = grip.current;
		if (!d || d.id !== event.pointerId) return;
		const s = sim.current;
		const pdt = Math.max(RIP.pointerMinDtS, (event.timeStamp - d.t) / MS);
		s.pvx += ((event.clientX - d.px) / pdt - s.pvx) * RIP.pointerSmooth;
		s.pvy += ((event.clientY - d.py) / pdt - s.pvy) * RIP.pointerSmooth;
		d.px = event.clientX;
		d.py = event.clientY;
		d.t = event.timeStamp;
		const dx = event.clientX - d.x0;
		const dy = event.clientY - d.y0;
		if (Math.hypot(dx, dy) > holeSize) dragged.current = true;
		const along = Math.max(0, vertical ? dy : dx);
		const pulled = Math.min(ripPull(along, resistance), stretch);
		const share = along > 0 ? pulled / along : 0;
		const angle = ripAngle(dx, dy, tearAngle, vertical);
		s.sx = approach(s.sx, dx * share, pdt, RIP.tauFollow);
		s.sy = approach(s.sy, dy * share, pdt, RIP.tauFollow);
		s.theta = approach(s.theta, angle * (pulled / Math.max(1, stretch)) + rotate * Math.sign(angle), pdt, RIP.tauAngle);
		if (ripTorn(along, resistance, stretch)) {
			grip.current = null;
			tear();
			wake();
		}
	};

	const onStubUp = (event: PointerEvent<HTMLDivElement>): void => {
		const d = grip.current;
		grip.current = null;
		if (!d) return;
		event.currentTarget.releasePointerCapture?.(event.pointerId);
		const s = sim.current;
		s.bv = -(vertical ? s.pvy : s.pvx) * RIP.retract;
		wake();
	};

	return { grip, dragged, onStubDown, onStubMove, onStubUp };
}
