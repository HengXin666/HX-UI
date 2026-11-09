/**
 * StretchSlider: 橡皮筋与弹簧换算, 键盘与滚轮, onChangeEnd, 拖拽越界, 减弱动效下不拉伸直接终态.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StretchSlider } from "@src/controls/range/input/StretchSlider";
import {
	STRETCH_TICK_CAP,
	fillSpan,
	readAxis,
	rubberBand,
	stretchScale,
	stretchSprings,
	tickRatios,
} from "@src/controls/range/input/parts/stretch-track";
import { mockReducedMotion, simulate } from "./helpers";

afterEach(() => vi.restoreAllMocks());

function rect(width: number, height: number): DOMRect {
	return { left: 0, top: 0, right: width, bottom: height, width, height, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
}

describe("StretchSlider 纯逻辑", () => {
	it("橡皮筋: 起步近 1:1, 渐近上限, 保留方向", () => {
		expect(rubberBand(0, 50)).toBe(0);
		expect(rubberBand(1, 50)).toBeCloseTo(50 / 51, 9);
		expect(rubberBand(1e6, 50)).toBeLessThan(50);
		expect(rubberBand(-100, 50)).toBeCloseTo(-100 / 3, 9);
		expect(rubberBand(10, 0)).toBe(0);
	});

	it("指针读数: 横向越过两端给出带符号溢出, 竖向底端为 0", () => {
		expect(readAxis(-20, 0, 200, false)).toEqual({ ratio: 0, overflow: -20 });
		expect(readAxis(230, 0, 200, false)).toEqual({ ratio: 1, overflow: 30 });
		expect(readAxis(150, 0, 200, true).ratio).toBeCloseTo(0.25, 9);
	});

	it("填充区间与刻度", () => {
		expect(fillSpan(0.3, undefined)).toEqual([0, 0.3]);
		expect(fillSpan(0.3, 0.5)).toEqual([0.3, 0.5]);
		expect(tickRatios(0, 10, 1)).toHaveLength(9);
		expect(tickRatios(0, 1000, 1)).toHaveLength(0);
		expect(STRETCH_TICK_CAP).toBe(50);
		expect(stretchScale(50, 200, 50)).toEqual({ along: 1.25, across: 0.75 });
	});

	it("弹簧: 填充临界阻尼不过冲, bounce 越大回弹越多", () => {
		const fill = simulate(stretchSprings(0.5).fill);
		expect(fill.peak).toBeLessThanOrEqual(1.001);
		expect(fill.settleMs).toBeLessThanOrEqual(320);
		expect(simulate(stretchSprings(0.5).recoil).peak).toBeGreaterThan(simulate(stretchSprings(0.1).recoil).peak);
		expect(simulate(stretchSprings(0).recoil).peak).toBeLessThanOrEqual(1.001);
	});
});

describe("StretchSlider 交互", () => {
	it("role=slider, 方向键 / PageUp / Home 改值, 松键报 onChangeEnd", () => {
		mockReducedMotion(false);
		const onChange = vi.fn();
		const onChangeEnd = vi.fn();
		render(<StretchSlider defaultValue={50} onChange={onChange} onChangeEnd={onChangeEnd} ariaLabel="音量" />);
		const slider = screen.getByRole("slider", { name: "音量" });
		expect(slider).toHaveAttribute("aria-valuenow", "50");
		fireEvent.keyDown(slider, { key: "ArrowRight" });
		expect(onChange).toHaveBeenLastCalledWith(51);
		fireEvent.keyUp(slider, { key: "ArrowRight" });
		expect(onChangeEnd).toHaveBeenLastCalledWith(51);
		fireEvent.keyDown(slider, { key: "PageUp" });
		expect(onChange).toHaveBeenLastCalledWith(61);
		fireEvent.keyDown(slider, { key: "Home" });
		expect(onChange).toHaveBeenLastCalledWith(0);
	});

	it("滚轮一格走一步", () => {
		mockReducedMotion(false);
		const onChange = vi.fn();
		render(<StretchSlider defaultValue={10} onChange={onChange} />);
		fireEvent.wheel(screen.getByRole("slider"), { deltaY: -100 });
		expect(onChange).toHaveBeenLastCalledWith(11);
	});

	it("拖过右端: 值钳在 max, 松手 (pointercancel 同路) 报 onChangeEnd", () => {
		mockReducedMotion(false);
		const onChangeEnd = vi.fn();
		render(<StretchSlider defaultValue={50} stepped onChangeEnd={onChangeEnd} />);
		const slider = screen.getByRole("slider");
		vi.spyOn(slider, "getBoundingClientRect").mockReturnValue(rect(200, 24));
		fireEvent.pointerDown(slider, { button: 0, clientX: 100, pointerId: 1 });
		fireEvent.pointerMove(slider, { clientX: 400, pointerId: 1 });
		expect(slider).toHaveAttribute("aria-valuenow", "100");
		fireEvent.pointerCancel(slider, { pointerId: 1 });
		expect(onChangeEnd).toHaveBeenLastCalledWith(100);
	});

	it("禁用时键盘不改值", () => {
		const onChange = vi.fn();
		render(<StretchSlider disabled onChange={onChange} />);
		const slider = screen.getByRole("slider");
		expect(slider).toHaveAttribute("aria-disabled", "true");
		fireEvent.keyDown(slider, { key: "ArrowRight" });
		expect(onChange).not.toHaveBeenCalled();
	});

	it("减弱动效: 改值后填充直接到终值, 轨道不拉伸", async () => {
		mockReducedMotion(true);
		const { container } = render(<StretchSlider defaultValue={0} />);
		const slider = screen.getByRole("slider");
		await act(async () => {
			fireEvent.keyDown(slider, { key: "End" });
		});
		const fill = container.querySelector<HTMLElement>(".bg-foreground");
		expect(fill?.style.width).toBe("100%");
		const body = fill?.parentElement;
		expect(body?.style.transform).toBe("scale(1, 1)");
	});

	it("竖向: aria-orientation 与填充沿高度", async () => {
		mockReducedMotion(true);
		const { container } = render(<StretchSlider orientation="vertical" defaultValue={25} />);
		expect(screen.getByRole("slider")).toHaveAttribute("aria-orientation", "vertical");
		expect(container.querySelector<HTMLElement>(".bg-foreground")?.style.height).toBe("25%");
	});
});
