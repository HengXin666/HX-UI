/**
 * cursor 族: HaloCursor (GlowCursor).
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HALO, HaloCursor, haloFollowTau, haloLayers, makeHalo, stepHalo } from "@src/surface/cursor";
import { recordCanvas2d, useFakeClock } from "../helpers";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("HaloCursor 模拟", () => {
	it("规格常数与默认值", () => {
		expect(HALO).toMatchObject({ calmRate: 1.2, lingerRate: 4.6, lingerCore: 0.8, lingerHot: 0.2, lingerWide: 1.2, intensity: 1.3, trailWidth: 3, linger: 1.4, glow: 1.2, hotspot: 0.8, followSpeed: 0.6 });
	});
	it("三层余辉: 热芯最快, 外晕最慢", () => {
		const [wide, core, hot] = haloLayers(0.5, 1.4);
		expect(hot).toBeLessThan(core);
		expect(core).toBeLessThan(wide);
		expect(haloLayers(0, 1.4)).toEqual([1, 1, 1]);
		expect(haloFollowTau(1)).toBeCloseTo(0.01, 6);
		expect(haloFollowTau(0)).toBeCloseTo(0.13, 6);
	});
	it("移动时按间距留点, 停下后点按寿命回收", () => {
		const s = makeHalo();
		stepHalo(s, 0, 0, 1 / 60, 1, 0.5, 1);
		for (let i = 1; i <= 30; i += 1) stepHalo(s, i * 10, 0, 1 / 60, 1, 0.5, 1);
		expect(s.points.length).toBeGreaterThan(10);
		expect(s.energy).toBeGreaterThan(0.3);
		for (let i = 0; i < 60; i += 1) stepHalo(s, 300, 0, 1 / 60, 1, 0.5, 1);
		expect(s.points.length).toBe(1);
	});
});

describe("HaloCursor", () => {
	it("移动后画光带与热点, 点击出光环; enabled=false 不画", () => {
		useFakeClock();
		const box = { left: 0, top: 0, width: 200, height: 200, x: 0, y: 0, right: 200, bottom: 200, toJSON: () => ({}) } as DOMRect;
		vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(box);
		const calls: string[] = [];
		const restore = recordCanvas2d(calls);
		const { container } = render(<HaloCursor secondaryTone="link">hi</HaloCursor>);
		const host = container.querySelector("[data-slot=halo-cursor]") as HTMLElement;
		act(() => vi.advanceTimersByTime(32));
		fireEvent.pointerEnter(host, { clientX: 20, clientY: 20 });
		for (let i = 1; i < 8; i += 1) {
			fireEvent.pointerMove(host, { clientX: 20 + i * 15, clientY: 20 + i * 5 });
			act(() => vi.advanceTimersByTime(16));
		}
		expect(calls).toContain("lineTo");
		expect(calls).toContain("arc");
		fireEvent.pointerDown(host, { clientX: 120, clientY: 50 });
		calls.length = 0;
		act(() => vi.advanceTimersByTime(32));
		expect(calls.filter((c) => c === "stroke").length).toBeGreaterThan(0);
		restore();
		const off: string[] = [];
		const restore2 = recordCanvas2d(off);
		render(<HaloCursor enabled={false}>x</HaloCursor>);
		act(() => vi.advanceTimersByTime(64));
		expect(off).not.toContain("arc");
		restore2();
	});
});
