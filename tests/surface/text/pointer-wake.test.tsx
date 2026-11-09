/**
 * pointer 意图: WakeText (EchoText).
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
