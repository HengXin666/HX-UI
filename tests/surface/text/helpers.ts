/**
 * 文本族测试的公共夹具: 假时钟 (含 rAF 与 performance) 与减弱动效开关.
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

/** 假时钟: setTimeout, setInterval, rAF 与 performance.now 一起推进. */
export function useFakeClock(): void {
	vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
}
