/**
 * pointer 意图: ExtrudeText (DepthText), WakeText (EchoText).
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
import {
	WAKE_BURST_GAP_MS,
	WAKE_BURST_LIFE_MS,
	WAKE_DEFAULTS,
	WAKE_DRIFT_IDLE_MS,
	WAKE_DRIFT_PERIOD_MS,
	WakeText,
	burstAt,
	driftLead,
	echoLook,
	followChain,
	pointerLead,
	wakeCount,
	wakeEase,
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

describe("WakeText 纯函数", () => {
	it("规格常数", () => {
		expect(WAKE_DRIFT_PERIOD_MS).toBe(7200);
		expect(WAKE_DRIFT_IDLE_MS).toBe(2600);
		expect(WAKE_BURST_LIFE_MS).toBe(1100);
		expect(WAKE_BURST_GAP_MS).toBe(80);
		expect(WAKE_DEFAULTS).toMatchObject({ echoes: 12, lag: 0.24, offset: 36, fade: 0.72, blur: 3, cursorRadius: 320, duration: 900 });
	});
	it("层数钳制与曲线两端", () => {
		expect(wakeCount(12)).toBe(12);
		expect(wakeCount(99)).toBe(32);
		expect(wakeCount(-3)).toBe(0);
		for (const k of ["linear", "ease-out", "ease-in-out"] as const) {
			expect(wakeEase(k, 0)).toBe(0);
			expect(wakeEase(k, 1)).toBe(1);
		}
		expect(wakeEase("ease-in-out", 0.5)).toBeCloseTo(0.5, 6);
	});
	it("领头点: 漂移相位 0 时正对方向; 指针背离且半径外为 0", () => {
		const r = driftLead("right", 36, 0);
		expect(r.x).toBeCloseTo(36, 6);
		expect(r.y).toBeCloseTo(0, 6);
		expect(driftLead("up", 10, 0).y).toBeCloseTo(-10, 6);
		const p = pointerLead(100, 0, 36, 320);
		expect(p.x).toBeLessThan(0);
		expect(pointerLead(400, 0, 36, 320)).toEqual({ x: 0, y: 0 });
	});
	it("链式跟随: 越往后越滞后", () => {
		const chain = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
		followChain(chain, { x: 10, y: 0 }, 0.24, 1 / 60, 60);
		expect(chain[0].x).toBeCloseTo(7.6, 6);
		expect(chain[1].x).toBeLessThan(chain[0].x);
		expect(chain[2].x).toBeLessThan(chain[1].x);
	});
	it("外观与爆开包络", () => {
		expect(echoLook(0, 4, 0.72, 3, 1).opacity).toBeCloseTo(0.72, 6);
		expect(echoLook(3, 4, 0.72, 3, 1).blur).toBeCloseTo(3, 6);
		expect(burstAt(0, 0, "ease-out")).toBe(0);
		expect(burstAt(1100, 0, "ease-out")).toBe(0);
		expect(burstAt(80, 1, "linear")).toBe(0);
		expect(burstAt(550, 0, "linear")).toBeCloseTo(1, 6);
	});
});

describe("WakeText", () => {
	it("拖出层数, 读屏只读一份原文, 颜色走 token", async () => {
		const { container } = render(<WakeText text="Motion Echo" echoes={5} echoColors={["primary", "accent-2"]} />);
		const echoes = container.querySelectorAll("[data-echo]");
		expect(echoes.length).toBe(5);
		expect(container.querySelector(".sr-only")?.textContent).toBe("Motion Echo");
		expect((container.querySelector("[data-echo='1']") as HTMLElement).style.getPropertyValue("--hx-echo")).toBe("var(--accent-2)");
		await expect(container).toHaveNoSeriousA11yViolations();
	});
	it("漂移时各层在动", () => {
		useFakeClock();
		const { container } = render(<WakeText text="Drift" echoes={3} />);
		const last = container.querySelector("[data-echo='2']") as HTMLElement;
		const first = last.style.transform;
		for (let i = 0; i < 40; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(last.style.transform).not.toBe(first);
	});
	it("减弱动效: 残影静止在起点", () => {
		const restore = mockReducedMotion(true);
		useFakeClock();
		const { container } = render(<WakeText text="Still" echoes={2} offset={20} />);
		const last = container.querySelector("[data-echo='1']") as HTMLElement;
		const first = last.style.transform;
		for (let i = 0; i < 10; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(last.style.transform).toBe(first);
		expect(first).toContain("translate(20px");
		restore();
	});
});
