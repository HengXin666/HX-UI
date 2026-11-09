/**
 * nav 族测试共用: 减弱动效开关, 可手动推进的 rAF 队列, Element.animate 探针.
 */
import { vi } from "vitest";

/** 让 prefers-reduced-motion 的查询返回给定值. */
export function mockReducedMotion(reduce: boolean): void {
	vi.spyOn(window, "matchMedia").mockImplementation(
		(query: string) =>
			({
				matches: reduce && query.includes("reduced-motion"),
				media: query,
				onchange: null,
				addListener: () => {},
				removeListener: () => {},
				addEventListener: () => {},
				removeEventListener: () => {},
				dispatchEvent: () => false,
			}) as unknown as MediaQueryList,
	);
}

/** 接管 requestAnimationFrame, 由 flush 按固定帧长推进. */
export function manualFrames(): { flush: (frames: number, frameMs?: number) => void } {
	let queue: FrameRequestCallback[] = [];
	let now = 0;
	vi.spyOn(performance, "now").mockImplementation(() => now);
	vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
		queue.push(cb);
		return queue.length;
	});
	vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
	return {
		flush: (frames, frameMs = 16) => {
			for (let i = 0; i < frames; i += 1) {
				now += frameMs;
				const run = queue;
				queue = [];
				run.forEach((cb) => cb(now));
			}
		},
	};
}

/** 给 Element.prototype 装一个 animate 探针并返回它. */
export function spyAnimate(): ReturnType<typeof vi.fn> {
	const fake = (): Animation =>
		({ cancel: () => {}, reverse: () => {}, playState: "finished", addEventListener: () => {}, removeEventListener: () => {} }) as unknown as Animation;
	const fn = vi.fn(fake);
	Object.defineProperty(Element.prototype, "animate", { configurable: true, writable: true, value: fn });
	return fn;
}
