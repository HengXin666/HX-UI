/**
 * src/motion/clock: 四种驱动折成 0..1 的纯函数, 以及 useClock 的受控, 减弱动效与进视口播一次.
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CLOCK_DRIVER, clampUnit, elapsedProgress, loopProgress, scrollProgress, useClock } from "@src/motion";
import { manualFrames, mockReducedMotion } from "../controls/choice/support";

function refTo(el: Element | null) {
	return { current: el };
}

describe("纯函数", () => {
	it("clampUnit 钳到 0..1, NaN 按 0, 正无穷按 1", () => {
		expect(clampUnit(-1)).toBe(0);
		expect(clampUnit(0.4)).toBe(0.4);
		expect(clampUnit(3)).toBe(1);
		expect(clampUnit(Number.NaN)).toBe(0);
		expect(clampUnit(Number.POSITIVE_INFINITY)).toBe(1);
	});

	it("elapsedProgress 与 loopProgress", () => {
		expect(elapsedProgress(250, 1000)).toBe(0.25);
		expect(elapsedProgress(2000, 1000)).toBe(1);
		expect(elapsedProgress(5, 0)).toBe(1);
		expect(loopProgress(1250, 1000)).toBeCloseTo(0.25, 9);
		expect(loopProgress(-250, 1000)).toBeCloseTo(0.75, 9);
	});

	it("scrollProgress: 顶边进底边记 0, 底边出顶边记 1", () => {
		expect(scrollProgress(800, 400, 800)).toBe(0);
		expect(scrollProgress(-400, 400, 800)).toBe(1);
		expect(scrollProgress(200, 400, 800)).toBe(0.5);
	});
});

describe("useClock", () => {
	it("controlled: 跟随外部进度并钳住", () => {
		const el = document.createElement("div");
		const { result, rerender } = renderHook(({ p }) => useClock(refTo(el), { driver: CLOCK_DRIVER.controlled, progress: p }), {
			initialProps: { p: 0.3 },
		});
		expect(result.current.get()).toBe(0.3);
		rerender({ p: 1.5 });
		expect(result.current.get()).toBe(1);
	});

	it("减弱动效: 任何驱动都直接给 1", () => {
		mockReducedMotion(true);
		const el = document.createElement("div");
		const { result } = renderHook(() => useClock(refTo(el), { driver: CLOCK_DRIVER.view }));
		expect(result.current.get()).toBe(1);
	});

	it("view: 进视口后按时长播到 1 并停", () => {
		mockReducedMotion(false);
		const frames = manualFrames();
		let fire: (entries: Partial<IntersectionObserverEntry>[]) => void = () => {};
		const disconnect = vi.fn();
		vi.stubGlobal(
			"IntersectionObserver",
			class {
				constructor(cb: (entries: Partial<IntersectionObserverEntry>[]) => void) {
					fire = cb;
				}
				observe(): void {}
				disconnect = disconnect;
			},
		);
		const el = document.createElement("div");
		const { result } = renderHook(() => useClock(refTo(el), { durationMs: 160 }));
		expect(result.current.get()).toBe(0);
		act(() => fire([{ isIntersecting: true }]));
		expect(disconnect).toHaveBeenCalled();
		act(() => frames.flush(5, 16));
		expect(result.current.get()).toBeCloseTo(0.5, 6);
		act(() => frames.flush(10, 16));
		expect(result.current.get()).toBe(1);
		vi.unstubAllGlobals();
	});
});
