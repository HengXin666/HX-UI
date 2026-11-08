/**
 * ArcKnob: 规格常数, speed / bounce 到弹簧的换算, 角度映射与惯性衰减, 键盘回调, 减弱动效下键盘改值立即落定.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	ArcKnob,
	KNOB_DEAD_PX,
	KNOB_DECEL,
	KNOB_DRAG_PX,
	KNOB_STALE_MS,
	KNOB_TAU_FOLLOW,
	KNOB_TAU_V,
	KNOB_V_FLICK,
	KNOB_V_FULL,
	angleToFraction,
	coastStep,
	knobSpring,
} from "@src/controls/range/input/ArcKnob";
import { overshootOf } from "@src/controls/range/motion";
import { mockReducedMotion, simulate } from "./helpers";

describe("ArcKnob 常数", () => {
	it("落地规格常数", () => {
		expect([KNOB_DEAD_PX, KNOB_V_FULL, KNOB_V_FLICK, KNOB_DRAG_PX, KNOB_STALE_MS]).toEqual([44, 4, 2, 10, 80]);
		expect([KNOB_TAU_FOLLOW, KNOB_TAU_V, KNOB_DECEL]).toEqual([0.06, 0.05, 0.99]);
	});

	it("speed 25: stiffness 625, mass 1; tapBounce 0.2 阻尼 0.8 倍临界, 过冲按理论值", () => {
		const spring = knobSpring(25, 0.2);
		expect(spring.stiffness).toBe(625);
		expect(spring.mass).toBe(1);
		expect(spring.damping).toBeCloseTo(2 * 25 * 0.8, 6);
		expect(simulate(spring).peak - 1).toBeCloseTo(overshootOf(spring), 3);
		expect(overshootOf(knobSpring(25, 0.1))).toBeLessThan(overshootOf(spring));
	});

	it("角度映射: 正上方是中点, 缺口内钳到端点; 惯性 1/60s 衰减 DECEL", () => {
		expect(angleToFraction(0, -10, 320)).toBeCloseTo(0.5, 6);
		expect(angleToFraction(1, 10, 320)).toBe(1);
		expect(angleToFraction(-1, 10, 320)).toBe(0);
		expect(coastStep(1, 1 / 60)).toBeCloseTo(0.99, 6);
	});
});

describe("ArcKnob 交互", () => {
	it("role=slider, 键盘改值触发 onChangeEnd", () => {
		const onChangeEnd = vi.fn();
		render(<ArcKnob defaultValue={62} onChangeEnd={onChangeEnd} label="亮度" />);
		const knob = screen.getByRole("slider", { name: "亮度" });
		expect(knob).toHaveAttribute("aria-valuenow", "62");
		fireEvent.keyDown(knob, { key: "ArrowUp" });
		expect(onChangeEnd).toHaveBeenLastCalledWith(63);
		fireEvent.keyDown(knob, { key: "Home" });
		expect(onChangeEnd).toHaveBeenLastCalledWith(0);
	});

	it("减弱动效: 键盘改值立即写进 aria-valuenow 与 onChange, 不经弹簧", async () => {
		mockReducedMotion(true);
		const onChange = vi.fn();
		render(<ArcKnob defaultValue={10} onChange={onChange} />);
		await act(async () => {});
		const knob = screen.getByRole("slider");
		await act(async () => {
			fireEvent.keyDown(knob, { key: "End" });
		});
		expect(onChange).toHaveBeenLastCalledWith(100);
		expect(knob).toHaveAttribute("aria-valuenow", "100");
	});
});
