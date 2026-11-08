/**
 * signal 子族: LikeBurst (PulseHeart), RunChip (CallChip). 常数, 曲线, 回调与减弱动效分支.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LIKE_DEFAULTS, LIKE_OUT, LikeBurst, backOut, likeScale } from "@src/controls/press/signal/LikeBurst";
import { RUN_DEFAULTS, RUN_HOLD_AT, RUN_SHAKE_MS, RUN_TIMING, RunChip, runProgress } from "@src/controls/press/signal/RunChip";
import { SHAKE_EASE, shakeFrames } from "@src/controls/press/tokens";
import { mockReducedMotion, useFakeClock } from "./helpers";

afterEach(() => {
	vi.useRealTimers();
});

describe("LikeBurst", () => {
	it("规格常数与 back-out 过冲", () => {
		expect(LIKE_OUT).toBe(0.4);
		expect(LIKE_DEFAULTS).toEqual({ size: 40, corner: 32, duration: 560, dotSize: 0.3, overshoot: 1.7, beat: 3, rollDuration: 350 });
		let peak = 0;
		for (let i = 0; i <= 100; i += 1) peak = Math.max(peak, backOut(i / 100, 1.7));
		expect(peak).toBeGreaterThan(1.05);
		expect(backOut(0, 1.7)).toBe(0);
		expect(backOut(1, 1.7)).toBe(1);
		expect(likeScale(1, 1.7, 3)).toBe(1);
	});

	it("点亮: aria-pressed 翻转, onChange 带新计数", () => {
		const onChange = vi.fn();
		render(<LikeBurst count={41} onChange={onChange} />);
		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("aria-pressed", "false");
		fireEvent.click(button);
		expect(button).toHaveAttribute("aria-pressed", "true");
		expect(onChange).toHaveBeenLastCalledWith(true, 42);
		fireEvent.click(button);
		expect(onChange).toHaveBeenLastCalledWith(false, 41);
	});

	it("减弱动效: 不出粒子, 图标不弹", () => {
		const restore = mockReducedMotion(true);
		const { container } = render(<LikeBurst />);
		fireEvent.click(screen.getByRole("button"));
		expect(container.querySelectorAll(".bg-danger")).toHaveLength(0);
		expect(container.querySelector("svg")?.getAttribute("style")).toContain("scale(1)");
		restore();
	});
});

describe("RunChip", () => {
	it("规格常数: HOLD_AT 0.9, 抖动 450ms 与曲线", () => {
		expect(RUN_HOLD_AT).toBe(0.9);
		expect(RUN_SHAKE_MS).toBe(450);
		expect(RUN_TIMING).toEqual({ wash: 400, washDelay: 200, swapIn: 240, swapOut: 160, settle: 200 });
		expect(RUN_DEFAULTS).toEqual({ expectedMs: 2500, size: 34, radius: 10, progressOpacity: 0.08, washOpacity: 0.14, shake: 6 });
		expect(SHAKE_EASE).toBe("cubic-bezier(0.77, 0, 0.175, 1)");
		expect(shakeFrames(6).every((f) => f.easing === SHAKE_EASE)).toBe(true);
		expect(runProgress(1250, 2500)).toBeCloseTo(0.45, 6);
		expect(runProgress(99999, 2500)).toBe(RUN_HOLD_AT);
	});

	it("运行中计时; 出错且有 onRetry 时可点重试", () => {
		useFakeClock();
		const onRetry = vi.fn();
		const { rerender } = render(<RunChip onRetry={onRetry} />);
		expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
		act(() => vi.advanceTimersByTime(1000));
		expect(screen.getByRole("status").textContent).toContain("1.0s");
		rerender(<RunChip onRetry={onRetry} status="error" />);
		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("type", "button");
		fireEvent.click(button);
		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	it("减弱动效: 出错不抖, 过渡为 none", () => {
		const restore = mockReducedMotion(true);
		const animate = vi.fn();
		const proto = HTMLElement.prototype as unknown as { animate?: unknown };
		const original = proto.animate;
		proto.animate = animate;
		const { container } = render(<RunChip status="error" />);
		expect(animate).not.toHaveBeenCalled();
		expect((container.firstElementChild as HTMLElement).style.transition).toBe("none");
		proto.animate = original;
		restore();
	});
});
