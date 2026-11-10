/**
 * edge 意图: CometBorder (StarBorder).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COMET, CometBorder, emitCount, lapEase, roundRectLength, roundRectPoint, wrapPhase } from "@src/surface/edge";
import { mockReducedMotion, useFakeClock } from "../text/helpers";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

function fakeContext() {
	return { setTransform: vi.fn(), clearRect: vi.fn(), translate: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), arc: vi.fn(), fill: vi.fn(), strokeStyle: "", fillStyle: "", shadowColor: "", shadowBlur: 0, lineWidth: 1, lineCap: "butt", globalAlpha: 1 };
}

describe("CometBorder 纯函数", () => {
	it("规格常数与默认值", () => {
		expect(COMET).toMatchObject({ bleedPx: 48, lapS: 0.9, velocityTauS: 0.45, flashTauS: 0.22, moteDrag: 2.2, duration: 4, thickness: 1, radius: 12, trailLength: 0.3, stars: 1, glow: 0.6 });
	});
	it("缓动, 折回, 周长", () => {
		expect(lapEase(0)).toBe(0);
		expect(lapEase(0.5)).toBe(0.5);
		expect(lapEase(1)).toBe(1);
		expect(wrapPhase(-10, 100)).toBe(90);
		expect(wrapPhase(250, 100)).toBe(50);
		expect(roundRectLength(100, 50, 0)).toBe(300);
		expect(roundRectLength(100, 100, 50)).toBeCloseTo(Math.PI * 100, 6);
	});
	it("圆角矩形取点: 四边与切线", () => {
		expect(roundRectPoint(100, 50, 0, 10)).toMatchObject({ x: 10, y: 0, tx: 1 });
		expect(roundRectPoint(100, 50, 0, 120)).toMatchObject({ x: 100, y: 20, ty: 1 });
		expect(roundRectPoint(100, 50, 0, 160)).toMatchObject({ x: 90, y: 50, tx: -1 });
		expect(roundRectPoint(100, 50, 0, 290)).toMatchObject({ x: 0, y: 10, ty: -1 });
		const p = roundRectPoint(100, 50, 10, 80 + (Math.PI * 10) / 4);
		expect(Math.hypot(p.x - 90, p.y - 10)).toBeCloseTo(10, 6);
	});
	it("火星发射率随速度升高", () => {
		expect(emitCount(0, 1, 0, 1, 2, 6, 2)).toEqual({ count: 2, acc: 0 });
		expect(emitCount(0, 1, 5, 1, 2, 6, 2).count).toBe(14);
		expect(emitCount(0, 0.1, 0, 0, 2, 6, 2).count).toBe(0);
	});
});

describe("CometBorder", () => {
	it("内容可读, 画布装饰; 帧推进时逐帧重画, 悬停加跑一圈", async () => {
		const { container } = render(<CometBorder><button type="button">Go</button></CometBorder>);
		expect(screen.getByRole("button", { name: "Go" })).toBeTruthy();
		expect(container.querySelector("canvas")?.getAttribute("aria-hidden")).toBe("true");
		await expect(container).toHaveNoSeriousA11yViolations();
		useFakeClock();
		const ctx = fakeContext();
		vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
		vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
		vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(100);
		const { container: c2 } = render(<CometBorder sparkle clickPulse>x</CometBorder>);
		const host = c2.querySelector("[data-slot='comet-border']") as HTMLElement;
		fireEvent.pointerEnter(host);
		fireEvent.pointerDown(host);
		for (let i = 0; i < 20; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(ctx.clearRect.mock.calls.length).toBeGreaterThan(10);
		expect(ctx.stroke.mock.calls.length).toBeGreaterThan(COMET.trailSegments * 10);
		expect(ctx.arc).toHaveBeenCalled();
	});
	it("减弱动效: 只画一帧", () => {
		useFakeClock();
		const restore = mockReducedMotion(true);
		const ctx = fakeContext();
		vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
		vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
		vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(100);
		render(<CometBorder>x</CometBorder>);
		const first = ctx.clearRect.mock.calls.length;
		for (let i = 0; i < 10; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(first).toBeGreaterThan(0);
		expect(ctx.clearRect.mock.calls.length).toBe(first);
		restore();
	});
});
