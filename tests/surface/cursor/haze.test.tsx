/**
 * cursor 族: HazeCursor (GhostCursor).
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HAZE, HazeCursor, hazeDecay, hazeSpring, makeHaze, puffHaze, puffRadius, stepHaze } from "@src/surface/cursor";
import { recordCanvas2d, useFakeClock } from "../helpers";
import { fixRect } from "./support";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

const tune = { inertia: 0.5, trailLength: 50, turbulence: 0.5, drift: 0.3, radius: 20 };

describe("HazeCursor 模拟", () => {
	it("规格常数与公式", () => {
		expect(HAZE).toMatchObject({ introS: 1.9, presenceIn: 0.12, presenceOut: 0.08, stiffScale: 520, stiffBase: 26, dampingRatio: 0.92, dragRate: 2.4, driftPx: 110, size: 80, trailLength: 50, inertia: 0.5 });
		expect(hazeSpring(0).stiffness).toBe(546);
		expect(hazeSpring(1).stiffness).toBe(26);
		expect(hazeDecay(0.1, 50)).toBeCloseTo(Math.exp(-0.1 / 1.22), 6);
		expect(puffRadius({ r: 10, amount: 0 })).toBeCloseTo(22, 6);
	});
	it("移动放烟, 烟团上漂, 停手后散尽", () => {
		const s = makeHaze(false);
		stepHaze(s, 0, 100, true, 1 / 60, tune, 1);
		for (let i = 1; i <= 30; i += 1) stepHaze(s, i * 6, 100, true, 1 / 60, tune, 1);
		expect(s.puffs.length).toBeGreaterThan(5);
		const y0 = s.puffs[0].y;
		for (let i = 0; i < 10; i += 1) stepHaze(s, 180, 100, false, 1 / 60, { ...tune, turbulence: 0 }, 1);
		expect(s.puffs[0].y).toBeLessThan(y0);
		for (let i = 0; i < 600; i += 1) stepHaze(s, 180, 100, false, 1 / 60, tune, 1);
		expect(s.puffs).toHaveLength(0);
		puffHaze(s, 14, 20, 1);
		expect(s.puffs).toHaveLength(14);
	});
});

describe("HazeCursor", () => {
	it("指针进来后画烟头与烟团", () => {
		useFakeClock();
		fixRect();
		const calls: string[] = [];
		const restore = recordCanvas2d(calls);
		const { container } = render(<HazeCursor intro={false}>hi</HazeCursor>);
		const host = container.querySelector("[data-slot=haze-cursor]") as HTMLElement;
		act(() => vi.advanceTimersByTime(32));
		fireEvent.pointerEnter(host, { clientX: 20, clientY: 20 });
		for (let i = 1; i < 10; i += 1) {
			fireEvent.pointerMove(host, { clientX: 20 + i * 12, clientY: 40 });
			act(() => vi.advanceTimersByTime(16));
		}
		expect(calls.filter((c) => c === "arc").length).toBeGreaterThan(5);
		restore();
	});
});
