/**
 * surface 层测试的公共夹具: 减弱动效开关, 假时钟, 窗口级指针事件.
 */
import { vi } from "vitest";

/** 打开或关闭 prefers-reduced-motion. 返回还原函数. */
export function mockReducedMotion(reduce: boolean): () => void {
	const original = window.matchMedia;
	window.matchMedia = ((query: string) => ({
		matches: reduce && query.includes("reduce"),
		media: query,
		onchange: null,
		addListener: () => undefined,
		removeListener: () => undefined,
		addEventListener: () => undefined,
		removeEventListener: () => undefined,
		dispatchEvent: () => false,
	})) as unknown as typeof window.matchMedia;
	return () => {
		window.matchMedia = original;
	};
}

/** 假时钟: setTimeout, rAF 与 performance.now 一起推进. */
export function useFakeClock(): void {
	vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
}

/** 在 window 上派发一个指针事件, target 给了就从它冒泡. */
export function pointer(type: string, clientX: number, clientY: number, target: EventTarget = window): void {
	const init = { clientX, clientY, bubbles: true };
	const event = typeof PointerEvent === "undefined" ? new MouseEvent(type, init) : new PointerEvent(type, init);
	target.dispatchEvent(event);
}

/** 给元素一个固定的布局矩形 (happy-dom 不排版). */
export function stubRect(el: Element, rect: { left: number; top: number; width: number; height: number }): void {
	(el as HTMLElement).getBoundingClientRect = () =>
		({ ...rect, x: rect.left, y: rect.top, right: rect.left + rect.width, bottom: rect.top + rect.height, toJSON: () => rect }) as DOMRect;
}
