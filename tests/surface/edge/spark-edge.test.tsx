/**
 * edge 意图: SparkEdge (ElectricBorder).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SPARK_EDGE, SparkEdge, budgetRatio, pointerEnergy, revealShown, surgeEnergy, valueNoise } from "@src/surface/edge";
import { mockReducedMotion, useFakeClock } from "../text/helpers";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

function fakeContext() {
	return { setTransform: vi.fn(), clearRect: vi.fn(), translate: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), strokeStyle: "", shadowColor: "", shadowBlur: 0, lineWidth: 1, lineCap: "butt", globalAlpha: 1 };
}

function sized(): ReturnType<typeof fakeContext> {
	const ctx = fakeContext();
	vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
	vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
	vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(100);
	return ctx;
}

describe("SparkEdge 纯函数", () => {
	it("规格常数与默认值", () => {
		expect(SPARK_EDGE).toMatchObject({ maxArcs: 4, pulses: 3, marginPx: 64, pixelBudget: 3e6, surgeSpeed: 560, powerUpS: 0.28, powerDownS: 0.4, revealS: 0.9, hoverStiffness: 120, hoverDamping: 19, speed: 1, chaos: 0.5, spread: 0.6, thickness: 1.5, strands: 3, glow: 0.6, intensity: 0.8, arcs: 1, flicker: 0.5, borderRadius: 24, cursorRadius: 90 });
	});
	it("值噪声连续且有界", () => {
		for (let x = 0; x < 5; x += 0.37) {
			const v = valueNoise(x, 3);
			expect(v).toBeGreaterThanOrEqual(-1);
			expect(v).toBeLessThanOrEqual(1);
			expect(Math.abs(valueNoise(x + 1e-4, 3) - v)).toBeLessThan(0.01);
		}
	});
	it("显现前沿, 浪涌, 指针能量", () => {
		expect(revealShown(0, 100, 70)).toBe(1);
		expect(revealShown(100, 100, 70)).toBe(0);
		expect(revealShown(65, 100, 70)).toBeCloseTo(0.5, 6);
		expect(surgeEnergy(50, 50, 600, 3, 36)).toBe(1);
		expect(surgeEnergy(250, 50, 600, 3, 36)).toBe(1);
		expect(surgeEnergy(150, 50, 600, 3, 36)).toBeLessThan(0.01);
		expect(surgeEnergy(590, 10, 600, 1, 36)).toBeGreaterThan(0.7);
		expect(pointerEnergy(0, 90)).toBe(1);
		expect(pointerEnergy(90, 90)).toBe(0);
	});
	it("像素比按预算压", () => {
		expect(budgetRatio(3, 100, 100, 3e6)).toBe(2);
		expect(budgetRatio(2, 3000, 2000, 3e6)).toBeCloseTo(Math.sqrt(0.5), 6);
	});
});

describe("SparkEdge", () => {
	it("内容可读, 画布装饰; 通电后逐帧画电弧, 指针靠近也不报错", async () => {
		const { container } = render(<SparkEdge><a href="#x">Link</a></SparkEdge>);
		expect(screen.getByRole("link", { name: "Link" })).toBeTruthy();
		await expect(container).toHaveNoSeriousA11yViolations();
		useFakeClock();
		const ctx = sized();
		const { container: c2 } = render(<SparkEdge arcs={2}>x</SparkEdge>);
		const host = c2.querySelector("[data-slot='spark-edge']") as HTMLElement;
		fireEvent.pointerMove(host, { clientX: 10, clientY: 10 });
		for (let i = 0; i < 25; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(ctx.stroke.mock.calls.length).toBeGreaterThan(100);
		fireEvent.pointerLeave(host);
	});
	it("断电后渐熄并停帧", () => {
		useFakeClock();
		const ctx = sized();
		const { rerender } = render(<SparkEdge intro={false}>x</SparkEdge>);
		for (let i = 0; i < 5; i += 1) act(() => vi.advanceTimersByTime(50));
		rerender(<SparkEdge intro={false} active={false}>x</SparkEdge>);
		for (let i = 0; i < 80; i += 1) act(() => vi.advanceTimersByTime(50));
		const settled = ctx.clearRect.mock.calls.length;
		for (let i = 0; i < 10; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(ctx.clearRect.mock.calls.length).toBe(settled);
	});
	it("减弱动效: 只画一帧", () => {
		useFakeClock();
		const restore = mockReducedMotion(true);
		const ctx = sized();
		render(<SparkEdge>x</SparkEdge>);
		const first = ctx.stroke.mock.calls.length;
		for (let i = 0; i < 10; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(first).toBeGreaterThan(0);
		expect(ctx.stroke.mock.calls.length).toBe(first);
		restore();
	});
});
