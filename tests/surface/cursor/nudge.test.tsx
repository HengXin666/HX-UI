/**
 * cursor 族: NudgeGrid (CursorGrid).
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NUDGE, NudgeGrid, edgeAlpha, fitNudge, makeNudge, nudgeEase, stepNudge } from "@src/surface/cursor";
import { seededRandom } from "@src/surface/cursor/parts/common";
import { mockReducedMotion, recordCanvas2d, useFakeClock } from "../helpers";
import { fixRect } from "./support";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

const tune = { radius: 140, falloff: "smooth" as const, highlight: "area" as const, holdTime: 400, fadeDuration: 800, ambient: 0, pulseSpeed: 600, pulseReach: 1200 };

describe("NudgeGrid 模拟", () => {
	it("规格常数与默认值", () => {
		expect(NUDGE).toMatchObject({ introS: 1.4, followTau: 0.07, presenceTau: 0.25, attackTau: 0.045, ambientRate: 0.04, cellSize: 60, radius: 140, holdTime: 400, fadeDuration: 800, fillOpacity: 0.06, gridOpacity: 0.08, spotlight: 0.6, pulseSpeed: 600, edgeFade: 0.2 });
		expect(nudgeEase("smooth", 0.5)).toBe(0.5);
		expect(nudgeEase("sharp", 0.5)).toBe(0.125);
		expect(nudgeEase("linear", 2)).toBe(1);
		expect(edgeAlpha(0, 50, 200, 200, 0.2)).toBe(0);
		expect(edgeAlpha(100, 100, 200, 200, 0.2)).toBe(1);
	});
	it("指针下的格亮起, 离开后先停留再熄灭", () => {
		const s = makeNudge(false);
		fitNudge(s, 600, 300, 60);
		expect([s.cols, s.rows]).toEqual([10, 5]);
		const rand = seededRandom(1);
		for (let i = 0; i < 60; i += 1) stepNudge(s, 90, 90, true, 1 / 60, tune, rand);
		const i = 1 * 10 + 1;
		expect(s.level[i]).toBeGreaterThan(0.5);
		const lit = s.level[i];
		for (let k = 0; k < 12; k += 1) stepNudge(s, 590, 290, false, 1 / 60, { ...tune, radius: 1 }, rand);
		expect(s.level[i]).toBeCloseTo(lit, 1);
		for (let k = 0; k < 90; k += 1) stepNudge(s, 590, 290, false, 1 / 60, { ...tune, radius: 1 }, rand);
		expect(s.level[i]).toBe(0);
	});
	it("点击波经过的格被点亮; 环境闪格", () => {
		const s = makeNudge(false);
		fitNudge(s, 600, 600, 60);
		s.pulses.push({ x: 30, y: 30, age: 0 });
		for (let k = 0; k < 30; k += 1) stepNudge(s, 30, 30, false, 1 / 60, { ...tune, radius: 1 }, seededRandom(2));
		expect(Math.max(...s.level)).toBeGreaterThan(0.1);
		const q = makeNudge(false);
		fitNudge(q, 600, 600, 60);
		const rq = seededRandom(3);
		for (let k = 0; k < 120; k += 1) stepNudge(q, -500, -500, false, 1 / 60, { ...tune, ambient: 1, holdTime: 4000 }, rq);
		expect(Math.max(...q.level)).toBeGreaterThan(0.1);
	});
});

describe("NudgeGrid", () => {
	it("画网格与亮格, 四种网格样式都可画; 减弱动效只画静态网格", () => {
		useFakeClock();
		fixRect(300, 300);
		const calls: string[] = [];
		const restore = recordCanvas2d(calls);
		const { container } = render(<NudgeGrid intro={false} cellRadius={4}>hi</NudgeGrid>);
		const host = container.querySelector("[data-slot=nudge-grid]") as HTMLElement;
		fireEvent.pointerEnter(host, { clientX: 90, clientY: 90 });
		fireEvent.pointerMove(host, { clientX: 90, clientY: 90 });
		for (let i = 0; i < 10; i += 1) act(() => vi.advanceTimersByTime(16));
		expect(calls).toContain("lineTo");
		expect(calls).toContain("roundRect");
		expect(calls).toContain("clip");
		restore();
		for (const style of ["dashed", "dots", "crosses"] as const) {
			const c: string[] = [];
			const r = recordCanvas2d(c);
			render(<NudgeGrid gridStyle={style}>x</NudgeGrid>);
			act(() => vi.advanceTimersByTime(32));
			expect(c).toContain(style === "dots" ? "fill" : "stroke");
			r();
		}
		const restoreMotion = mockReducedMotion(true);
		const still: string[] = [];
		const r2 = recordCanvas2d(still);
		render(<NudgeGrid>x</NudgeGrid>);
		act(() => vi.advanceTimersByTime(32));
		expect(still).toContain("stroke");
		expect(still).not.toContain("rect");
		r2();
		restoreMotion();
	});
});
