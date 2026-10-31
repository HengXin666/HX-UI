import { gestureDelta, type MotionPoint } from "./motion-math";

/**
 * 跟踪一次指针拖动, 回调里的位移相对按下点.
 * 返回解除监听的函数. 减弱动效不在这里吞掉位移, 否则控件拖不动.
 */
export function bindGesture(el: HTMLElement, onMove: (delta: MotionPoint) => void): () => void {
	let origin: MotionPoint | null = null;
	const down = (event: PointerEvent): void => {
		origin = { x: event.clientX, y: event.clientY };
		el.setPointerCapture?.(event.pointerId);
	};
	const move = (event: PointerEvent): void => {
		if (!origin) return;
		onMove(gestureDelta(origin, { x: event.clientX, y: event.clientY }));
	};
	const up = (): void => {
		origin = null;
	};
	el.addEventListener("pointerdown", down);
	el.addEventListener("pointermove", move);
	el.addEventListener("pointerup", up);
	el.addEventListener("pointercancel", up);
	return () => {
		el.removeEventListener("pointerdown", down);
		el.removeEventListener("pointermove", move);
		el.removeEventListener("pointerup", up);
		el.removeEventListener("pointercancel", up);
	};
}
