/**
 * cursor 族: StreamerCursor (Ribbons).
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STREAMER, StreamerCursor, makeStreamers, ribbonOutline, stepStreamers, streamerFollow, streamerProfile, streamerSpring } from "@src/surface/cursor";
import { mockReducedMotion, recordCanvas2d, useFakeClock } from "../helpers";
import { fixRect } from "./support";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("StreamerCursor 模拟", () => {
	it("规格常数与公式", () => {
		expect(STREAMER).toMatchObject({ points: 50, stepS: 1 / 120, springBase: 0.03, springPow: 4, followBase: 0.183, rate: 60, thickness: 30, length: 1.4, spread: 18, stiffness: 0.5, bounce: 0.5 });
		expect(streamerSpring(0.5)).toBeCloseTo(0.03, 9);
		expect(streamerSpring(1)).toBeCloseTo(0.12, 9);
		expect(streamerFollow(1, 1 / 60)).toBeCloseTo(1 - 0.183, 9);
		expect(streamerProfile("comet", 1)).toBe(0);
		expect(streamerProfile("lens", 0.5)).toBe(1);
		expect(streamerProfile("even", 0.5)).toBe(1);
	});
	it("头部追上指针, 身体拖在后面; 轮廓左右各 51 点", () => {
		const s = makeStreamers(3);
		const o = { stiffness: 0.5, bounce: 0.5, length: 1.4, spread: 18 };
		stepStreamers(s, 0, 0, 1 / 60, o, 1);
		for (let i = 0; i < 20; i += 1) stepStreamers(s, i * 15, 0, 1 / 60, o, 1);
		const r = s.ribbons[0];
		expect(r.pts[49].x).toBeLessThan(r.head.x);
		expect(ribbonOutline(r, 15, "lens", 0, 0)).toHaveLength(102);
		for (let i = 0; i < 600; i += 1) stepStreamers(s, 300, 0, 1 / 60, o, 1);
		expect(Math.hypot(r.head.x - 318, r.head.y)).toBeLessThan(1);
		expect(ribbonOutline(r, 15, "lens", 0, 0)).toHaveLength(0);
	});
});

describe("StreamerCursor", () => {
	it("移动时每条彩带填一次; fade 时分段填; 减弱动效不画", () => {
		useFakeClock();
		fixRect();
		const calls: string[] = [];
		const restore = recordCanvas2d(calls);
		const { container } = render(<StreamerCursor tones={["primary", "link"]}>hi</StreamerCursor>);
		const host = container.querySelector("[data-slot=streamer-cursor]") as HTMLElement;
		fireEvent.pointerEnter(host, { clientX: 10, clientY: 10 });
		for (let i = 1; i < 10; i += 1) {
			fireEvent.pointerMove(host, { clientX: 10 + i * 15, clientY: 50 });
			act(() => vi.advanceTimersByTime(16));
		}
		calls.length = 0;
		fireEvent.pointerMove(host, { clientX: 190, clientY: 60 });
		act(() => vi.advanceTimersByTime(16));
		expect(calls.filter((c) => c === "fill")).toHaveLength(2);
		restore();
		const faded: string[] = [];
		const restore2 = recordCanvas2d(faded);
		const { container: c2 } = render(<StreamerCursor tones={["primary"]} fade>x</StreamerCursor>);
		const h2 = c2.querySelector("[data-slot=streamer-cursor]") as HTMLElement;
		fireEvent.pointerEnter(h2, { clientX: 10, clientY: 10 });
		for (let i = 1; i < 10; i += 1) {
			fireEvent.pointerMove(h2, { clientX: 10 + i * 15, clientY: 50 });
			act(() => vi.advanceTimersByTime(16));
		}
		expect(faded.filter((c) => c === "fill").length).toBeGreaterThan(10);
		restore2();
		const restoreMotion = mockReducedMotion(true);
		const still: string[] = [];
		const restore3 = recordCanvas2d(still);
		render(<StreamerCursor>x</StreamerCursor>);
		act(() => vi.advanceTimersByTime(48));
		expect(still).not.toContain("fill");
		restore3();
		restoreMotion();
	});
});
