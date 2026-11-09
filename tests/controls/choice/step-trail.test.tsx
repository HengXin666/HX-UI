/**
 * choice/steps: StepTrail (规格 Stepper). 状态与填充纯函数, 前进后退, 完成, 跳步, 受控, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StepTrail, TRAIL_EASE_SPRING, TRAIL_MS, trailClamp, trailFill, trailState } from "@src/controls/choice/steps/StepTrail";
import { manualFrames, mockReducedMotion, spyAnimate } from "./support";

function Flow(props: Partial<Parameters<typeof StepTrail>[0]>) {
	return (
		<StepTrail {...props}>
			<p>one</p>
			<p>two</p>
			<p>three</p>
		</StepTrail>
	);
}

describe("StepTrail 纯逻辑", () => {
	it("规格常数", () => {
		expect(TRAIL_EASE_SPRING).toBe("cubic-bezier(0.34, 1.4, 0.64, 1)");
		expect(TRAIL_MS).toMatchObject({ dot: 250, dotScale: 450, button: 150, track: 200 });
	});

	it("状态, 填充, 钳制", () => {
		expect([1, 2, 3].map((i) => trailState(i, 2))).toEqual(["complete", "active", "idle"]);
		expect(trailFill(1, 0)).toBe(0);
		expect(trailFill(1, 0.5)).toBe(0.5);
		expect(trailFill(2, 3)).toBe(1);
		expect(trailClamp(9, 3)).toBe(4);
		expect(trailClamp(0, 3)).toBe(1);
	});
});

describe("StepTrail", () => {
	it("Continue / Back 换步, 最后一步 Complete 后收起", () => {
		mockReducedMotion(false);
		manualFrames();
		spyAnimate();
		const onStepChange = vi.fn();
		const onComplete = vi.fn();
		const { container } = render(<Flow onStepChange={onStepChange} onComplete={onComplete} />);
		expect(screen.getByText("one")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));
		expect(screen.getByText("two")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Step 2" })).toHaveAttribute("aria-current", "step");
		fireEvent.click(screen.getByRole("button", { name: "Back" }));
		expect(onStepChange.mock.calls).toEqual([[2], [1]]);
		fireEvent.click(screen.getByRole("button", { name: "Step 3" }));
		fireEvent.click(screen.getByRole("button", { name: "Complete" }));
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(container.querySelector("[data-slot='step-trail']")).toHaveAttribute("data-state", "complete");
		expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
	});

	it("连线填充由弹簧逐帧推进", () => {
		mockReducedMotion(false);
		const frames = manualFrames();
		const { container } = render(<Flow />);
		const fill = container.querySelector("[data-slot='step-trail-fill']") as HTMLElement;
		expect(fill.style.transform).toBe("scaleX(0)");
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));
		act(() => frames.flush(3));
		expect(fill.style.transform).not.toBe("scaleX(0)");
		act(() => frames.flush(200));
		expect(fill.style.transform).toBe("scaleX(1)");
	});

	it("受控: 只回调不自行换步; nextDisabled 时不能前进", () => {
		const onStepChange = vi.fn();
		render(<Flow step={2} onStepChange={onStepChange} nextDisabled />);
		expect(screen.getByText("two")).toBeInTheDocument();
		const next = screen.getByRole("button", { name: "Continue" });
		expect(next).toBeDisabled();
		fireEvent.click(screen.getByRole("button", { name: "Back" }));
		expect(onStepChange).toHaveBeenLastCalledWith(1);
		expect(screen.getByText("two")).toBeInTheDocument();
	});

	it("减弱动效: 填充直接到终值, 指示点不放大, 勾不描画", () => {
		mockReducedMotion(true);
		manualFrames();
		const animate = spyAnimate();
		const { container } = render(<Flow initialStep={2} />);
		const fill = container.querySelector("[data-slot='step-trail-fill']") as HTMLElement;
		expect(fill.style.transform).toBe("scaleX(1)");
		const dot = screen.getByRole("button", { name: "Step 2" });
		expect(dot.style.transform).toBe("scale(1)");
		expect(dot.style.transition).toContain("0ms");
		expect(animate).not.toHaveBeenCalled();
	});
});
