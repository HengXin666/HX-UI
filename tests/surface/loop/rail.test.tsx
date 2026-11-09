/**
 * loop 意图: MarkRail (LogoLoop).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkRail, RAIL, copiesNeeded, flingVelocity, introOpacity, wrapOffset } from "@src/surface/loop";
import { mockReducedMotion, useFakeClock } from "../text/helpers";

afterEach(() => {
	vi.useRealTimers();
});

const ITEMS = [
	{ content: "A", label: "Alpha", href: "#a" },
	{ content: "B", label: "Beta" },
	{ content: "C", label: "Gamma", href: "#c" },
];

describe("MarkRail 纯函数", () => {
	it("规格常数", () => {
		expect(RAIL).toMatchObject({ smoothTauS: 0.25, glideTauS: 0.8, dragThresholdPx: 6, maxFling: 4000, introS: 0.7, introStaggerS: 0.45 });
	});
	it("偏移折回与副本数", () => {
		expect(wrapOffset(-250, 100)).toBe(-50);
		expect(wrapOffset(30, 100)).toBe(-70);
		expect(wrapOffset(-100, 100)).toBe(-0);
		expect(wrapOffset(42, 0)).toBe(42);
		expect(copiesNeeded(500, 200)).toBe(4);
		expect(copiesNeeded(100, 400)).toBe(2);
		expect(copiesNeeded(100, 0)).toBe(2);
	});
	it("甩出钳制与入场错峰", () => {
		expect(flingVelocity(9000, 4000)).toBe(4000);
		expect(flingVelocity(-9000, 4000)).toBe(-4000);
		expect(introOpacity(0, 0, 3, 0.7, 0.45)).toBe(0);
		expect(introOpacity(0.7, 0, 3, 0.7, 0.45)).toBe(1);
		expect(introOpacity(0.45, 2, 3, 0.7, 0.45)).toBe(0);
		expect(introOpacity(1.15, 2, 3, 0.7, 0.45)).toBe(1);
	});
});

describe("MarkRail", () => {
	it("读屏只读第一份, 副本链接不进 Tab 序, 帧推进时移动", async () => {
		const { container } = render(<MarkRail items={ITEMS} label="Partners" />);
		expect(screen.getByRole("list", { name: "Partners" })).toBeTruthy();
		const copies = container.querySelectorAll("[data-rail-copy]");
		expect(copies.length).toBe(2);
		expect(copies[1].getAttribute("aria-hidden")).toBe("true");
		copies[1].querySelectorAll("a").forEach((a) => expect(a.getAttribute("tabindex")).toBe("-1"));
		await expect(container).toHaveNoSeriousA11yViolations();
		useFakeClock();
		const { container: c2 } = render(<MarkRail items={ITEMS} label="Again" speed={100} />);
		for (let i = 0; i < 30; i += 1) act(() => vi.advanceTimersByTime(50));
		const track = c2.querySelector("[data-slot='mark-rail'] > div") as HTMLElement;
		const x = Number(/translate3d\((-?[\d.]+)px/.exec(track.style.transform)?.[1]);
		expect(x).toBeLessThan(-10);
		expect(Number((c2.querySelector("[data-rail-index='2']") as HTMLElement).style.opacity)).toBe(1);
	});
	it("拖过阈值后吞掉一次点击, 向右拖时偏移跟手", () => {
		useFakeClock();
		const onClick = vi.fn();
		const { container } = render(
			<div onClick={onClick}>
				<MarkRail items={ITEMS} label="Drag" speed={0} intro={false} />
			</div>,
		);
		const host = container.querySelector("[data-slot='mark-rail']") as HTMLElement;
		fireEvent.pointerDown(host, { button: 0, pointerId: 1, clientX: 0 });
		fireEvent.pointerMove(host, { pointerId: 1, clientX: 40 });
		fireEvent.pointerUp(host, { pointerId: 1, clientX: 40 });
		fireEvent.click(host);
		expect(onClick).not.toHaveBeenCalled();
		fireEvent.click(host);
		expect(onClick).toHaveBeenCalledTimes(1);
		act(() => vi.advanceTimersByTime(32));
		const track = host.firstElementChild as HTMLElement;
		expect(Number(/translate3d\((-?[\d.]+)px/.exec(track.style.transform)?.[1])).toBeGreaterThanOrEqual(40);
	});
	it("减弱动效: 一份, 不动, 可横向滚动", () => {
		const restore = mockReducedMotion(true);
		const { container } = render(<MarkRail items={ITEMS} label="Still" />);
		expect(container.querySelectorAll("[data-rail-copy]").length).toBe(1);
		const host = container.querySelector("[data-slot='mark-rail']") as HTMLElement;
		expect(host.className).toContain("overflow-x-auto");
		expect((host.firstElementChild as HTMLElement).style.transform).toBe("");
		restore();
	});
});
