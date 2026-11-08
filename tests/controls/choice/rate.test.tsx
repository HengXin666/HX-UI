/**
 * choice/rate: LiftRating 的弹跳关键帧, 预览与选中回调, 清零, 键盘, 减弱动效分支.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LIFT_MS, LIFT_POP_MS, LIFT_POP_PEAK, LiftRating, liftPopFrames, starPath } from "@src/controls/choice/rate/LiftRating";
import { SPEC_EASE_OUT } from "@src/controls/choice/tone";
import { mockReducedMotion, spyAnimate } from "./support";

describe("LiftRating", () => {
	it("规格常数: 300ms 弹跳在 35% 处到峰, 两段 ease-out", () => {
		expect([LIFT_POP_MS, LIFT_POP_PEAK]).toEqual([300, 0.35]);
		expect(LIFT_MS).toEqual({ color: 160, tip: 180 });
		const frames = liftPopFrames(1.3);
		expect(frames[1]).toEqual({ transform: "scale(1.3)", offset: 0.35, easing: SPEC_EASE_OUT });
		expect(SPEC_EASE_OUT).toBe("cubic-bezier(0.23, 1, 0.32, 1)");
		expect(starPath().startsWith("M12.00 2.00")).toBe(true);
	});

	it("悬停预览, 点击选中并弹跳, 再点清零", async () => {
		mockReducedMotion(false);
		const animate = spyAnimate();
		const onChange = vi.fn();
		const onPreview = vi.fn();
		render(<LiftRating labels={["Bad", "Meh", "OK", "Good", "Great"]} onChange={onChange} onPreview={onPreview} />);
		const third = screen.getByRole("radio", { name: "OK" });
		fireEvent.pointerEnter(third);
		expect(onPreview).toHaveBeenLastCalledWith(3);
		expect(third.style.transform).toBe("translateY(-6px) scale(1.15)");
		await userEvent.click(third);
		expect(onChange).toHaveBeenLastCalledWith(3);
		expect(third).toHaveAttribute("aria-checked", "true");
		expect(animate).toHaveBeenCalledWith(liftPopFrames(1.3), { duration: 300 });
		await userEvent.click(third);
		expect(onChange).toHaveBeenLastCalledWith(0);
	});

	it("键盘: 方向键移动即选中, Delete 清零", async () => {
		const onChange = vi.fn();
		render(<LiftRating defaultValue={2} onChange={onChange} />);
		screen.getByRole("radio", { name: "2" }).focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(screen.getByRole("radio", { name: "3" })).toHaveFocus();
		await userEvent.keyboard("{Delete}");
		expect(onChange.mock.calls).toEqual([[3], [0]]);
	});

	it("减弱动效: 不抬起不弹跳", async () => {
		mockReducedMotion(true);
		const animate = spyAnimate();
		render(<LiftRating />);
		const star = screen.getByRole("radio", { name: "4" });
		fireEvent.pointerEnter(star);
		expect(star.style.transform).toBe("none");
		await userEvent.click(star);
		expect(animate).not.toHaveBeenCalled();
	});

	it("readOnly 时不回调", async () => {
		const onChange = vi.fn();
		render(<LiftRating readOnly defaultValue={3} onChange={onChange} />);
		await userEvent.click(screen.getByRole("radio", { name: "5" }));
		expect(onChange).not.toHaveBeenCalled();
	});
});
