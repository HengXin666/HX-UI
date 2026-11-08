/**
 * evade 子族: EvadeZone (DodgeField), StashFolder (FolderFloat). 纯函数, 回调与减弱动效分支.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EvadeZone } from "../../../src/controls/dismiss/evade/EvadeZone";
import { StashFolder } from "../../../src/controls/dismiss/evade/StashFolder";
import { closeDelays, crossedCountLine, fleeOffset, fleeStrength, keepInside, liveDelay, openCurve } from "../../../src/controls/dismiss/evade/evade-math";
import { EVADE } from "../../../src/controls/dismiss/tokens";
import { setReducedMotion } from "./reduced";

afterEach(() => {
	setReducedMotion(false);
	vi.useRealTimers();
});

describe("evade-math", () => {
	it("强度在半径外为 0, 贴脸为 1, 按 falloff 次方衰减", () => {
		expect(fleeStrength(EVADE.radius, EVADE.radius, EVADE.falloff)).toBe(0);
		expect(fleeStrength(0, EVADE.radius, EVADE.falloff)).toBe(1);
		expect(fleeStrength(EVADE.radius / 2, EVADE.radius, EVADE.falloff)).toBeCloseTo(0.25, 6);
	});

	it("位移背离指针, axis 锁轴", () => {
		const opts = { radius: 100, reach: 50, falloff: 1, axis: "both" as const };
		const flee = fleeOffset({ x: 0, y: 50 }, { x: 50, y: 50 }, opts);
		expect(flee.offset.x).toBeCloseTo(25, 6);
		expect(flee.offset.y).toBeCloseTo(0, 6);
		expect(fleeOffset({ x: 0, y: 50 }, { x: 50, y: 50 }, { ...opts, axis: "y" }).offset.x).toBe(0);
	});

	it("钳进场地四周留 inset, wall=none 不钳", () => {
		const field = { x: 200, y: 100 };
		const half = { x: 10, y: 10 };
		expect(keepInside({ x: -50, y: 500 }, half, field, "clamp")).toEqual({ x: EVADE.insetPx + 10, y: 100 - EVADE.insetPx - 10 });
		expect(keepInside({ x: -50, y: 500 }, half, field, "none")).toEqual({ x: -50, y: 500 });
	});

	it("只在强度自下而上越过计数线时记一次", () => {
		expect(crossedCountLine(0.2, EVADE.countLine)).toBe(true);
		expect(crossedCountLine(EVADE.countLine, 0.9)).toBe(false);
		expect(crossedCountLine(0.9, 0.2)).toBe(false);
	});

	it("文件夹: 回弹曲线, 物理接管时刻, 逆序收起", () => {
		expect(openCurve(0)).toBe("cubic-bezier(0.34, 1.00, 0.64, 1)");
		expect(liveDelay(400, 1, 50)).toBeGreaterThan(400);
		const first = closeDelays(0, 3, 40, 300);
		const last = closeDelays(2, 3, 40, 300);
		expect(first.move).toBeGreaterThan(last.move);
		expect(last.move).toBe(0);
	});
});

describe("EvadeZone", () => {
	it("点中触发 onCatch, 停住后复位", () => {
		vi.useFakeTimers();
		const onCatch = vi.fn();
		render(
			<EvadeZone onCatch={onCatch}>
				<button type="button">Catch me</button>
			</EvadeZone>,
		);
		fireEvent.click(screen.getByRole("button"));
		expect(onCatch).toHaveBeenCalledTimes(1);
		const zone = document.querySelector("[data-caught]");
		expect(zone).not.toBeNull();
		act(() => vi.advanceTimersByTime(EVADE.caughtHoldMs + 1));
		expect(document.querySelector("[data-caught]")).toBeNull();
	});

	it("disabled 时点击不算抓到", () => {
		const onCatch = vi.fn();
		render(<EvadeZone disabled onCatch={onCatch} />);
		fireEvent.click(screen.getByRole("button"));
		expect(onCatch).not.toHaveBeenCalled();
	});
});

describe("StashFolder", () => {
	const items = [
		{ id: "a", label: "Draft" },
		{ id: "b", label: "Notes" },
	];

	it("点击打开, 选中纸片回调并按 closeOnSelect 收起", () => {
		setReducedMotion(true);
		const onSelect = vi.fn();
		const onOpenChange = vi.fn();
		render(<StashFolder items={items} trigger="click" closeOnSelect onSelect={onSelect} onOpenChange={onOpenChange} />);
		const toggle = screen.getByRole("button", { expanded: false });
		fireEvent.click(toggle);
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		const chips = screen.getAllByRole("menuitem");
		expect(chips).toHaveLength(2);
		fireEvent.keyDown(chips[1] as HTMLElement, { key: "Enter" });
		expect(onSelect).toHaveBeenCalledWith(items[1]);
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});
});
