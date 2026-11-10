/**
 * loop 意图: OrbitRing (OrbitImages).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ORBIT, OrbitRing, buildOrbit, lapPhase, orbitAt, orbitLook } from "@src/surface/loop";
import { mockReducedMotion, useFakeClock } from "../text/helpers";

afterEach(() => {
	vi.useRealTimers();
});

const SPEC = { shape: "circle" as const, radiusX: 0, radiusY: 0, radius: 100, starPoints: 5, starInnerRatio: 0.5, rotation: 0 };
const IMAGES = [{ src: "a.png", alt: "Ann" }, { src: "b.png" }, { src: "c.png" }];

describe("OrbitRing 纯函数", () => {
	it("规格常数", () => {
		expect(ORBIT).toMatchObject({ samples: 720, frontGrow: 0.3, backShrink: 0.45, backDim: 0.55, introSpreadS: 1.3, introFadeS: 0.45, dragThresholdPx: 5, duration: 40, radiusX: 700, radiusY: 170, rotation: -8, itemSize: 64 });
	});
	it("按弧长取位: 圆周长与四分点", () => {
		const t = buildOrbit(SPEC, 720);
		expect(t.acc[t.acc.length - 1]).toBeCloseTo(2 * Math.PI * 100, 0);
		const bottom = orbitAt(t, 0);
		expect(bottom.x).toBeCloseTo(0, 3);
		expect(bottom.y).toBeCloseTo(100, 3);
		expect(orbitAt(t, 0.5).y).toBeCloseTo(-100, 1);
		expect(orbitAt(t, 1.25).x).toBeCloseTo(orbitAt(t, 0.25).x, 6);
	});
	it("方形与星形轨道闭合", () => {
		const sq = buildOrbit({ ...SPEC, shape: "square" }, 400);
		expect(sq.acc[sq.acc.length - 1]).toBeCloseTo(800, 0);
		const star = buildOrbit({ ...SPEC, shape: "star" }, 400);
		expect(star.xs[0]).toBeCloseTo(star.xs[400], 6);
	});
	it("前后排外观与每圈缓动", () => {
		expect(orbitLook(100, 100, 0.3, 0.45, 0.55)).toEqual({ depth: 1, scale: 1.3, opacity: 1 });
		const back = orbitLook(-100, 100, 0.3, 0.45, 0.55);
		expect(back.scale).toBeCloseTo(0.55, 6);
		expect(back.opacity).toBeCloseTo(0.45, 6);
		expect(lapPhase(1.5, "linear")).toBe(1.5);
		expect(lapPhase(2.5, "ease")).toBeCloseTo(2.5, 6);
		expect(lapPhase(2.25, "ease")).toBeLessThan(2.25);
	});
});

describe("OrbitRing", () => {
	it("读屏名与 alt, 帧推进时环行并淡入", async () => {
		const { container } = render(<OrbitRing images={IMAGES} label="Team" />);
		expect(screen.getByRole("group", { name: "Team" })).toBeTruthy();
		expect(screen.getByAltText("Orbiting image 2")).toBeTruthy();
		await expect(container).toHaveNoSeriousA11yViolations();
		useFakeClock();
		const { container: c2 } = render(<OrbitRing images={IMAGES} label="Run" duration={4} />);
		const item = c2.querySelector("[data-orbit-index='0']") as HTMLElement;
		for (let i = 0; i < 10; i += 1) act(() => vi.advanceTimersByTime(50));
		const left1 = item.style.left;
		for (let i = 0; i < 30; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(Number(item.style.opacity)).toBeGreaterThan(0);
		expect(item.style.left).not.toBe(left1);
	});
	it("方向键换一位: 末件补到首件原位", () => {
		useFakeClock();
		const { container } = render(<OrbitRing images={IMAGES} label="Keys" duration={0} />);
		const host = container.querySelector("[data-slot='orbit-ring']") as HTMLElement;
		for (let i = 0; i < 40; i += 1) act(() => vi.advanceTimersByTime(50));
		const item = container.querySelector("[data-orbit-index='0']") as HTMLElement;
		const before = item.style.left;
		fireEvent.keyDown(host, { key: "ArrowLeft" });
		for (let i = 0; i < 20; i += 1) act(() => vi.advanceTimersByTime(50));
		const next = container.querySelector("[data-orbit-index='2']") as HTMLElement;
		expect(Number.parseFloat(item.style.left)).not.toBeCloseTo(Number.parseFloat(before), 1);
		expect(Number.parseFloat(next.style.left)).toBeCloseTo(Number.parseFloat(before), 1);
	});
	it("减弱动效: 不可聚焦, 原位显示", () => {
		const restore = mockReducedMotion(true);
		const { container } = render(<OrbitRing images={IMAGES} label="Still" />);
		const host = container.querySelector("[data-slot='orbit-ring']") as HTMLElement;
		expect(host.getAttribute("tabindex")).toBeNull();
		expect((container.querySelector("[data-orbit-index='0']") as HTMLElement).style.opacity).toBe("1");
		restore();
	});
});
