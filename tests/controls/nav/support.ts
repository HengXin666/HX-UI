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
	const fake = (): Animation => {
		const listeners = new Map<string, Set<EventListener>>();
		const animation = {
			cancel: () => {},
			reverse: () => {},
			/** 打断时组件会 finish(): 立即落到终点并派发 finish 事件. */
			finish: vi.fn(() => {
				for (const cb of listeners.get("finish") ?? []) cb(new Event("finish"));
			}),
			playState: "finished",
			addEventListener: (type: string, cb: EventListener) => {
				const set = listeners.get(type) ?? new Set<EventListener>();
				set.add(cb);
				listeners.set(type, set);
			},
			removeEventListener: (type: string, cb: EventListener) => {
				listeners.get(type)?.delete(cb);
			},
		};
		return animation as unknown as Animation;
	};
	const fn = vi.fn(fake);
	Object.defineProperty(Element.prototype, "animate", { configurable: true, writable: true, value: fn });
	return fn;
}
