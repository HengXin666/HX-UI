/**
 * PinCells: 规格常数与弹簧换算, 输入 / 粘贴 / onComplete, 减弱动效下通过态直接落到终值.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	PIN_CHECK_DELAY,
	PIN_CHECK_RISE,
	PIN_SINK_DELAY,
	PIN_SINK_FADE,
	PIN_SINK_STEP,
	PIN_WASH_IN,
	PIN_WASH_OUT,
	PinCells,
	cleanCode,
} from "@src/controls/range/input/PinCells";
import { overshootOf, springFromDuration } from "@src/controls/range/motion";
import { mockReducedMotion, simulate } from "./helpers";

describe("PinCells 常数", () => {
	it("落地规格常数", () => {
		expect([PIN_WASH_IN, PIN_WASH_OUT, PIN_SINK_DELAY, PIN_SINK_STEP, PIN_CHECK_DELAY]).toEqual([0.3, 0.2, 0.06, 0.03, 0.28]);
		expect(PIN_CHECK_RISE).toBe(8);
		expect(PIN_SINK_FADE).toBe(0.6);
	});

	it("落下弹簧 settle 0.3 / bounce 0.2 换算后过冲按理论, 下沉弹簧不过冲", () => {
		const drop = springFromDuration(0.3, 0.2);
		expect(simulate(drop).peak - 1).toBeCloseTo(overshootOf(drop), 3);
		expect(simulate(springFromDuration(0.3, 0)).peak).toBeLessThanOrEqual(1.001);
	});

	it("cleanCode 去空白并截断", () => {
		expect(cleanCode(" 12 34 567", 6)).toBe("123456");
	});
});

describe("PinCells 交互", () => {
	it("粘贴整串触发 onChange 与 onComplete", () => {
		const onChange = vi.fn();
		const onComplete = vi.fn();
		render(<PinCells onChange={onChange} onComplete={onComplete} ariaLabel="验证码" />);
		const input = screen.getByLabelText("验证码");
		fireEvent.change(input, { target: { value: "123 456" } });
		expect(onChange).toHaveBeenLastCalledWith("123456");
		expect(onComplete).toHaveBeenCalledWith("123456");
	});

	it("error 态标 aria-invalid", () => {
		render(<PinCells status="error" defaultValue="12" />);
		expect(screen.getByLabelText("One-time code")).toHaveAttribute("aria-invalid", "true");
	});

	it("减弱动效: 通过态字符直接到下沉终值", async () => {
		mockReducedMotion(true);
		const { container, rerender } = render(<PinCells length={4} defaultValue="1234" />);
		await act(async () => {});
		rerender(<PinCells length={4} defaultValue="1234" status="success" />);
		await act(async () => {});
		const glyph = container.querySelector(".relative > span.relative") as HTMLElement;
		expect(Number(glyph.style.opacity)).toBeCloseTo(PIN_SINK_FADE, 6);
	});
});
