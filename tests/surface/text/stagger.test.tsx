/**
 * stagger 意图: StaggerText (BlurText / FoldText / MaskedHeading), TraceText (StrokeText), FocusText (TrueFocus),
 * DropText (FallingText), 以及给现有件补的可选 prop: SplitText, RotatingText, AnimatedNumber / NumberRoll (CountUp).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnimatedNumber } from "@src/motion/AnimatedNumber";
import { RotatingText, rotateCharDelay } from "@src/motion/RotatingText";
import { SplitText } from "@src/motion/SplitText";
import { gapFor } from "@src/craft/NumberRoll";
import {
	DROP_DEFAULTS,
	DropText,
	FOCUS_DEFAULTS,
	FocusText,
	STAGGER_PRESETS,
	StaggerText,
	TRACE_DEFAULTS,
	TraceText,
	dropPose,
	nextFocus,
	traceAt,
} from "@src/surface/text/stagger";
import { mockReducedMotion, useFakeClock } from "./helpers";

afterEach(() => {
	vi.useRealTimers();
});

function advance(ms: number, steps = 20): void {
	for (let i = 0; i < steps; i += 1) act(() => vi.advanceTimersByTime(ms / steps));
}

describe("StaggerText", () => {
	it("规格常数", () => {
		expect(STAGGER_PRESETS.blur).toMatchObject({ step: 0.2, duration: 0.7, blur: 10, distance: 50 });
		expect(STAGGER_PRESETS.fold).toMatchObject({ step: 0.045, duration: 0.65 });
		expect(STAGGER_PRESETS.mask).toMatchObject({ step: 0.09, duration: 1.1 });
	});

	it("模糊入场: 起播前模糊且透明, 播完清晰", () => {
		useFakeClock();
		const { container } = render(<StaggerText text="Hello there" trigger="mount" />);
		const first = container.querySelector("[data-unit='0']") as HTMLElement;
		expect(first.style.opacity).toBe("0");
		expect(first.style.filter).toBe("blur(10px)");
		advance(2000);
		expect(first.style.opacity).toBe("1");
		expect(first.style.filter).toBe("blur(0px)");
	});

	it("读屏读完整原文; 减弱动效直接出原文", async () => {
		const { container, unmount } = render(<StaggerText text="Fold me" variant="fold" trigger="mount" />);
		expect(container.querySelector(".sr-only")?.textContent).toBe("Fold me");
		await expect(container).toHaveNoSeriousA11yViolations();
		unmount();
		const restore = mockReducedMotion(true);
		const { container: plain } = render(<StaggerText text="Fold me" variant="mask" />);
		expect(plain.textContent).toBe("Fold me");
		expect(plain.querySelector("[data-unit]")).toBeNull();
		restore();
	});
});

describe("TraceText", () => {
	it("描边先于填色, 填色在全部描完后开始", () => {
		expect(TRACE_DEFAULTS).toMatchObject({ drawDuration: 1.6, fillDelay: 0.2, stagger: 0.05 });
		const o = { stagger: 0.05, draw: 1.6, fillDelay: 0.2 };
		expect(traceAt(0.8, 0, 3, o).draw).toBeCloseTo(0.5, 6);
		expect(traceAt(1.6, 0, 3, o).fill).toBe(0);
		expect(traceAt(3.0, 0, 3, o).fill).toBe(1);
	});
	it("渲染正文层与 sr-only 原文", () => {
		const { container } = render(<TraceText text="Ink" />);
		expect(container.querySelector(".sr-only")?.textContent).toBe("Ink");
		expect(container.querySelector("svg")).not.toBeNull();
	});
});

describe("FocusText", () => {
	it("依次轮换焦点, 非焦点词模糊", () => {
		useFakeClock();
		expect(FOCUS_DEFAULTS).toMatchObject({ animationDuration: 0.5, blurAmount: 5, pauseBetweenAnimations: 1 });
		const onFocus = vi.fn();
		const { container } = render(<FocusText sentence="Alpha Beta Gamma" onFocusChange={onFocus} />);
		const words = container.querySelectorAll("[aria-hidden='true'][style]");
		expect((words[1] as HTMLElement).style.filter).toBe("blur(5px)");
		act(() => vi.advanceTimersByTime(1500));
		expect(onFocus).toHaveBeenLastCalledWith(1);
		expect(nextFocus(2, 3, "sequential", 0)).toBe(0);
		expect(nextFocus(1, 3, "random", 5)).not.toBe(1);
	});
	it("手动模式跟随悬停", () => {
		const { container } = render(<FocusText sentence="One Two" manualMode />);
		const two = container.querySelectorAll("[aria-hidden='true'][style]")[1] as HTMLElement;
		fireEvent.pointerEnter(two);
		expect(two.dataset.focused).toBe("true");
	});
});

describe("DropText", () => {
	it("落点不出容器, 点击触发后标记已落", () => {
		expect(DROP_DEFAULTS).toMatchObject({ bounciness: 0.2, scatter: 0.5, stagger: 0.03 });
		const box = new DOMRect(0, 0, 200, 100);
		const cell = new DOMRect(10, 0, 40, 20);
		const pose = dropPose(1, cell, box, 1);
		expect(pose.y).toBe(80);
		expect(pose.x).toBeGreaterThanOrEqual(-10);
		expect(pose.x).toBeLessThanOrEqual(150);
		render(<DropText text="fall down" trigger="click" />);
		const root = document.querySelector("[data-slot='drop-text']") as HTMLElement;
		fireEvent.click(root);
		expect(root.dataset.fallen).toBe("true");
		expect(screen.getByText("fall down", { selector: ".sr-only" })).toBeInTheDocument();
	});
});

describe("现有件的可选补充", () => {
	it("SplitText: staggerFrom 与 mask 不改默认渲染", () => {
		const { container } = render(<SplitText text="ab" trigger="mount" staggerFrom="center" mask />);
		expect(container.querySelectorAll(".overflow-hidden").length).toBe(2);
	});
	it("RotatingText: 逐字延迟三种起点", () => {
		expect(rotateCharDelay(0, 5, 0.1, "first")).toBe(0);
		expect(rotateCharDelay(0, 5, 0.1, "last")).toBeCloseTo(0.4, 9);
		expect(rotateCharDelay(2, 5, 0.1, "center")).toBe(0);
		const { container } = render(<RotatingText words={["abc", "de"]} stagger={0.03} />);
		expect(container.querySelectorAll(".whitespace-pre").length).toBe(3);
	});
	it("CountUp: 位间错峰封顶, 前后缀进读屏文本", () => {
		expect(gapFor(3)).toBe(70);
		expect(gapFor(41, 2000)).toBeCloseTo(20, 9);
		const { container } = render(<AnimatedNumber value={42} prefix="$" suffix="+" duration={1} />);
		expect(container.querySelector(".sr-only")?.textContent).toBe("$42+");
	});
});
