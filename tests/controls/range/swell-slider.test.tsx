/**
 * SwellSlider: 规格常数与弹簧换算, 键盘与回调, 减弱动效下竖条不隆起.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	SWELL_FLAT,
	SWELL_FULL_SPEED,
	SWELL_MIN_REACH,
	SWELL_SETTLE,
	SwellSlider,
	swellAmplitude,
	swellSprings,
	swellWeight,
} from "@src/controls/range/input/SwellSlider";
import { mockReducedMotion, simulate } from "./helpers";

afterEach(() => vi.useRealTimers());

describe("SwellSlider 常数", () => {
	it("落地规格常数", () => {
		expect(SWELL_SETTLE).toBe(9.23);
		expect(SWELL_FULL_SPEED).toBe(320);
		expect(SWELL_MIN_REACH).toBe(1.5);
		expect(SWELL_FLAT).toBe(0.002);
	});

	it("glide 0.3 换算: stiffness = w0^2, damping = 2 w0, 不过冲且约 0.3s 落定", () => {
		const { head, speed } = swellSprings(0.3, 100);
		const w0 = 9.23 / 0.3;
		expect(head.stiffness).toBeCloseTo(w0 * w0, 6);
		expect(head.damping).toBeCloseTo(2 * w0, 6);
		const wv = 9.23 / 0.1;
		expect(speed.damping).toBeCloseTo(2.5 * wv, 6);
		const run = simulate(head);
		expect(run.peak).toBeLessThanOrEqual(1.001);
		expect(run.settleMs).toBeLessThanOrEqual(320);
	});

	it("振幅在满速时为 1, 尾随一侧比迎面一侧宽", () => {
		expect(swellAmplitude(0, 1)).toBe(0);
		expect(swellAmplitude(SWELL_FULL_SPEED, 1)).toBe(1);
		expect(swellWeight(-4, 1, 6, 0.6)).toBeGreaterThan(swellWeight(4, 1, 6, 0.6));
	});
});

describe("SwellSlider 交互", () => {
	it("role=slider, 方向键 / Home / End 触发 onChange", () => {
		const onChange = vi.fn();
		render(<SwellSlider defaultValue={50} onChange={onChange} ariaLabel="音量" />);
		const slider = screen.getByRole("slider", { name: "音量" });
		expect(slider).toHaveAttribute("aria-valuenow", "50");
		fireEvent.keyDown(slider, { key: "ArrowRight" });
		expect(onChange).toHaveBeenLastCalledWith(51);
		fireEvent.keyDown(slider, { key: "PageDown" });
		expect(onChange).toHaveBeenLastCalledWith(41);
		fireEvent.keyDown(slider, { key: "End" });
		expect(onChange).toHaveBeenLastCalledWith(100);
	});

	it("禁用时键盘不改值", () => {
		const onChange = vi.fn();
		render(<SwellSlider disabled onChange={onChange} />);
		fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
		expect(onChange).not.toHaveBeenCalled();
	});

	it("减弱动效: 改值后竖条停在静止高度, 不起尾迹", async () => {
		mockReducedMotion(true);
		const { container } = render(<SwellSlider defaultValue={0} bars={8} height={40} restHeight={10} />);
		const slider = screen.getByRole("slider");
		await act(async () => {
			fireEvent.keyDown(slider, { key: "End" });
		});
		const bars = container.querySelectorAll<HTMLElement>("[aria-hidden]");
		bars.forEach((bar) => expect(bar.style.transform).toBe("scaleY(0.25)"));
		expect(slider).toHaveAttribute("aria-valuenow", "100");
	});
});
