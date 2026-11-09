/**
 * pointer 意图: StampTrail (TextCursor).
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STAMP_DEFAULTS, StampTrail, removalTick, stampAngle, stampContent, stampLook } from "@src/surface/text/pointer";
import { mockReducedMotion, useFakeClock } from "./helpers";

afterEach(() => {
	vi.useRealTimers();
});

describe("StampTrail 纯函数", () => {
	it("规格默认值", () => {
		expect(STAMP_DEFAULTS).toMatchObject({ spacing: 88, maxPoints: 7, exitDuration: 0.5, removalInterval: 30, shrink: 0.5, fade: 0.6, smoothing: 0.3, fontSize: 28, fontWeight: 600 });
	});
	it("朝向与保持正立", () => {
		expect(stampAngle(1, 0, true)).toBe(0);
		expect(stampAngle(0, 1, true)).toBe(90);
		expect(stampAngle(-1, 0, false)).toBe(180);
		expect(stampAngle(-1, 0, true)).toBe(0);
		expect(stampAngle(0, 0, true)).toBe(0);
	});
	it("外观: 弹出, 退场到尽头", () => {
		expect(stampLook(0, -1, 0.18, 0.5, 0.5, 0.6).scale).toBe(0);
		expect(stampLook(1, -1, 0.18, 0.5, 0.5, 0.6)).toEqual({ scale: 1, opacity: 1, done: false });
		const end = stampLook(2, 0.5, 0.18, 0.5, 0.5, 0.6);
		expect(end.done).toBe(true);
		expect(end.opacity).toBe(0);
		expect(stampLook(2, 0.25, 0.18, 0.5, 0.5, 0.6).scale).toBeCloseTo(1 - 0.5 * 0.75, 6);
	});
	it("收章节拍与内容", () => {
		expect(removalTick(0, 0.05, 0.03)).toEqual({ count: 1, acc: expect.closeTo(2 / 3, 6) });
		expect(removalTick(0, 0.01, 0.03).count).toBe(0);
		expect(stampContent("Hi you", 0, "stamp")).toBe("Hi you");
		expect(stampContent("Hi you", 2, "trail")).toBe("y");
	});
});

describe("StampTrail", () => {
	it("移动时沿路盖章, 不超过上限, 停下后收走", async () => {
		useFakeClock();
		const { container } = render(
			<StampTrail text="Hi" spacing={20} maxPoints={3} smoothing={0}>
				<p>body</p>
			</StampTrail>,
		);
		const host = container.querySelector("[data-slot='stamp-trail']") as HTMLElement;
		expect(container.querySelectorAll("[data-stamp]").length).toBe(4);
		fireEvent.pointerEnter(host, { clientX: 0, clientY: 0 });
		for (let x = 10; x <= 200; x += 10) {
			fireEvent.pointerMove(host, { clientX: x, clientY: 0 });
			act(() => vi.advanceTimersByTime(16));
		}
		const visible = (): number => Array.from(container.querySelectorAll<HTMLElement>("[data-stamp]")).filter((n) => Number(n.style.opacity) > 0).length;
		expect(visible()).toBeGreaterThan(0);
		expect(visible()).toBeLessThanOrEqual(4);
		expect(container.querySelector("[data-stamp]")?.textContent).toBe("Hi");
		fireEvent.pointerLeave(host);
		for (let i = 0; i < 60; i += 1) act(() => vi.advanceTimersByTime(50));
		expect(visible()).toBe(0);
		vi.useRealTimers();
		await expect(container).toHaveNoSeriousA11yViolations();
	});
	it("减弱动效: 不渲染章, 正文照常", () => {
		const restore = mockReducedMotion(true);
		const { container } = render(
			<StampTrail text="Hi">
				<p>body</p>
			</StampTrail>,
		);
		expect(container.querySelectorAll("[data-stamp]").length).toBe(0);
		expect(container.textContent).toBe("body");
		restore();
	});
});
