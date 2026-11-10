/**
 * cursor 族: HazeCursor (GhostCursor).
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HAZE, HazeCursor, hazeDecay, hazeFade, hazeSplats, hazeSpring, makeHaze, puffHaze, puffRadius, stepHaze } from "@src/surface/cursor";
import { HAZE_SCENE, hazeFragment } from "@src/surface/cursor/parts/haze-shader";
import { mockIntersection, mockReducedMotion, mockWebgl2 } from "../backdrop/helpers";
import { useFakeClock } from "../helpers";
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

describe("HazeCursor 烟雾场", () => {
	it("新烟团打成溅点并从表里取走; 已取过的不再打", () => {
		const s = makeHaze(false);
		stepHaze(s, 0, 100, true, 1 / 60, tune, 1);
		for (let i = 1; i <= 30; i += 1) stepHaze(s, i * 6, 100, true, 1 / 60, tune, 1);
		const fit = { width: 200, height: 200, scale: 1 };
		const first = hazeSplats(s, 0, fit, { brightness: 1, simScale: HAZE.sim });
		expect(first.splats.length).toBeGreaterThan(3);
		expect(s.puffs).toHaveLength(0);
		expect(first.splats[0]?.dye[0]).toBeCloseTo(HAZE.puffBody);
		expect(hazeSplats(s, first.seq, fit, { brightness: 1, simScale: HAZE.sim }).splats).toHaveLength(0);
		puffHaze(s, 14, 20, 1);
		expect(hazeSplats(s, first.seq, fit, { brightness: 1, simScale: HAZE.sim }).splats).toHaveLength(14);
	});
	it("渐隐: 不给 delay 恒 1; 超过 delay 后按时长线性隐去", () => {
		expect(hazeFade(10, undefined, undefined)).toBe(1);
		expect(hazeFade(0.5, 1000, 500)).toBe(1);
		expect(hazeFade(1.25, 1000, 500)).toBeCloseTo(0.5);
		expect(hazeFade(3, 1000, 500)).toBe(0);
	});
	it("规格着色常数与接线", () => {
		expect(HAZE).toMatchObject({ wispLo: 0.18, wispHi: 0.82, wispGain: 2.8, cloudKnee: 0.32, cloudGain: 1.15, coverGain: 0.95, grainIntensity: 0.05, bloomStrength: 0.6, bloomRadius: 1, bloomThreshold: 0.025, edgeIntensity: 0 });
		expect(HAZE_SCENE).toContain("normalize(vec3(-0.35, 0.55, 0.75))");
		expect(HAZE_SCENE).toContain("smoothstep(0.7, 2.2, cloud)");
		expect(hazeFragment("")).toContain("* u_bloom * 0.6) * 0.95)");
	});
});

describe("HazeCursor", () => {
	it("挂上内核着色器通道, 指针移动后每帧画多遍", () => {
		useFakeClock();
		fixRect();
		const calls: string[] = [];
		const restore = [mockWebgl2(calls), mockReducedMotion(false)];
		mockIntersection();
		const { container } = render(<HazeCursor intro={false} edgeIntensity={0.5} fadeDelayMs={800}>hi</HazeCursor>);
		const host = container.querySelector("[data-slot=haze-cursor]") as HTMLElement;
		expect(host.dataset.backdropStatus).toBe("live");
		act(() => vi.advanceTimersByTime(32));
		fireEvent.pointerEnter(host, { clientX: 20, clientY: 20 });
		const before = calls.filter((c) => c === "drawArrays").length;
		for (let i = 1; i < 6; i += 1) {
			fireEvent.pointerMove(host, { clientX: 20 + i * 12, clientY: 40 });
			act(() => vi.advanceTimersByTime(16));
		}
		expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before + 8);
		restore.forEach((fn) => fn());
	});
});
