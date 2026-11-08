/**
 * compose/status: DevelopFrame (RefineFrame), ReasoningTrace (ThoughtLine).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DevelopFrame } from "../../../src/controls/compose/status/DevelopFrame";
import { ReasoningTrace, breathTrough, glyphSwapAt } from "../../../src/controls/compose/status/ReasoningTrace";
import { blurFor, developApproach, stripReveal } from "../../../src/controls/compose/status/develop-veil";
import { DEVELOP, TRACE } from "../../../src/controls/compose/tokens";

afterEach(() => {
	vi.restoreAllMocks();
});

/** 打开减弱动效: 不起 WAAPI 循环, 卸载时不留被取消的 finished promise. */
function reduceMotion(): void {
	vi.spyOn(window, "matchMedia").mockImplementation(
		(query: string) =>
			({
				matches: query.includes("reduce"),
				media: query,
				onchange: null,
				addListener: () => undefined,
				removeListener: () => undefined,
				addEventListener: () => undefined,
				removeEventListener: () => undefined,
				dispatchEvent: () => false,
			}) as unknown as MediaQueryList,
	);
}

describe("DevelopFrame", () => {
	it("进度追随不越过目标, 模糊逐档收清, 上方条带先揭开", () => {
		const p = developApproach(0, 1, 0.1, DEVELOP.stageMs);
		expect(p).toBeGreaterThan(0);
		expect(p).toBeLessThan(1);
		expect(blurFor(0)).toBe(DEVELOP.levels[0]);
		expect(blurFor(1)).toBe(0);
		expect(stripReveal(0.5, 0, DEVELOP.strips)).toBeGreaterThan(stripReveal(0.5, DEVELOP.strips - 1, DEVELOP.strips));
	});

	it("失败给重试键, 完成时不忙", () => {
		const onRetry = vi.fn();
		const { rerender, container } = render(<DevelopFrame status="error" onRetry={onRetry} />);
		fireEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(onRetry).toHaveBeenCalledTimes(1);
		rerender(<DevelopFrame status="complete" />);
		expect(container.querySelector("[data-slot=develop-frame]")).toHaveAttribute("aria-busy", "false");
	});
});

describe("ReasoningTrace", () => {
	it("呼吸谷底与换勾时刻", () => {
		expect(breathTrough(TRACE.breathDepth)).toBeCloseTo(1 - TRACE.breathDepth, 6);
		expect(breathTrough(2)).toBe(0);
		expect(glyphSwapAt(TRACE.settleMs)).toBeCloseTo(TRACE.settleMs * TRACE.glyphDone, 6);
	});

	it("工作中显示状态文字", () => {
		reduceMotion();
		const { container } = render(<ReasoningTrace label="Thinking" />);
		expect(screen.getByRole("status")).toHaveTextContent("Thinking");
		expect(container.querySelector("[data-slot=reasoning-trace]")).toHaveAttribute("data-state", "working");
	});
});
