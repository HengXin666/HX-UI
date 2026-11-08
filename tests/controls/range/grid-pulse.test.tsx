/**
 * GridPulse: 默认走法与拖尾, 按 step 逐帧推进, 完成 / 失败文案, 减弱动效下不逐帧推进.
 */
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GridPulse, formatElapsed } from "@src/controls/range/status/GridPulse";
import { DEFAULT_GRID_PATTERN, GRID_MARKS, GRID_REDUCED_MS, GRID_TRAIL, gridGroups, gridLevels } from "@src/controls/range/status/grid-patterns";
import { mockReducedMotion } from "./helpers";

afterEach(() => vi.useRealTimers());

function opacities(container: HTMLElement): string[] {
	return [...container.querySelectorAll<HTMLElement>("[aria-hidden] > span")].map((el) => el.style.opacity);
}

describe("grid-patterns", () => {
	it("默认走法 3 -> orbit, 4 -> sweep; 三级拖尾 0.45 / 0.35 / 0.25; 减弱动效周期 1400ms", () => {
		expect(DEFAULT_GRID_PATTERN).toEqual({ 3: "orbit", 4: "sweep" });
		expect(GRID_TRAIL).toEqual([1, 0.45, 0.35, 0.25]);
		expect(GRID_REDUCED_MS).toBe(1400);
	});

	it("orbit 3x3 走外圈 8 格, 中心不亮; 对勾与叉各自成形", () => {
		expect(gridGroups(3, "orbit").flat()).toEqual([0, 1, 2, 5, 8, 7, 6, 3]);
		expect(gridLevels(3, "orbit", 0)[4]).toBe(0);
		expect(gridLevels(3, "orbit", 1)[1]).toBe(1);
		expect(GRID_MARKS[3].done).toEqual([2, 3, 5, 7]);
		expect(GRID_MARKS[4].error).toHaveLength(8);
	});
});

describe("GridPulse", () => {
	it("working 时每 step 毫秒推进一帧", () => {
		vi.useFakeTimers();
		const { container } = render(<GridPulse step={90} />);
		const first = opacities(container);
		act(() => {
			vi.advanceTimersByTime(90);
		});
		expect(opacities(container)).not.toEqual(first);
	});

	it("完成与失败文案带用时, role=status", () => {
		const { rerender } = render(<GridPulse status="done" elapsed={3.24} />);
		expect(screen.getByRole("status")).toHaveTextContent("Done in 3.2s");
		rerender(<GridPulse status="error" elapsed={1} errorLabel="失败, 用时" />);
		expect(screen.getByRole("status")).toHaveTextContent("失败, 用时 1.0s");
		expect(formatElapsed(-1)).toBe("0.0s");
	});

	it("减弱动效: 不逐帧推进, 全格同亮", async () => {
		mockReducedMotion(true);
		vi.useFakeTimers();
		const { container } = render(<GridPulse />);
		await act(async () => {});
		const first = opacities(container);
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(opacities(container)).toEqual(first);
		expect(new Set(first).size).toBe(1);
	});
});
