/**
 * pointer 意图: ExtrudeText (DepthText).
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	EXTRUDE_DEFAULTS,
	EXTRUDE_FADE_FLOOR,
	EXTRUDE_FLOAT_EASE,
	EXTRUDE_INTRO_MS,
	EXTRUDE_MAX_LAYERS,
	EXTRUDE_PRESS_EXTRA,
	EXTRUDE_PUSH_SPRING,
	ExtrudeText,
	extrudeIntro,
	extrudeLayers,
	layerOpacity,
	orbitTilt,
	pointerTilt,
	pushTarget,
	smoothingStep,
} from "@src/surface/text/pointer";
import { mockReducedMotion, useFakeClock } from "./helpers";

afterEach(() => {
	vi.useRealTimers();
});

const extrudeOf = (el: Element): number => Number((el as HTMLElement).style.getPropertyValue("--hx-extrude"));

describe("ExtrudeText 纯函数", () => {
	it("规格常数", () => {
		expect(EXTRUDE_MAX_LAYERS).toBe(64);
		expect(EXTRUDE_INTRO_MS).toBe(1200);
		expect(EXTRUDE_PUSH_SPRING).toMatchObject({ stiffness: 260, damping: 17 });
		expect(EXTRUDE_PRESS_EXTRA).toBe(0.25);
		expect(EXTRUDE_FLOAT_EASE).toBe(0.7);
		expect(EXTRUDE_DEFAULTS).toMatchObject({ layers: 34, depth: 2.4, tilt: 7.5, smoothing: 0.14, perspective: 900, orbitSpeed: 0.35 });
	});
	it("层数钳制", () => {
		expect(extrudeLayers(34)).toBe(34);
		expect(extrudeLayers(200)).toBe(64);
		expect(extrudeLayers(0)).toBe(1);
		expect(extrudeLayers(Number.NaN)).toBe(1);
	});
	it("入场缓出: 两端与单调", () => {
		expect(extrudeIntro(0, 1200)).toBe(0);
		expect(extrudeIntro(1200, 1200)).toBe(1);
		expect(extrudeIntro(600, 1200)).toBeCloseTo(0.875, 6);
		expect(extrudeIntro(5, 0)).toBe(1);
	});
	it("指针倾斜: 中心为 0, 右上角为 (+tilt, +tilt)", () => {
		expect(pointerTilt(50, 20, 100, 40, 7.5)).toEqual({ x: -0, y: 0 });
		const corner = pointerTilt(100, 0, 100, 40, 7.5);
		expect(corner.x).toBeCloseTo(7.5, 6);
		expect(corner.y).toBeCloseTo(7.5, 6);
		expect(pointerTilt(10, 10, 0, 0, 7.5)).toEqual({ x: 0, y: 0 });
	});
	it("自转幅度不超过 tilt", () => {
		for (let p = 0; p < 7; p += 0.5) {
			const t = orbitTilt(p, 7.5);
			expect(Math.abs(t.y)).toBeLessThanOrEqual(7.5);
			expect(Math.abs(t.x)).toBeLessThanOrEqual(3.75);
		}
	});
	it("平滑折算与帧率无关", () => {
		expect(smoothingStep(0.14, 1 / 60)).toBeCloseTo(0.14, 6);
		const two = 1 - (1 - smoothingStep(0.14, 1 / 120)) ** 2;
		expect(two).toBeCloseTo(0.14, 6);
		expect(smoothingStep(1, 0.01)).toBe(1);
	});
	it("推深目标与层不透明度", () => {
		expect(pushTarget(false, false, 0.5)).toBe(1);
		expect(pushTarget(true, false, 0.5)).toBe(1.5);
		expect(pushTarget(true, true, 0.5)).toBe(1.75);
		expect(layerOpacity(3, 10, false)).toBe(100);
		expect(layerOpacity(0, 10, true)).toBe(100);
		expect(layerOpacity(9, 10, true)).toBe(EXTRUDE_FADE_FLOOR);
	});
});

describe("ExtrudeText", () => {
	it("叠出层数, 读屏只读一份原文, 无严重无障碍问题", async () => {
		const { container } = render(<ExtrudeText text="Elevate" layers={12} />);
		expect(container.querySelectorAll("[data-layer]").length).toBe(12);
		expect(container.querySelector(".sr-only")?.textContent).toBe("Elevate");
		expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
		await expect(container).toHaveNoSeriousA11yViolations();
	});
	it("颜色只走 token 变量", () => {
		const { container } = render(<ExtrudeText text="Tone" layers={2} depthTone="accent-2" outline />);
		const layer = container.querySelector("[data-layer='0']") as HTMLElement;
		const tone = layer.style.getPropertyValue("--hx-layer");
		expect(tone).toContain("var(--accent-2)");
		expect(tone).not.toMatch(/#[0-9a-f]{3,8}/i);
		expect(layer.style.color).toBe("var(--hx-layer)");
	});
	it("入场: 厚度从 0 长到 1, 自转写倾角", () => {
		useFakeClock();
		const { container } = render(<ExtrudeText text="Grow" layers={4} />);
		const rig = container.querySelector("[data-part='rig']") as HTMLElement;
		expect(extrudeOf(rig)).toBe(0);
		for (let i = 0; i < 30; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(extrudeOf(rig)).toBeCloseTo(1, 3);
		expect(rig.style.transform).toContain("rotateY");
	});
	it("按下推深, 松开回落", () => {
		useFakeClock();
		const { container } = render(<ExtrudeText text="Push" layers={4} intro={false} autoOrbit={false} />);
		const host = container.querySelector("[data-slot='extrude-text']") as HTMLElement;
		const rig = container.querySelector("[data-part='rig']") as HTMLElement;
		fireEvent.pointerEnter(host, { clientX: 0, clientY: 0 });
		fireEvent.pointerDown(host, { clientX: 0, clientY: 0 });
		for (let i = 0; i < 40; i += 1) act(() => vi.advanceTimersByTime(25));
		expect(extrudeOf(rig)).toBeCloseTo(1 + EXTRUDE_PRESS_EXTRA, 2);
		fireEvent.pointerCancel(host);
		for (let i = 0; i < 40; i += 1) act(() => vi.advanceTimersByTime(25));
		expect(extrudeOf(rig)).toBeCloseTo(1, 2);
	});
	it("减弱动效: 厚度直接到位, 不倾斜", () => {
		const restore = mockReducedMotion(true);
		useFakeClock();
		const { container } = render(<ExtrudeText text="Still" layers={4} />);
		const rig = container.querySelector("[data-part='rig']") as HTMLElement;
		for (let i = 0; i < 10; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(extrudeOf(rig)).toBe(1);
		expect(rig.style.transform).toBe("");
		restore();
	});
});
