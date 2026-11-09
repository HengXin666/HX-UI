/** ReelPicker 的竖向拖动: 过 slop 才起拖, 位置直接跟手, 两端阻尼, 松手按速度投出落到最近的行. */
import { useRef, type PointerEvent, type RefObject } from "react";
import type { SpringDriver } from "../../../../motion/drive/driver";
import { REEL_SLOP_PX, reelRubber } from "./reel-spec";

/** 松手速度 (行/秒) 往前投出的时长, 决定甩动落在哪一行. */
export const REEL_FLING_S = 0.12;
const MS_PER_S = 1000;

interface Drag {
	readonly y: number;
	readonly from: number;
	lastY: number;
	lastT: number;
	velocity: number;
	active: boolean;
}

interface ReelDragOptions {
	readonly driver: SpringDriver;
	readonly enabled: boolean;
	readonly loop: boolean;
	readonly count: number;
	/** 一行的像素高, 量不到时为 0. */
	readonly rowPx: () => number;
	/** 松手: 投出后的连续位置与速度 (行/秒). */
	readonly release: (projected: number, velocity: number) => void;
}

export interface ReelDrag {
	readonly dragging: RefObject<Drag | null>;
	/** 刚结束一次拖动, 下一次 click 吞掉. */
	readonly swallow: RefObject<boolean>;
	readonly onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
	readonly onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
	readonly endDrag: (cancelled: boolean) => void;
}

export function useReelDrag({ driver, enabled, loop, count, rowPx, release }: ReelDragOptions): ReelDrag {
	const drag = useRef<Drag | null>(null);
	const swallow = useRef(false);

	const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
		swallow.current = false;
		if (!enabled || event.button !== 0) return;
		drag.current = { y: event.clientY, from: driver.value, lastY: event.clientY, lastT: event.timeStamp, velocity: 0, active: false };
	};

	const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
		const g = drag.current;
		const row = rowPx();
		if (!g || row <= 0) return;
		const dy = event.clientY - g.y;
		if (!g.active) {
			if (Math.abs(dy) < REEL_SLOP_PX) return;
			g.active = true;
			event.currentTarget.setPointerCapture?.(event.pointerId);
		}
		const dt = event.timeStamp - g.lastT;
		if (dt > 0) g.velocity = (-(event.clientY - g.lastY) / row / dt) * MS_PER_S;
		g.lastY = event.clientY;
		g.lastT = event.timeStamp;
		const next = g.from - dy / row;
		driver.jump(loop ? next : reelRubber(next, count));
	};

	const endDrag = (cancelled: boolean): void => {
		const g = drag.current;
		drag.current = null;
		if (!g?.active) return;
		swallow.current = true;
		const velocity = cancelled ? 0 : g.velocity;
		release(driver.value + velocity * REEL_FLING_S, velocity);
	};

	return { dragging: drag, swallow, onPointerDown, onPointerMove, endDrag };
}
