// FlickNotice 的下划手势: 过阈值才起拖并暂停计时, 跟手带阻尼; 松手够远或够快就甩出淡掉, 否则弹回 (减弱动效时补间回位).
import { useRef, type PointerEvent, type RefObject } from "react";
import { snapAxis, type Axis } from "../../../../motion/drive/axis";
import { createFrameLoop } from "../../../../motion/frame/loop";
import { tween, VelocityTracker } from "../../feel";
import { NOTICE } from "../../tokens";
import { noticeDismissed, noticeDrag, noticeStarted } from "../swipe-math";

interface Grip {
	id: number;
	x0: number;
	y0: number;
	started: boolean;
}

interface NoticeDragOptions {
	readonly y: RefObject<Axis>;
	readonly cardRef: RefObject<HTMLDivElement | null>;
	/** 拖动中暂停引信. */
	readonly holds: RefObject<{ drag: boolean }>;
	readonly throwing: RefObject<boolean>;
	readonly fade: RefObject<{ start: number; active: boolean }>;
	/** 能否开始拖动 (可划走且已完全进场). */
	readonly enabled: boolean;
	readonly reduced: boolean;
	readonly swipeDistance: number;
	readonly paint: () => void;
	readonly wake: () => void;
	readonly finishSwipe: () => void;
}

export interface NoticeDrag {
	readonly onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
	readonly onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
	readonly onPointerEnd: (event: PointerEvent<HTMLDivElement>) => void;
}

export function useNoticeDrag(o: NoticeDragOptions): NoticeDrag {
	const grip = useRef<Grip | null>(null);
	const tracker = useRef(new VelocityTracker());

	const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
		if (!o.enabled || event.button !== 0) return;
		if ((event.target as HTMLElement).closest("button")) return;
		grip.current = { id: event.pointerId, x0: event.clientX, y0: event.clientY, started: false };
		tracker.current.reset();
		tracker.current.push(event.timeStamp, event.clientX, event.clientY);
	};

	const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
		const d = grip.current;
		if (!d || d.id !== event.pointerId) return;
		const dx = event.clientX - d.x0;
		const dy = event.clientY - d.y0;
		if (!d.started) {
			if (!noticeStarted(dx, dy)) return;
			d.started = true;
			o.holds.current.drag = true;
			event.currentTarget.setPointerCapture?.(event.pointerId);
		}
		tracker.current.push(event.timeStamp, event.clientX, event.clientY);
		snapAxis(o.y.current, noticeDrag(dy));
		o.paint();
	};

	/** 减弱动效时不用弹簧, 按 fadeMs 线性补间回 0. */
	const tweenHome = (from: number): void => {
		const start = performance.now();
		createFrameLoop(() => {
			const t = performance.now() - start;
			snapAxis(o.y.current, tween(from, 0, t, NOTICE.fadeMs));
			o.paint();
			return t < NOTICE.fadeMs;
		}).wake();
	};

	const onPointerEnd = (event: PointerEvent<HTMLDivElement>): void => {
		const d = grip.current;
		grip.current = null;
		o.holds.current.drag = false;
		if (!d?.started) return;
		event.currentTarget.releasePointerCapture?.(event.pointerId);
		const v = tracker.current.velocity().y;
		const y = o.y.current;
		const dy = y.current;
		if (noticeDismissed(dy, v, o.swipeDistance)) {
			if (o.reduced) {
				o.finishSwipe();
				return;
			}
			o.throwing.current = true;
			y.target = dy + (o.cardRef.current?.offsetHeight ?? 0);
			y.velocity = v;
			o.fade.current = { start: performance.now(), active: true };
		} else if (o.reduced) {
			tweenHome(dy);
			return;
		} else {
			y.target = 0;
			y.velocity = v;
		}
		o.wake();
	};

	return { onPointerDown, onPointerMove, onPointerEnd };
}
