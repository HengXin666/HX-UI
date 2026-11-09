import { useEffect, useRef, type RefObject } from "react";

/**
 * 滚轮一格走一步. 要 passive: false 才能 preventDefault, React 的 onWheel 给不了, 只能原生绑定.
 * 监听只在挂上与 disabled 变化时绑一次; onStep 经 ref 读最新, 不随渲染反复解绑重绑.
 * 纵向滚动为主时往上算正, 横向为主时往右算正.
 */
export function useWheelStep(ref: RefObject<HTMLElement | null>, disabled: boolean, onStep: (direction: 1 | -1) => void): void {
	const latest = useRef(onStep);
	latest.current = onStep;
	useEffect(() => {
		const node = ref.current;
		if (!node || disabled) return undefined;
		const onWheel = (event: WheelEvent): void => {
			const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? -event.deltaY : event.deltaX;
			if (delta === 0) return;
			event.preventDefault();
			latest.current(delta > 0 ? 1 : -1);
		};
		node.addEventListener("wheel", onWheel, { passive: false });
		return () => node.removeEventListener("wheel", onWheel);
	}, [ref, disabled]);
}
