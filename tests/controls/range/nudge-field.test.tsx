/**
 * NudgeField: 规格常数与回弹弹簧换算, 拖动 / 键盘 / 输入的回调, 减弱动效下没有橡皮筋位移.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NUDGE_LEAN_PX, NUDGE_RETURN_BOUNCE, NudgeField, nudgeMultiplier, rubberOffset } from "@src/controls/range/input/NudgeField";
import { springFromDuration } from "@src/controls/range/motion";
import { mockReducedMotion, simulate } from "./helpers";

describe("NudgeField 常数", () => {
	it("LEAN 4px, 回弹 bounce 0, 300ms 回弹不过冲并在 0.3s 内落定", () => {
		expect(NUDGE_LEAN_PX).toBe(4);
		expect(NUDGE_RETURN_BOUNCE).toBe(0);
		const run = simulate(springFromDuration(0.3, NUDGE_RETURN_BOUNCE));
		expect(run.peak).toBeLessThanOrEqual(1.001);
		expect(run.settleMs).toBeLessThanOrEqual(320);
	});

	it("橡皮筋渐近 rubberReach, 倍率 Shift x10 / Alt x0.1", () => {
		expect(rubberOffset(1000, 8)).toBeCloseTo(8, 3);
		expect(rubberOffset(-4, 8)).toBeLessThan(0);
		expect(nudgeMultiplier(true, false, 10, 0.1)).toBe(10);
		expect(nudgeMultiplier(false, true, 10, 0.1)).toBe(0.1);
	});
});

describe("NudgeField 交互", () => {
	it("拖标签: 每 sensitivity 像素一步, 松手 onCommit", () => {
		const onChange = vi.fn();
		const onCommit = vi.fn();
		const { container } = render(<NudgeField defaultValue={24} onChange={onChange} onCommit={onCommit} />);
		const handle = container.querySelector(".cursor-ew-resize") as HTMLElement;
		fireEvent.pointerDown(handle, { clientX: 100, button: 0, pointerId: 1 });
		fireEvent.pointerMove(handle, { clientX: 110, pointerId: 1 });
		expect(onChange).toHaveBeenLastCalledWith(29);
		fireEvent.pointerUp(handle, { clientX: 110, pointerId: 1 });
		expect(onCommit).toHaveBeenLastCalledWith(29);
	});

	it("spinbutton: ArrowUp 一步, Shift+ArrowUp 十步, 输入后 Enter 提交", () => {
		const onCommit = vi.fn();
		render(<NudgeField label="半径" defaultValue={24} onCommit={onCommit} />);
		const input = screen.getByRole("spinbutton", { name: "半径" });
		fireEvent.keyDown(input, { key: "ArrowUp" });
		expect(onCommit).toHaveBeenLastCalledWith(25);
		fireEvent.keyDown(input, { key: "ArrowUp", shiftKey: true });
		expect(onCommit).toHaveBeenLastCalledWith(35);
		fireEvent.change(input, { target: { value: "500" } });
		fireEvent.blur(input);
		expect(onCommit).toHaveBeenLastCalledWith(100);
	});

	it("减弱动效: 越界拖动时整块不位移", async () => {
		mockReducedMotion(true);
		const { container } = render(<NudgeField defaultValue={100} />);
		await act(async () => {});
		const handle = container.querySelector(".cursor-ew-resize") as HTMLElement;
		fireEvent.pointerDown(handle, { clientX: 0, button: 0, pointerId: 1 });
		fireEvent.pointerMove(handle, { clientX: 80, pointerId: 1 });
		const root = container.querySelector("[data-slot=nudge-field]") as HTMLElement;
		expect(root.style.transform).toBe("translate3d(0px, 0, 0)");
	});
});
