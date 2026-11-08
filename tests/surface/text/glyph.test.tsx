/**
 * glyph 意图 (DOM 件): ScrambleText (DecryptedText / ScrambledText / Shuffle), FlapText (SplitFlapText),
 * TypeText (TextType), SheenText (GradientText / ShinyText), ShiftText (GlitchText).
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	FLAP_DEFAULTS,
	FlapText,
	SCRAMBLE_DEFAULTS,
	SCRAMBLE_POINTER,
	SHUFFLE_DEFAULTS,
	ScrambleText,
	SheenText,
	ShiftText,
	TYPE_DEFAULTS,
	TypeText,
	padBoard,
	scrambleLocks,
	scrambleUntil,
	sheenPhase,
	shiftSlice,
	shinePhase,
	typeFrame,
	type TypeTiming,
} from "@src/surface/text/glyph";
import { mockReducedMotion, useFakeClock } from "./helpers";

afterEach(() => {
	vi.useRealTimers();
});

function advance(ms: number, steps = 40): void {
	for (let i = 0; i < steps; i += 1) act(() => vi.advanceTimersByTime(ms / steps));
}

describe("ScrambleText", () => {
	it("规格常数与停格时刻", () => {
		expect(SCRAMBLE_DEFAULTS).toEqual({ speed: 50, maxIterations: 10, loopDelay: 2000 });
		expect(SCRAMBLE_POINTER).toEqual({ radius: 100, duration: 1.2, chars: ".:" });
		expect(SHUFFLE_DEFAULTS).toEqual({ stagger: 0.03, shuffleTimes: 1, duration: 0.35 });
		const o = { sequential: false, from: "start", speed: 50, step: 50, lead: 0, maxIterations: 10 } as const;
		expect(scrambleLocks(3, o)).toEqual([500, 500, 500]);
		expect(scrambleLocks(3, { ...o, sequential: true })).toEqual([0, 50, 100]);
		expect(scrambleLocks(4, { ...o, sequential: true, from: "evenodd", step: 30, lead: 350 })).toEqual([410, 350, 440, 380]);
		expect(scrambleUntil(0, 50, 100, 1.2)).toBe(600);
		expect(scrambleUntil(0, 120, 100, 1.2)).toBe(Number.NEGATIVE_INFINITY);
	});
	it("mount 起播: 先乱码, 走完停在原文", () => {
		useFakeClock();
		const { container } = render(<ScrambleText text="HELLO" animateOn="mount" sequential characters="#" />);
		const visual = container.querySelector("[aria-hidden='true']") as HTMLElement;
		advance(60, 3);
		expect(visual.textContent).toContain("#");
		advance(600);
		expect(visual.textContent).toBe("HELLO");
		expect(container.querySelector(".sr-only")?.textContent).toBe("HELLO");
	});
	it("减弱动效: 只有原文", () => {
		const restore = mockReducedMotion(true);
		const { container } = render(<ScrambleText text="Plain" mode="pointer" />);
		expect(container.textContent).toBe("Plain");
		restore();
	});
});

describe("FlapText", () => {
	it("补格与对齐, 翻完停在目标词", () => {
		expect(FLAP_DEFAULTS).toMatchObject({ flipDuration: 0.12, stagger: 0.06, cycleDelay: 2400, flipsPerChar: 8, padTo: 12 });
		expect(padBoard("ab", 4, "right")).toEqual([" ", " ", "A", "B"]);
		expect(padBoard("ab", 5, "center")).toEqual([" ", "A", "B", " ", " "]);
		useFakeClock();
		const { container } = render(<FlapText words={["GO"]} padTo={2} trigger="mount" loop={false} />);
		advance(3000);
		const tiles = container.querySelectorAll("[data-slot='flap-text'] > [aria-hidden='true']");
		expect(Array.from(tiles).map((t) => t.textContent?.[0])).toEqual(["G", "O"]);
		expect(container.querySelector(".sr-only")?.textContent).toBe("GO");
	});
});

describe("TypeText", () => {
	const timing: TypeTiming = { typing: () => 50, deleting: 30, pause: 2000, loop: true, deleteMode: "backspace" };
	it("状态机: 打字, 停顿, 退格, 换句", () => {
		expect(TYPE_DEFAULTS).toMatchObject({ typingSpeed: 50, deletingSpeed: 30, pauseDuration: 2000, cursorBlinkDuration: 0.5 });
		expect(typeFrame([3, 2], 120, timing)).toEqual({ index: 0, count: 2, phase: "typing" });
		expect(typeFrame([3, 2], 500, timing)).toEqual({ index: 0, count: 3, phase: "pause" });
		expect(typeFrame([3, 2], 2160, timing)).toEqual({ index: 0, count: 2, phase: "deleting" });
		expect(typeFrame([3, 2], 2250, timing).index).toBe(1);
		expect(typeFrame([3], 400, { ...timing, loop: false }).phase).toBe("done");
	});
	it("渲染: 打完第一句并回调", () => {
		useFakeClock();
		const done = vi.fn();
		const { container } = render(<TypeText text={["Hi", "Yo"]} onSentenceComplete={done} />);
		advance(400, 10);
		expect(done).toHaveBeenCalledWith("Hi", 0);
		expect(container.querySelector(".sr-only")?.textContent).toBe("Hi Yo");
	});
});

describe("SheenText", () => {
	it("相位: 往返与单向", () => {
		expect(sheenPhase(500, 1000, false)).toBe(0.5);
		expect(sheenPhase(1500, 1000, true)).toBe(0.5);
		expect(shinePhase(1000, 2000, 0, false)).toBe(0.5);
		expect(shinePhase(3000, 2000, 0, true)).toBe(0.5);
	});
	it("颜色只用 token 变量", () => {
		const { container } = render(<SheenText text="Glow" />);
		const layer = container.querySelector(".bg-clip-text") as HTMLElement;
		expect(layer.style.backgroundImage).toContain("var(--primary)");
	});
});

describe("ShiftText", () => {
	it("切片确定且在范围内; 点击触发不报错", () => {
		const a = shiftSlice(3, 0, "slices", 10, 0.5);
		expect(shiftSlice(3, 0, "slices", 10, 0.5)).toEqual(a);
		expect(Math.abs(a.dx)).toBeLessThanOrEqual(5);
		expect(a.top + a.bottom).toBeLessThanOrEqual(100);
		const { container } = render(<ShiftText text="Shift" trigger="click" />);
		fireEvent.click(container.firstElementChild as Element);
		expect(container.querySelectorAll(".text-danger").length).toBe(1);
	});
});
