/**
 * sticker 意图: PeelSticker (StickerPeel).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PEEL, PeelSticker, clipHalfPlane, foldLine, mirrorMatrix, polygonCss, springStep } from "@src/surface/sticker";
import { mockReducedMotion, useFakeClock } from "../text/helpers";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

function sized(): void {
	vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
	vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(100);
}

describe("PeelSticker 纯函数", () => {
	it("规格常数与默认值", () => {
		expect(PEEL).toMatchObject({ introS: 1.1, pointerTauS: 0.045, peelHotHz: 3, peelHotDamping: 0.7, peelRestHz: 3.6, peelRestDamping: 0.62, liftHz: 3.2, liftDamping: 0.55, swingHz: 1.4, swingDamping: 0.32, swingCap: 1.2, width: 200, peelBackHoverPct: 25, peelBackActivePct: 40, curlRadius: 12, swing: 1, friction: 0.5 });
	});
	it("折线: 从右边揭 25%", () => {
		const f = foldLine(200, 100, 0, 0.25);
		expect(f.nx).toBe(1);
		expect(f.extent).toBe(100);
		expect(f.fold).toBe(50);
		expect(foldLine(200, 100, 90, 0).fold).toBeCloseTo(50, 6);
	});
	it("半平面裁剪与 clip-path", () => {
		const rect = [[0, 0], [200, 0], [200, 100], [0, 100]] as const;
		const near = clipHalfPlane(rect, 100, 50, 1, 0, 50, "near");
		expect(Math.max(...near.map((p) => p[0]))).toBeCloseTo(150, 6);
		const far = clipHalfPlane(rect, 100, 50, 1, 0, 50, "far");
		expect(Math.min(...far.map((p) => p[0]))).toBeCloseTo(150, 6);
		expect(polygonCss([[0, 0], [100, 0], [100, 50]], 200, 100)).toBe("polygon(0.000% 0.000%, 50.000% 0.000%, 50.000% 50.000%)");
		expect(polygonCss([], 200, 100)).toBe("polygon(0 0, 0 0, 0 0)");
	});
	it("镜像矩阵把折线外的点翻到折线内", () => {
		const [a, b, c, d, e, f] = mirrorMatrix(1, 0, 50);
		const x = 80;
		const y = 10;
		expect(a * x + c * y + e).toBeCloseTo(20, 6);
		expect(b * x + d * y + f).toBeCloseTo(10, 6);
	});
	it("弹簧趋向目标", () => {
		let st = { x: 0, v: 0 };
		for (let i = 0; i < 300; i += 1) st = springStep(st.x, st.v, 10, 3, 0.7, 1 / 60);
		expect(st.x).toBeCloseTo(10, 2);
	});
});

describe("PeelSticker", () => {
	it("图有 alt; 悬停时揭起, 背面出现", async () => {
		const { container } = render(<PeelSticker imageSrc="s.png" alt="Logo sticker" />);
		expect(screen.getByAltText("Logo sticker")).toBeTruthy();
		await expect(container).toHaveNoSeriousA11yViolations();
		useFakeClock();
		sized();
		const { container: c2 } = render(<PeelSticker imageSrc="s.png" alt="x" followPointer={false} />);
		const host = c2.querySelector("[data-slot='peel-sticker']") as HTMLElement;
		fireEvent.pointerEnter(host);
		for (let i = 0; i < 60; i += 1) act(() => vi.advanceTimersByTime(33));
		const flap = c2.querySelector("[data-peel-flap]") as HTMLElement;
		expect(flap.style.display).toBe("");
		expect(flap.style.transform).toContain("matrix(");
		expect((c2.querySelector("img") as HTMLElement).style.clipPath).toContain("polygon(");
	});
	it("拖过阈值后移动并回调, 松手后滑行", () => {
		useFakeClock();
		sized();
		const onDragStart = vi.fn();
		const onDragEnd = vi.fn();
		const { container } = render(<PeelSticker imageSrc="s.png" alt="x" intro={false} onDragStart={onDragStart} onDragEnd={onDragEnd} />);
		const host = container.querySelector("[data-slot='peel-sticker']") as HTMLElement;
		fireEvent.pointerDown(host, { button: 0, pointerId: 1, clientX: 0, clientY: 0 });
		fireEvent.pointerMove(host, { pointerId: 1, clientX: 30, clientY: 0 });
		fireEvent.pointerMove(host, { pointerId: 1, clientX: 60, clientY: 0 });
		expect(onDragStart).toHaveBeenCalledTimes(1);
		fireEvent.pointerUp(host, { pointerId: 1, clientX: 60, clientY: 0 });
		expect(onDragEnd).toHaveBeenCalledTimes(1);
		act(() => vi.advanceTimersByTime(33));
		expect(host.style.transform).toMatch(/translate\((\d+(\.\d+)?)px, 0px\)/);
		expect(Number(/translate\(([\d.]+)px/.exec(host.style.transform)?.[1])).toBeGreaterThanOrEqual(30);
	});
	it("减弱动效: 没有背面层", () => {
		const restore = mockReducedMotion(true);
		const { container } = render(<PeelSticker imageSrc="s.png" alt="x" rotate={5} />);
		expect(container.querySelector("[data-peel-flap]")).toBeNull();
		expect((container.querySelector("[data-slot='peel-sticker']") as HTMLElement).style.transform).toBe("rotate(5deg)");
		restore();
	});
});
