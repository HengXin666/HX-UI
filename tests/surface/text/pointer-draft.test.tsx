/**
 * pointer 意图: DraftText (TechText).
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	DRAFT_DEFAULTS,
	DRAFT_INTRO_DELAY_S,
	DRAFT_KICK_DECAY,
	DRAFT_SPRING,
	DraftText,
	draftDamping,
	kickShare,
	nearestGlyph,
	outlineAmount,
	springBack,
	typeShown,
} from "@src/surface/text/pointer";
import { mockReducedMotion, useFakeClock } from "./helpers";

afterEach(() => {
	vi.useRealTimers();
});

describe("DraftText 纯函数", () => {
	it("规格常数与阻尼", () => {
		expect(DRAFT_SPRING).toBe(320);
		expect(DRAFT_INTRO_DELAY_S).toBe(0.15);
		expect(DRAFT_KICK_DECAY).toBe(0.62);
		expect(DRAFT_DEFAULTS).toMatchObject({ reach: 200, softness: 0.7, dashLength: 4, dashGap: 2, strokeWidth: 1.5, bounce: 0.4 });
		expect(draftDamping(0)).toBeCloseTo(2 * Math.sqrt(320), 6);
		expect(draftDamping(0.4)).toBeCloseTo(2 * Math.sqrt(320) * (1 - 0.4 * 0.96), 6);
	});
	it("回弹收敛到 0", () => {
		const g = { x: 40, y: -20, vx: 0, vy: 0 };
		for (let i = 0; i < 300; i += 1) springBack(g, draftDamping(0.4), 1 / 60);
		expect(Math.abs(g.x)).toBeLessThan(0.01);
		expect(Math.abs(g.y)).toBeLessThan(0.01);
	});
	it("描边量分档, 踢开衰减, 打字入场, 最近格", () => {
		expect(outlineAmount(0, 200, 0.7)).toBe(1);
		expect(outlineAmount(250, 200, 0.7)).toBe(0);
		expect((outlineAmount(120, 200, 0.7) * 8) % 1).toBe(0);
		expect(kickShare(3, 3)).toBe(1);
		expect(kickShare(1, 3)).toBeCloseTo(0.62 ** 2, 6);
		expect(typeShown(0, 0.1, 0.15, 0.06)).toBe(0);
		expect(typeShown(1, 0.15 + 0.12, 0.15, 0.06)).toBe(1);
		expect(nearestGlyph(9, 0, [{ x: 0, y: 0 }, { x: 10, y: 0 }], 200)).toBe(1);
		expect(nearestGlyph(500, 0, [{ x: 0, y: 0 }], 200)).toBe(-1);
	});
});

describe("DraftText", () => {
	it("逐字拆格, 读屏读原文, 无严重无障碍问题", async () => {
		const { container } = render(<DraftText text="Tech" />);
		expect(container.querySelectorAll("[data-glyph]").length).toBe(4);
		expect(container.querySelector(".sr-only")?.textContent).toBe("Tech");
		await expect(container).toHaveNoSeriousA11yViolations();
	});
	it("指针进来: 辅助线显出, 近处字形转描边", () => {
		useFakeClock();
		const { container } = render(<DraftText text="AB" />);
		const host = container.querySelector("[data-slot='draft-text']") as HTMLElement;
		fireEvent.pointerEnter(host, { clientX: 0, clientY: 0 });
		for (let i = 0; i < 20; i += 1) act(() => vi.advanceTimersByTime(25));
		const g = container.querySelector("[data-part='guides']") as SVGElement;
		expect(Number(g.style.opacity)).toBeGreaterThan(0.9);
		const a = container.querySelector("[data-glyph='0']") as HTMLElement;
		expect(Number.parseFloat(a.style.getPropertyValue("--hx-edge"))).toBeGreaterThan(95);
	});
	it("点击踢开后回弹", () => {
		useFakeClock();
		const { container } = render(<DraftText text="AB" />);
		const host = container.querySelector("[data-slot='draft-text']") as HTMLElement;
		const a = container.querySelector("[data-glyph='0']") as HTMLElement;
		fireEvent.pointerEnter(host, { clientX: 0, clientY: 0 });
		fireEvent.pointerDown(host, { clientX: 0, clientY: 0 });
		fireEvent.pointerUp(host);
		act(() => vi.advanceTimersByTime(50));
		expect(a.style.transform).toMatch(/translate\(0px, -\d/);
		for (let i = 0; i < 80; i += 1) act(() => vi.advanceTimersByTime(25));
		expect(Math.abs(Number(/, (-?[\d.e-]+)px/.exec(a.style.transform)?.[1] ?? 0))).toBeLessThan(0.5);
	});
	it("减弱动效: 不起帧, 原样显示", () => {
		const restore = mockReducedMotion(true);
		useFakeClock();
		const { container } = render(<DraftText text="AB" intro="type" />);
		const a = container.querySelector("[data-glyph='0']") as HTMLElement;
		for (let i = 0; i < 10; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(a.style.opacity).toBe("1");
		expect(a.style.transform).toBe("");
		restore();
	});
});
