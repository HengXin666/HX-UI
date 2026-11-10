/**
 * pointer 族: CellTrail (PixelTrail).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CELL, cellGrid, ditherThreshold, fillCount, lifeEnvelope, moveForce, stampCells } from "@src/surface/pointer/cell";
import { CellTrail } from "@src/surface/pointer/CellTrail";
import { mockReducedMotion, useFakeClock } from "../text/helpers";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

function sized() {
	const ctx = { setTransform: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), rect: vi.fn(), arc: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), fill: vi.fn(), fillStyle: "", shadowColor: "", shadowBlur: 0, globalAlpha: 1 };
	vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
	vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
	vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(200);
	return ctx;
}

describe("CellTrail 纯函数", () => {
	it("规格默认值", () => {
		expect(CELL).toMatchObject({ gridSize: 40, trailSize: 0.1, maxAge: 250, interpolate: 5, gap: 0.08, glow: 0.4, forceMin: 0.3, forceScale: 10000, riseShare: 0.3 });
	});
	it("网格, 力度, 补点", () => {
		expect(cellGrid(400, 210, 40)).toEqual({ cols: 40, rows: 21, cell: 10 });
		expect(cellGrid(0, 100, 40).rows).toBe(0);
		expect(moveForce(0, 0, 10000, 0.3)).toBe(0.3);
		expect(moveForce(0.02, 0, 10000, 0.3)).toBe(1);
		expect(fillCount(3.7, 5)).toBe(3);
		expect(fillCount(30, 5)).toBe(5);
	});
	it("寿命包络先升后落", () => {
		expect(lifeEnvelope(0, 250, 0.3)).toBe(0);
		expect(lifeEnvelope(75, 250, 0.3)).toBe(1);
		expect(lifeEnvelope(162.5, 250, 0.3)).toBeCloseTo(0.5, 6);
		expect(lifeEnvelope(250, 250, 0.3)).toBe(0);
	});
	it("笔刷叠格: 中心最亮, 半径外为 0; 抖动阈值铺满 0..1", () => {
		const out = new Float32Array(10 * 10);
		stampCells(out, 10, 10, 10, [{ x: 55, y: 55, age: 75, force: 1 }], 2, 250, 0.3);
		expect(out[5 * 10 + 5]).toBeCloseTo(1, 6);
		expect(out[5 * 10 + 6]).toBeLessThan(out[5 * 10 + 5]);
		expect(out[0]).toBe(0);
		const ts = Array.from({ length: 16 }, (_, i) => ditherThreshold(i % 4, Math.floor(i / 4)));
		expect(new Set(ts).size).toBe(16);
		expect(Math.min(...ts)).toBeGreaterThan(0);
		expect(Math.max(...ts)).toBeLessThan(1);
	});
});

describe("CellTrail", () => {
	it("正文可读; 移动时画格, 寿命走完后停帧", async () => {
		const { container } = render(<CellTrail><p>hello</p></CellTrail>);
		expect(screen.getByText("hello")).toBeTruthy();
		await expect(container).toHaveNoSeriousA11yViolations();
		useFakeClock();
		const ctx = sized();
		const { container: c2 } = render(<CellTrail shape="diamond" clickBurst>x</CellTrail>);
		const host = c2.querySelector("[data-slot='cell-trail']") as HTMLElement;
		fireEvent.pointerMove(host, { clientX: 50, clientY: 50 });
		fireEvent.pointerMove(host, { clientX: 120, clientY: 60 });
		fireEvent.pointerDown(host, { clientX: 120, clientY: 60 });
		for (let i = 0; i < 4; i += 1) act(() => vi.advanceTimersByTime(25));
		expect(ctx.fill.mock.calls.length).toBeGreaterThan(5);
		expect(ctx.closePath).toHaveBeenCalled();
		for (let i = 0; i < 20; i += 1) act(() => vi.advanceTimersByTime(50));
		const settled = ctx.clearRect.mock.calls.length;
		for (let i = 0; i < 10; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(ctx.clearRect.mock.calls.length).toBe(settled);
	});
	it("减弱动效: 不渲染画布", () => {
		const restore = mockReducedMotion(true);
		const { container } = render(<CellTrail>x</CellTrail>);
		expect(container.querySelector("[data-cell-canvas]")).toBeNull();
		restore();
	});
});
