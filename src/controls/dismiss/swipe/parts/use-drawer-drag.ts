// DrawerRow 的横向拖动: 先判轴, 横向才接管; 拖动中跟手带阻尼, 越过 commitAt 震动提示; 松手按惯性投射决定开, 合或划走.
import { useRef, type PointerEvent, type RefObject } from "react";
import { snapAxis, type Axis } from "../../../../motion/drive/axis";
import { VelocityTracker } from "../../feel";
import { ROW } from "../../tokens";
import { rowDrag, rowRelease } from "../swipe-math";

const AXIS_X = "x";

interface Grip {
	id: number;
	x0: number;
	y0: number;
	base: number;
	axis: "x" | "y" | null;
	armed: boolean;
}

interface DrawerDragOptions {
	readonly x: RefObject<Axis>;
	readonly rootRef: RefObject<HTMLDivElement | null>;
	readonly sign: number;
	readonly drawer: number;
	readonly resistance: number;
	readonly fullSwipe: boolean;
	readonly commitAt: number;
	readonly haptic: boolean;
	readonly blocked: boolean;
	readonly paint: (value: number) => void;
	/** 横向接管时停掉正在跑的弹簧. */
	readonly halt: () => void;
	readonly reveal: (value: number) => void;
	readonly settle: (open: boolean, velocity: number) => void;
	readonly commit: () => void;
}

export interface DrawerDrag {
	readonly grip: RefObject<Grip | null>;
	readonly onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
	readonly onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
	readonly onPointerEnd: (event: PointerEvent<HTMLDivElement>) => void;
}

export function useDrawerDrag(o: DrawerDragOptions): DrawerDrag {
	const grip = useRef<Grip | null>(null);
	const tracker = useRef(new VelocityTracker());

	const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
		if (o.blocked || event.button !== 0) return;
		grip.current = { id: event.pointerId, x0: event.clientX, y0: event.clientY, base: o.x.current.current, axis: null, armed: false };
		tracker.current.reset();
		tracker.current.push(event.timeStamp, event.clientX, event.clientY);
	};

	const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
		const d = grip.current;
		if (!d || d.id !== event.pointerId) return;
		const dx = event.clientX - d.x0;
		const dy = event.clientY - d.y0;
		if (!d.axis) {
			if (Math.max(Math.abs(dx), Math.abs(dy)) < ROW.axisLockPx) return;
			d.axis = Math.abs(dx) > Math.abs(dy) ? AXIS_X : "y";
			if (d.axis === AXIS_X) {
				event.currentTarget.setPointerCapture?.(event.pointerId);
				o.halt();
			}
		}
		if (d.axis !== AXIS_X) return;
		tracker.current.push(event.timeStamp, event.clientX, event.clientY);
		const value = rowDrag(d.base + dx * o.sign, o.drawer, o.resistance, o.fullSwipe);
		const width = o.rootRef.current?.offsetWidth ?? 0;
		const armed = o.fullSwipe && width > 0 && value >= width * o.commitAt;
		if (armed !== d.armed && o.haptic) navigator.vibrate?.(ROW.hapticMs);
		d.armed = armed;
		snapAxis(o.x.current, value);
		o.paint(value);
		o.reveal(value);
	};

	const onPointerEnd = (event: PointerEvent<HTMLDivElement>): void => {
		const d = grip.current;
		grip.current = null;
		if (!d || d.axis !== AXIS_X) return;
		event.currentTarget.releasePointerCapture?.(event.pointerId);
		const v = tracker.current.velocity().x * o.sign;
		const width = o.rootRef.current?.offsetWidth ?? 0;
		const result = rowRelease(o.x.current.current, v, o.drawer, width, { commitAt: o.commitAt, fullSwipe: o.fullSwipe });
		if (result === "commit") o.commit();
		else o.settle(result === "open", v);
	};

	return { grip, onPointerDown, onPointerMove, onPointerEnd };
}
