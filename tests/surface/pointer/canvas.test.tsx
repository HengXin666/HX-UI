/**
 * pointer 族画布件: TapSparks (ClickSpark), ReticleLines (Crosshair). 接在 backdrop 内核的 Canvas2D 渲染器上.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReticleLines, makeReticle, reticleTau, stepReticle } from "@src/surface/pointer/ReticleLines";
import { TapSparks, burstLongest, pushBurst, sparkLife, sparkReach } from "@src/surface/pointer/TapSparks";
import { inkOf, toPixels } from "@src/surface/pointer/ink";
import { RETICLE, SPARK, SPARK_EASINGS } from "@src/surface/pointer/tokens";
import { mockReducedMotion, recordCanvas2d, stubRect, useFakeClock } from "../helpers";

afterEach(() => {
	vi.useRealTimers();
});

describe("ink", () => {
	it("sRGB 换成 color(srgb ...) 串, 归一化坐标换设备像素", () => {
		expect(inkOf([1, 0, 0], 0.5)).toBe("color(srgb 1.0000 0.0000 0.0000 / 0.5000)");
		expect(toPixels(0.25, 0.75, { width: 200, height: 100, scale: 2 })).toEqual([50, 25]);
	});
});

describe("TapSparks", () => {
	it("规格常数与三条曲线", () => {
		expect([SPARK.maxBursts, SPARK.gravity, SPARK.reducedMs]).toEqual([32, 500, 320]);
		expect(SPARK_EASINGS["ease-out"](1)).toBe(1);
		expect(SPARK_EASINGS["ease-in-out"](0.5)).toBeCloseTo(0.5, 6);
		expect(SPARK_EASINGS.spring(1)).toBe(1);
	});

	it("错峰上限: 寿命最多 1.25 倍, 距离最多 1.35 倍, 时长下限 60", () => {
		expect(sparkLife(500, 1, 1)).toBe(625);
		expect(sparkLife(10, 0, 0)).toBe(60);
		expect(burstLongest(500, 0.4)).toBeCloseTo(550, 6);
		expect(sparkReach(30, 1, 1, "ease-out")).toBeCloseTo(40.5, 6);
		expect(sparkReach(30, 0, 1, "spring")).toBeCloseTo(34.5, 6);
	});

	it("爆点数超上限时丢最早的", () => {
		let list: ReturnType<typeof pushBurst> = [];
		for (let i = 0; i < 40; i += 1) list = pushBurst(list, { x: i, y: 0, start: i, jitter: [0] });
		expect(list).toHaveLength(32);
		expect(list[0].x).toBe(8);
	});

	it("按下后画布上画出弧与线", () => {
		useFakeClock();
		const calls: string[] = [];
		const restore = recordCanvas2d(calls);
		const { container } = render(<TapSparks>hit</TapSparks>);
		const host = container.querySelector("[data-slot=tap-sparks]") as HTMLElement;
		expect(host.dataset.backdropStatus).toBe("live");
		stubRect(host, { left: 0, top: 0, width: 100, height: 100 });
		act(() => vi.advanceTimersByTime(32));
		fireEvent.pointerDown(host, { clientX: 50, clientY: 50 });
		calls.length = 0;
		act(() => vi.advanceTimersByTime(64));
		expect(calls).toContain("arc");
		expect(calls).toContain("lineTo");
		restore();
	});

	it("减弱动效: 不出火花", () => {
		const calls: string[] = [];
		const restore = recordCanvas2d(calls);
		const restoreMotion = mockReducedMotion(true);
		const { container } = render(<TapSparks>hit</TapSparks>);
		const host = container.querySelector("[data-slot=tap-sparks]") as HTMLElement;
		fireEvent.pointerDown(host, { clientX: 5, clientY: 5 });
		expect(calls).not.toContain("arc");
		restoreMotion();
		restore();
	});
});

describe("ReticleLines", () => {
	it("跟手时间常数与减弱动效贴手", () => {
		expect(reticleTau(0.35, false)).toBeCloseTo(0.008 + 0.35 * 0.16, 6);
		expect(reticleTau(0.35, true)).toBe(0);
		expect(RETICLE.pulseLife).toBe(0.55);
	});

	it("状态机: 一阶跟随, 锁框吸附, 脉冲到寿命回收", () => {
		const s = makeReticle();
		const target = { x: 10, y: 10, width: 40, height: 20 };
		stepReticle(s, 0.016, { x: 100, y: 50, inside: true, target, smoothing: 0.35, reduced: false });
		expect(s.x).toBeGreaterThan(0);
		expect(s.x).toBeLessThan(100);
		expect(s.lock.alpha).toBeGreaterThan(0);
		s.pulses.push({ x: 0, y: 0, age: 0.5 });
		stepReticle(s, 0.1, { x: 100, y: 50, inside: true, target: null, smoothing: 0.35, reduced: false });
		expect(s.pulses).toHaveLength(0);
		stepReticle(s, 0, { x: 7, y: 9, inside: false, target, smoothing: 0.35, reduced: true });
		expect([s.x, s.y, s.presence, s.lock.w]).toEqual([7, 9, 0, 40]);
	});

	it("hideCursor 挂 cursor-none, 画布叠在内容上且不接收指针", () => {
		const { container } = render(<ReticleLines hideCursor>x</ReticleLines>);
		const host = container.firstElementChild as HTMLElement;
		expect(host.className).toContain("cursor-none");
		const canvas = host.querySelector("canvas") as HTMLElement;
		expect(canvas.className).toContain("pointer-events-none");
		expect(canvas.className).toContain("z-10");
	});
});
