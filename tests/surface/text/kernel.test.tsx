/**
 * 文本族内核: 拆分, 错峰, 曲线, 按位停格, 滚动进度, 播放头与外壳的无障碍.
 */
import { act, render } from "@testing-library/react";
import { useRef, type JSX } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	STAGGER_CAP_S,
	STAGGER_SHARE,
	TextShell,
	cappedStep,
	falloff,
	lockTimes,
	midpoint,
	rollGlyph,
	settleAt,
	smoothstep,
	splitCells,
	splitText,
	staggerRanks,
	unitProgress,
	unitSpan,
	usePlayhead,
	viewProgress,
	type PlayheadOptions,
} from "@src/surface/text/kernel";
import { useFakeClock } from "./helpers";

afterEach(() => {
	vi.useRealTimers();
});

describe("splitText", () => {
	it("按字: 空白不编号, 编号连续", () => {
		const { groups, count } = splitText("ab cd", "char");
		expect(count).toBe(4);
		expect(groups.map((g) => g.space)).toEqual([false, true, false]);
		expect(groups[2].units.map((u) => u.index)).toEqual([2, 3]);
	});
	it("按词与表情不拆坏", () => {
		expect(splitText("hello  world", "word").count).toBe(2);
		expect(splitText("a👍🏽", "char").count).toBe(2);
		expect(splitCells("a b").map((c) => c.space)).toEqual([false, true, false]);
	});
});

describe("错峰", () => {
	it("名次: start / end / center / edges / evenodd / random 是排列", () => {
		expect(staggerRanks(4, "start")).toEqual([0, 1, 2, 3]);
		expect(staggerRanks(4, "end")).toEqual([3, 2, 1, 0]);
		expect(staggerRanks(5, "center")).toEqual([2, 1, 0, 1, 2]);
		expect(staggerRanks(5, "edges")).toEqual([0, 1, 2, 1, 0]);
		expect(staggerRanks(5, "evenodd")).toEqual([2, 0, 3, 1, 4]);
		expect([...staggerRanks(6, "random")].sort()).toEqual([0, 1, 2, 3, 4, 5]);
	});
	it("封顶间隔: 不超过 0.07s, 总量不超过 40%", () => {
		expect(STAGGER_CAP_S).toBe(0.07);
		expect(STAGGER_SHARE).toBe(0.4);
		expect(cappedStep(3, 2)).toBe(0.07);
		expect(cappedStep(41, 2)).toBeCloseTo(0.02, 9);
		expect(cappedStep(1, 2)).toBe(0);
		const step = cappedStep(41, 2);
		expect(unitSpan(41, 2, step)).toBeCloseTo(1.2, 9);
		expect(unitProgress(0.5, 10, step, 1.2)).toBeCloseTo((0.5 - 0.2) / 1.2, 9);
		expect(unitProgress(0.1, 10, step, 1.2)).toBe(0);
	});
});

describe("曲线", () => {
	it("模糊中点: 一半进度停在 mid", () => {
		expect(midpoint(0, 10, 5, 0)).toBe(10);
		expect(midpoint(0.5, 10, 5, 0)).toBe(5);
		expect(midpoint(1, 10, 5, 0)).toBe(0);
	});
	it("衰减: 半径外为 0, 中心为 1", () => {
		for (const kind of ["linear", "exponential", "gaussian"] as const) {
			expect(falloff(0, 100, kind)).toBeCloseTo(1, 6);
			expect(falloff(100, 100, kind)).toBe(0);
		}
		expect(smoothstep(0, 1, 0.5)).toBe(0.5);
	});
});

describe("按位停格", () => {
	it("到点停在原文, 之前是乱码, 空白不乱", () => {
		const target = Array.from("AB C");
		const locks = lockTimes(4, "start", 100, 0);
		const mid = settleAt(target, 150, locks, "xyz");
		expect(mid.cells[0]).toBe("A");
		expect(mid.cells[1]).toBe("B");
		expect(mid.cells[2]).toBe(" ");
		expect("xyz").toContain(mid.cells[3]);
		expect(settleAt(target, 400, locks, "xyz").done).toBe(true);
	});
	it("滚轮: 走 flips 步到终字", () => {
		const pool = Array.from("ABCDEFGH");
		expect(rollGlyph(pool, "A", "D", 8, 0, 10).char).toBe("A");
		const half = rollGlyph(pool, "A", "D", 8, 15, 10);
		expect(half.char).toBe("B");
		expect(half.phase).toBeCloseTo(0.5, 6);
		expect(rollGlyph(pool, "A", "D", 8, 30, 10)).toMatchObject({ char: "D", done: true });
		expect(rollGlyph(pool, "?", "D", 2, 0, 10).char).toBe("B");
	});
});

describe("滚动进度", () => {
	it("顶边到视口底为 0, 底边到视口顶为 1", () => {
		expect(viewProgress(800, 200, 800)).toBe(0);
		expect(viewProgress(-200, 200, 800)).toBe(1);
		expect(viewProgress(300, 200, 800)).toBeCloseTo(0.5, 6);
	});
});

function Probe(props: Omit<PlayheadOptions, "durationMs"> & { readonly onTick: (p: number) => void }): JSX.Element {
	const ref = useRef<HTMLSpanElement>(null);
	const head = usePlayhead(ref, { durationMs: 1000, ...props });
	props.onTick(head.progress);
	return <span ref={ref} {...head.bind} />;
}

describe("usePlayhead", () => {
	it("mount 触发: 走完后停在 1 并回调", () => {
		useFakeClock();
		const seen: number[] = [];
		const done = vi.fn();
		render(<Probe trigger="mount" reduced={false} onComplete={done} onTick={(p) => seen.push(p)} />);
		for (let i = 0; i < 30; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(seen.at(-1)).toBe(1);
		expect(done).toHaveBeenCalledTimes(1);
		expect(seen.some((p) => p > 0 && p < 1)).toBe(true);
	});
	it("减弱动效: 首帧就在终点", () => {
		const seen: number[] = [];
		render(<Probe trigger="view" reduced onTick={(p) => seen.push(p)} />);
		expect(seen[0]).toBe(1);
	});
});

describe("TextShell", () => {
	it("读屏读完整原文, 视觉层 aria-hidden", async () => {
		const { container } = render(
			<TextShell text="Hello world" slot="probe">
				<span>H</span>
			</TextShell>,
		);
		expect(container.querySelector(".sr-only")?.textContent).toBe("Hello world");
		expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
		await expect(container).toHaveNoSeriousA11yViolations();
	});
});
