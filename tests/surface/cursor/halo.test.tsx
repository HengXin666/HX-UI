/**
 * cursor 族: HaloCursor (GlowCursor).
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CURSOR_FLUID, HALO, HaloCursor, haloFollowTau, haloKeep, haloLayers, haloSplats, makeHalo, packSplats, stepHalo } from "@src/surface/cursor";
import { FLUID_PRESSURE_PASS, fluidDyePass, fluidVelocityPass } from "@src/surface/cursor/parts/fluid-shader";
import { HALO_SCENE, haloFragment } from "@src/surface/cursor/parts/halo-shader";
import { mockIntersection, mockReducedMotion, mockWebgl2 } from "../backdrop/helpers";
import { useFakeClock } from "../helpers";
import { fixRect } from "./support";

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

describe("HaloCursor 流体", () => {
	it("流体常数; 三通道保留率按 linger 分配 (热芯最快, 外晕最慢)", () => {
		expect(HALO).toMatchObject({ pressureSteps: 20, flow: 0.75, edgeFade: 0.02, grain: 0 });
		const [core, hot, wide] = haloKeep(0.1, 1.4);
		expect(hot).toBeLessThan(core);
		expect(core).toBeLessThan(wide);
		expect(core).toBeCloseTo(Math.exp((-0.1 * 4.6) / (1.4 * 0.8)), 6);
	});
	it("光头走过的线段打成溅点, 点击打径向溅点; 静止不打; 打包截到上限", () => {
		const fit = { width: 200, height: 100, scale: 1 };
		const t = { intensity: 1.3, trailWidth: 3, glow: 1.2, hotspot: 0.8, simScale: 0.4 };
		const moving = haloSplats({ x: 120, y: 50, energy: 0.8 }, { x: 100, y: 50 }, [], 1 / 60, fit, t);
		expect(moving).toHaveLength(1);
		expect(moving[0]?.ax).toBeCloseTo(0.5);
		expect(moving[0]?.bx).toBeCloseTo(0.6);
		expect(moving[0]?.vx).toBeGreaterThan(0);
		expect(Math.hypot(moving[0]?.vx ?? 0, moving[0]?.vy ?? 0)).toBeLessThanOrEqual(HALO.maxSpeed);
		expect(haloSplats({ x: 100, y: 50, energy: 0 }, { x: 100, y: 50 }, [], 1 / 60, fit, t)).toHaveLength(0);
		const burst = haloSplats({ x: 100, y: 50, energy: 0 }, { x: 100, y: 50 }, [{ x: 100, y: 50 }], 1 / 60, fit, t);
		expect(burst[0]?.kind).toBe(1);
		const many = packSplats(Array.from({ length: 30 }, () => burst[0]!));
		expect(many.count).toBe(CURSOR_FLUID.maxSplats);
		expect(many.seg).toHaveLength(CURSOR_FLUID.maxSplats * 4);
	});
	it("着色器接线", () => {
		expect(fluidVelocityPass(true)).toContain("uniform sampler2D u_press;");
		expect(fluidVelocityPass(false)).not.toContain("u_press");
		expect(FLUID_PRESSURE_PASS).toContain("u_keep");
		expect(fluidDyePass(true)).toContain("uniform vec3 u_keep;");
		expect(HALO_SCENE).toContain("1.0 - exp(-((energy * 1.1 + gas * 0.8) * u_intensity + halo * 0.25))");
		expect(HALO_SCENE).toContain("mix(0.95, 0.72, smoothstep(0.5, 3.0, energy))");
		expect(haloFragment("")).toContain("smoothstep(0.0, 0.02,");
	});
});

describe("HaloCursor", () => {
	it("挂上内核着色器通道, 指针移动后每帧画多遍; enabled=false 仍挂载", () => {
		useFakeClock();
		fixRect();
		const calls: string[] = [];
		const restore = [mockWebgl2(calls), mockReducedMotion(false)];
		mockIntersection();
		const { container, unmount } = render(<HaloCursor secondaryTone="link" quality="low">hi</HaloCursor>);
		const host = container.querySelector("[data-slot=halo-cursor]") as HTMLElement;
		expect(host.dataset.backdropStatus).toBe("live");
		act(() => vi.advanceTimersByTime(32));
		fireEvent.pointerEnter(host, { clientX: 20, clientY: 20 });
		const before = calls.filter((c) => c === "drawArrays").length;
		for (let i = 1; i < 6; i += 1) {
			fireEvent.pointerMove(host, { clientX: 20 + i * 15, clientY: 20 + i * 5 });
			act(() => vi.advanceTimersByTime(16));
		}
		expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before + 10);
		unmount();
		const { container: c2 } = render(<HaloCursor enabled={false}>x</HaloCursor>);
		expect(c2.querySelector("[data-slot=halo-cursor] canvas")).not.toBeNull();
		restore.forEach((fn) => fn());
	});
});
