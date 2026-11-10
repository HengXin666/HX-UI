/**
 * cursor 族: FlockCursor (SwarmCursor).
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FLOCK, FLOCK_STRIDE, FlockCursor, burstFlock, flockEase, flockGrab, makeFlock, stepFlock } from "@src/surface/cursor";
import { recordCanvas2d, useFakeClock } from "../helpers";
import { fixRect } from "./support";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

const tune = { spread: 90, speed: 1, swirl: 0.6, wander: 0 };

function centroid(s: ReturnType<typeof makeFlock>): readonly [number, number] {
	let x = 0;
	let y = 0;
	for (let i = 0; i < s.count; i += 1) {
		x += s.data[i * FLOCK_STRIDE];
		y += s.data[i * FLOCK_STRIDE + 1];
	}
	return [x / s.count, y / s.count];
}

describe("FlockCursor 模拟", () => {
	it("规格常数与公式", () => {
		expect(FLOCK).toMatchObject({ maxParticles: 2000, introS: 1.4, grabRate: 20, movingFull: 240, swirlFadeBase: 0.35, swirlFadeScale: 1.5, gather: 12, pull: 30, speedCap: 4000, speedBlend: 30, presenceTau: 0.25, size: 2.6, spread: 90 });
		expect(makeFlock(5000, 0.7).count).toBe(2000);
		expect(flockEase(0.5)).toBe(0.5);
		expect(flockGrab(1, 480, 1)).toBeCloseTo(1 - Math.exp(-20), 6);
		expect(flockGrab(1, 0, 1)).toBe(0);
	});
	it("群跟着指针走, 闲时漫游, 点击炸开", () => {
		const s = makeFlock(60, 0.7, 3, false);
		for (let i = 0; i < 240; i += 1) stepFlock(s, 300, 200, true, "roam", 600, 400, 1 / 60, tune, 1);
		const [cx, cy] = centroid(s);
		expect(Math.hypot(cx - 300, cy - 200)).toBeLessThan(40);
		const before = s.data[2];
		burstFlock(s, 300, 200, 90, 1);
		expect(s.data[2]).not.toBe(before);
		for (let i = 0; i < 120; i += 1) stepFlock(s, 0, 0, false, "roam", 600, 400, 1 / 60, tune, 1);
		expect(s.ax).not.toBe(0);
		expect(s.presence).toBeLessThan(0.01);
	});
});

describe("FlockCursor", () => {
	it("每帧把粒子并成路径填充; shape=streak 时描线", () => {
		useFakeClock();
		fixRect();
		const calls: string[] = [];
		const restore = recordCanvas2d(calls);
		const { container } = render(<FlockCursor count={50} accentTone="link">hi</FlockCursor>);
		const host = container.querySelector("[data-slot=flock-cursor]") as HTMLElement;
		fireEvent.pointerEnter(host, { clientX: 50, clientY: 50 });
		calls.length = 0;
		act(() => vi.advanceTimersByTime(32));
		expect(calls.filter((c) => c === "arc").length).toBeGreaterThanOrEqual(50);
		expect(calls).toContain("fill");
		fireEvent.pointerDown(host, { clientX: 50, clientY: 50 });
		act(() => vi.advanceTimersByTime(16));
		restore();
		const lines: string[] = [];
		const restore2 = recordCanvas2d(lines);
		render(<FlockCursor count={20} shape="streak">x</FlockCursor>);
		act(() => vi.advanceTimersByTime(32));
		expect(lines).toContain("stroke");
		restore2();
	});
});
