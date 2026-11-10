/**
 * cursor 族: MeldCursor (BlobCursor). 接在 backdrop 内核的 Canvas2D 渲染器上.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MELD, MeldCursor, makeMeld, massAfterSplash, meldSpring, regrowMass, splashMeld, stepMeld } from "@src/surface/cursor";
import { integrate, noise1, seededRandom } from "@src/surface/cursor/parts/common";
import { mockReducedMotion, recordCanvas2d, stubRect, useFakeClock } from "../helpers";

afterEach(() => {
	vi.useRealTimers();
});

describe("cursor 共用", () => {
	it("弹簧积分收敛, 噪声在 -1..1, 随机数可复现", () => {
		const b = { x: 0, y: 0, vx: 0, vy: 0 };
		for (let i = 0; i < 120; i += 1) integrate(b, 100, 50, 300, 2 * Math.sqrt(300), 1 / 60, 1 / 240);
		expect(b.x).toBeCloseTo(100, 1);
		expect(b.y).toBeCloseTo(50, 1);
		for (let t = 0; t < 20; t += 0.37) expect(Math.abs(noise1(t))).toBeLessThanOrEqual(1);
		const a = seededRandom(7);
		const c = seededRandom(7);
		expect([a(), a()]).toEqual([c(), c()]);
	});
});

describe("MeldCursor 模拟", () => {
	it("规格常数", () => {
		expect(MELD).toMatchObject({ maxTrail: 16, maxDrops: 96, massFloor: 0.2, massLossScale: 2.4, massLossMin: 0.25, massLossMax: 0.7, massWaitS: 0.28, regrowSlow: 0.9, regrowFast: 6, massCap: 1.35, size: 140, morphSpeed: 0.4, lag: 0.55, stretch: 0.6 });
	});
	it("质量: 溅出扣减有上下限, 等待后回长", () => {
		expect(massAfterSplash(1, 0.01)).toBeCloseTo(0.75, 6);
		expect(massAfterSplash(1, 1)).toBeCloseTo(0.3, 6);
		expect(massAfterSplash(0.3, 1)).toBe(0.2);
		expect(regrowMass(0.5, 0.1, 0.05, 0.5)).toEqual({ mass: 0.5, wait: 0.1 - 0.05 });
		const g = regrowMass(0.5, 0, 0.1, 1);
		expect(g.mass).toBeCloseTo(0.5 + 0.5 * (1 - Math.exp(-0.6)), 6);
	});
	it("lag 越大头部越软", () => {
		expect(meldSpring(0).stiffness).toBe(600);
		expect(meldSpring(1).stiffness).toBe(60);
	});
	it("头部追上指针, 尾链长度跟 trail, 溅滴寿命走完被回收", () => {
		const s = makeMeld();
		const o = { lag: 0.55, trail: 8, morphSpeed: 0.4, regrow: 0.5, splashGravity: 0 };
		stepMeld(s, 0, 0, 1 / 60, o, 1);
		for (let i = 0; i < 180; i += 1) stepMeld(s, 200, 100, 1 / 60, o, 1);
		expect(s.head.x).toBeCloseTo(200, 0);
		expect(s.trail).toHaveLength(8);
		splashMeld(s, 6, 0.5, 0.5, 70, 1, seededRandom(1));
		expect(s.drops).toHaveLength(6);
		expect(s.mass).toBeCloseTo(0.7, 6);
		for (let i = 0; i < 70; i += 1) stepMeld(s, 200, 100, 1 / 60, o, 1);
		expect(s.drops).toHaveLength(0);
	});
});

describe("MeldCursor", () => {
	it("指针进来后画头和尾, 点击后多画溅滴", () => {
		useFakeClock();
		const calls: string[] = [];
		const restore = recordCanvas2d(calls);
		const { container } = render(<MeldCursor>hi</MeldCursor>);
		const host = container.querySelector("[data-slot=meld-cursor]") as HTMLElement;
		expect(host.className).toContain("cursor-none");
		stubRect(host, { left: 0, top: 0, width: 200, height: 200 });
		act(() => vi.advanceTimersByTime(32));
		fireEvent.pointerEnter(host, { clientX: 50, clientY: 50 });
		fireEvent.pointerMove(host, { clientX: 60, clientY: 60 });
		calls.length = 0;
		act(() => vi.advanceTimersByTime(64));
		expect(calls).toContain("ellipse");
		const before = calls.filter((c) => c === "arc").length;
		fireEvent.pointerDown(host, { clientX: 60, clientY: 60 });
		calls.length = 0;
		act(() => vi.advanceTimersByTime(32));
		expect(calls.filter((c) => c === "arc").length).toBeGreaterThan(before / 4);
		restore();
	});
	it("减弱动效: 只清屏不画", () => {
		useFakeClock();
		const restoreMotion = mockReducedMotion(true);
		const calls: string[] = [];
		const restore = recordCanvas2d(calls);
		render(<MeldCursor hideCursor={false}>hi</MeldCursor>);
		act(() => vi.advanceTimersByTime(64));
		expect(calls).not.toContain("ellipse");
		restore();
		restoreMotion();
	});
});
