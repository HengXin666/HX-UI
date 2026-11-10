/**
 * texture 意图: GrainLayer (Noise).
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GRAIN, GrainLayer, fillGrain, frameDue, grainValue, seededRandom } from "@src/surface/texture";
import { mockReducedMotion, useFakeClock } from "../text/helpers";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

const BASE = { contrast: 0.6, colored: false, dust: 0, scratches: 0, scanlines: 0, dustMax: 24, dustPx: 2, scratchChance: 0.6, scratchPx: 1, scanPeriodPx: 3, scanDim: 0.5 };

describe("GrainLayer 纯函数", () => {
	it("规格默认值", () => {
		expect(GRAIN).toMatchObject({ tile: 256, opacity: 0.2, size: 1, fps: 24, contrast: 0.6, dprCap: 2 });
	});
	it("种子随机可复现, 灰度围绕中灰", () => {
		const a = seededRandom(7);
		const b = seededRandom(7);
		expect([a(), a(), a()]).toEqual([b(), b(), b()]);
		expect(grainValue(0.5, 0.6)).toBe(128);
		expect(grainValue(1, 0)).toBe(128);
		expect(grainValue(1, 1)).toBe(256);
		expect(grainValue(0, 1)).toBe(1);
	});
	it("一帧像素: 单色三通道相等, 不透明, 扫描线压暗首行", () => {
		const buf = new Uint8ClampedArray(8 * 8 * 4);
		fillGrain(buf, 8, 8, BASE, seededRandom(3));
		for (let p = 0; p < 64; p += 1) {
			expect(buf[p * 4]).toBe(buf[p * 4 + 1]);
			expect(buf[p * 4 + 3]).toBe(255);
		}
		const plain = new Uint8ClampedArray(buf);
		fillGrain(buf, 8, 8, { ...BASE, scanlines: 1 }, seededRandom(3));
		expect(Math.abs(buf[0] - plain[0] * 0.5)).toBeLessThanOrEqual(1);
		expect(buf[8 * 4]).toBe(plain[8 * 4]);
	});
	it("帧节拍", () => {
		expect(frameDue(0, 0.02, 24).due).toBe(false);
		expect(frameDue(0.03, 0.02, 24).due).toBe(true);
		expect(frameDue(0.5, 1, 0)).toEqual({ due: false, acc: 0 });
	});
});

describe("GrainLayer", () => {
	it("装饰画布按 fps 重画, 混合模式与不透明度落在样式上", async () => {
		useFakeClock();
		const putImageData = vi.fn();
		const ctx = { createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }), putImageData, createPattern: () => ({}), setTransform: vi.fn(), fillRect: vi.fn(), fillStyle: "" };
		vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
		const { container } = render(<GrainLayer blendMode="soft-light" opacity={0.3} />);
		const el = container.querySelector("[data-slot='grain-layer']") as HTMLCanvasElement;
		expect(el.getAttribute("aria-hidden")).toBe("true");
		expect(el.style.mixBlendMode).toBe("soft-light");
		const first = putImageData.mock.calls.length;
		for (let i = 0; i < 20; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(putImageData.mock.calls.length).toBeGreaterThan(first + 10);
		vi.useRealTimers();
		await expect(container).toHaveNoSeriousA11yViolations();
	});
	it("减弱动效: 只画一帧", () => {
		useFakeClock();
		const restore = mockReducedMotion(true);
		const putImageData = vi.fn();
		const ctx = { createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }), putImageData, createPattern: () => ({}), setTransform: vi.fn(), fillRect: vi.fn(), fillStyle: "" };
		vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
		render(<GrainLayer />);
		const first = putImageData.mock.calls.length;
		for (let i = 0; i < 20; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(putImageData.mock.calls.length).toBe(first);
		expect(first).toBeGreaterThan(0);
		restore();
	});
});
