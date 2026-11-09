/**
 * TallyRoll: 切字与定键, 滚向与目标格, 错峰与过冲上限, 读屏终值, 减弱动效直接终值.
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TallyRoll } from "@src/controls/range/meter/TallyRoll";
import {
	TALLY_BLUR_CAP,
	tallyAt,
	tallyBlur,
	tallyCell,
	tallyFormatter,
	tallyGap,
	tallyGlyphs,
	tallyHeading,
	tallyOvershoot,
	tallyTarget,
} from "@src/controls/range/meter/tally-digits";
import { DIGIT_OVERSHOOT } from "@src/craft/tokens";
import { mockReducedMotion } from "./helpers";

afterEach(() => vi.restoreAllMocks());

describe("TallyRoll 纯逻辑", () => {
	it("千分位与小数点是静止槽, 位的键按右侧位数定", () => {
		const f = tallyFormatter({ locale: "en-US", decimals: 1 });
		const glyphs = tallyGlyphs(1234.5, f);
		expect(glyphs.map((g) => (g.kind === "digit" ? g.digit : g.char)).join("")).toBe("1,234.5");
		const digitKeys = glyphs.filter((g) => g.kind === "digit").map((g) => g.key);
		expect(digitKeys).toEqual(["d4", "d3", "d2", "d1", "d0"]);
		const small = tallyGlyphs(9.5, f).filter((g) => g.kind === "digit").map((g) => g.key);
		expect(small).toEqual(["d1", "d0"]);
	});

	it("minDigits 补零, 非拉丁 locale 仍出拉丁数码", () => {
		expect(tallyFormatter({ minDigits: 3 }).format(7)).toBe("007");
		expect(tallyFormatter({ locale: "ar-EG" }).format(42)).toMatch(/42/);
	});

	it("滚向: auto 跟增减, up / down 固定", () => {
		expect(tallyHeading("auto", 1, 5)).toBe(1);
		expect(tallyHeading("auto", 5, 1)).toBe(-1);
		expect(tallyHeading("up", 5, 1)).toBe(1);
		expect(tallyHeading("down", 1, 5)).toBe(-1);
	});

	it("目标格: 往上从 9 滚到 0 只走一格, 中途改目标从当前小数继续", () => {
		expect(tallyTarget(9, 0, 1)).toBe(10);
		expect(tallyTarget(9, 0, -1)).toBe(0);
		expect(tallyTarget(3.4, 5, 1)).toBe(5);
		expect(tallyTarget(3.4, 2, 1)).toBe(12);
		expect(tallyCell(12)).toBe(2);
		expect(tallyCell(-1)).toBe(9);
	});

	it("错峰 min(stagger, 时长 40% / (n-1)), 过冲不超过 0.06 位", () => {
		expect(tallyGap(1, 700, 70)).toBe(0);
		expect(tallyGap(3, 700, 70)).toBe(70);
		expect(tallyGap(9, 700, 70)).toBeCloseTo(35, 6);
		const peak = (bounce: number): number => {
			const run = { from: 0, to: 1, start: 0, delay: 0 };
			let top = 0;
			for (let t = 0; t <= 700; t += 1) top = Math.max(top, tallyAt(run, t, 700, tallyOvershoot(bounce)).position);
			return top - 1;
		};
		expect(tallyOvershoot(0)).toBe(0);
		expect(tallyOvershoot(1)).toBe(tallyOvershoot(0.2));
		expect(peak(0.2)).toBeLessThanOrEqual(DIGIT_OVERSHOOT);
		expect(peak(0.2)).toBeGreaterThan(DIGIT_OVERSHOOT - 0.002);
		expect(peak(0.1)).toBeCloseTo(DIGIT_OVERSHOOT / 2, 2);
	});

	it("线性时钟: 终点恰在整数格, 全程不越过 0.06 位", () => {
		const run = { from: 0, to: 1, start: 0, delay: 0 };
		let peak = 0;
		for (let t = 0; t <= 700; t += 5) peak = Math.max(peak, tallyAt(run, t, 700, tallyOvershoot(1)).position);
		expect(peak).toBeLessThanOrEqual(1 + DIGIT_OVERSHOOT + 1e-9);
		expect(tallyAt(run, 700, 700, tallyOvershoot(1))).toEqual({ position: 1, done: true });
		expect(tallyBlur(1e6, 20)).toBeCloseTo(20 * TALLY_BLUR_CAP, 9);
	});
});

describe("TallyRoll 渲染", () => {
	it("读屏只读终值 (含前后缀), 条带 aria-hidden", () => {
		mockReducedMotion(false);
		const { container } = render(<TallyRoll value={1234} prefix="$" suffix=" USD" intro={false} />);
		expect(container.querySelector(".sr-only")?.textContent).toBe("$1,234 USD");
		expect(container.querySelector("[aria-hidden]")).not.toBeNull();
	});

	it("intro 关时挂上即停在终值格", () => {
		mockReducedMotion(false);
		const { container } = render(<TallyRoll value={7} intro={false} motionBlur={false} />);
		const strip = container.querySelector<HTMLElement>(".will-change-transform");
		expect(strip?.style.transform).toBe("translateY(-8.4em)");
	});

	it("减弱动效: 不建条带, 直接写终值; 改值同样直接到位", async () => {
		mockReducedMotion(true);
		const { container, rerender } = render(<TallyRoll value={42} />);
		expect(container.querySelector(".will-change-transform")).toBeNull();
		await act(async () => {
			rerender(<TallyRoll value={1005} />);
		});
		const visual = container.querySelector("[aria-hidden]");
		expect(visual?.textContent).toBe("1,005");
		expect(container.querySelector(".sr-only")?.textContent).toBe("1,005");
	});

	it("loading 时显示终值宽度的骨架, 读屏不读", () => {
		mockReducedMotion(false);
		const { container } = render(<TallyRoll value={88} loading />);
		expect(container.querySelector("[data-loading]")).not.toBeNull();
		expect(container.querySelector(".sr-only")?.textContent).toBe("");
	});
});
