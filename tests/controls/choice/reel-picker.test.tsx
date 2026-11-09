/**
 * choice/pick: ReelPicker (规格 OptionWheel). 行姿态, 环绕, 键盘, 滚轮, 点击, 弹簧落定, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { REEL_DEFAULTS, ReelPicker, reelDistance, reelIndex, reelPose, reelRubber, reelSpring } from "@src/controls/choice/pick/ReelPicker";
import { reelKeyTarget } from "@src/controls/choice/pick/parts/reel-spec";
import { manualFrames, mockReducedMotion } from "./support";

const ITEMS = ["A", "B", "C", "D", "E"];
const shape = { spacing: 1.4, curve: 1, tilt: 6, blur: 2, fade: 0.25, minOpacity: 0.05, side: "left" as const };

describe("ReelPicker 纯逻辑", () => {
	it("规格默认值", () => {
		expect(REEL_DEFAULTS).toMatchObject({ defaultIndex: 3, fontSize: 3, spacing: 1.4, curve: 1, tilt: 6, blur: 2, fade: 0.25, minOpacity: 0.05, smoothing: 200, inset: 80 });
	});

	it("行距与环绕", () => {
		expect(reelDistance(0, 2, 5, false)).toBe(-2);
		expect(reelDistance(0, 4, 5, true)).toBe(1);
		expect(reelIndex(-1, 5, true)).toBe(4);
		expect(reelIndex(-1, 5, false)).toBe(0);
		expect(reelRubber(-2, 5)).toBeCloseTo(-0.7);
	});

	it("姿态: 中心清晰, 远行变淡变糊, 钳在 minOpacity", () => {
		expect(reelPose(0, shape)).toMatchObject({ opacity: 1, blur: 0 });
		const two = reelPose(2, shape);
		expect(two.opacity).toBe(0.5);
		expect(two.blur).toBe(4);
		expect(two.y).toBeCloseTo(2.8);
		expect(Math.abs(two.rotate)).toBe(12);
		expect(reelPose(10, shape).opacity).toBe(0.05);
		expect(reelPose(1, shape).x).toBe(-reelPose(1, { ...shape, side: "right" }).x);
	});

	it("跟随弹簧临界阻尼, smoothing 越大越软", () => {
		const s = reelSpring(200);
		expect(s.damping).toBeCloseTo(2 * Math.sqrt(s.stiffness * s.mass));
		expect(reelSpring(400).stiffness).toBeLessThan(s.stiffness);
	});

	it("按键目标跳过禁用项", () => {
		const items = ITEMS.map((v, i) => ({ value: v, label: v, disabled: i === 1 }));
		expect(reelKeyTarget("ArrowDown", items, 0, false)).toBe(2);
		expect(reelKeyTarget("Home", items, 3, false)).toBe(0);
		expect(reelKeyTarget("End", items, 0, false)).toBe(4);
		expect(reelKeyTarget("x", items, 0, false)).toBeNull();
	});
});

describe("ReelPicker", () => {
	it("默认选第 4 项; 方向键, 点击, 滚轮换项", () => {
		mockReducedMotion(false);
		manualFrames();
		const onChange = vi.fn();
		render(<ReelPicker items={ITEMS} onChange={onChange} ariaLabel="Section" />);
		const list = screen.getByRole("listbox", { name: "Section" });
		expect(screen.getByRole("option", { name: "D" })).toHaveAttribute("aria-selected", "true");
		fireEvent.keyDown(list, { key: "ArrowUp" });
		expect(onChange).toHaveBeenLastCalledWith("C", 2);
		fireEvent.click(screen.getByRole("option", { name: "A" }));
		expect(onChange).toHaveBeenLastCalledWith("A", 0);
		fireEvent.wheel(list, { deltaY: 60 });
		expect(onChange).toHaveBeenLastCalledWith("B", 1);
		expect(list.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "B" }).id);
	});

	it("loop 时首项再往上回到末项", () => {
		const onChange = vi.fn();
		render(<ReelPicker items={ITEMS} defaultValue="A" loop onChange={onChange} />);
		fireEvent.keyDown(screen.getByRole("listbox"), { key: "ArrowUp" });
		expect(onChange).toHaveBeenLastCalledWith("E", 4);
	});

	it("弹簧逐帧追到新位置", () => {
		mockReducedMotion(false);
		const frames = manualFrames();
		render(<ReelPicker items={ITEMS} defaultValue="A" />);
		const target = screen.getByRole("option", { name: "C" });
		fireEvent.keyDown(screen.getByRole("listbox"), { key: "End" });
		act(() => frames.flush(2));
		const mid = target.style.transform;
		act(() => frames.flush(120));
		expect(target.style.transform).not.toBe(mid);
		expect(target.style.transform).toContain("translate(-0.48em, -2.8em)");
	});

	it("减弱动效: 换项立即落到终值", () => {
		mockReducedMotion(true);
		manualFrames();
		render(<ReelPicker items={ITEMS} defaultValue="A" />);
		fireEvent.keyDown(screen.getByRole("listbox"), { key: "End" });
		const last = screen.getByRole("option", { name: "E" });
		expect(last.style.transform).toContain("translate(0em, 0em)");
		expect(last.style.opacity).toBe("1");
		expect(last.style.transition).toContain("0ms");
	});
});
