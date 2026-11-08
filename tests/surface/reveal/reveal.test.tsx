/**
 * reveal 族: Reveal 新增的 cloak / scrub (AnimatedContent, FadeContent), TileFlip (PixelSwap), MosaicSwap (PixelTransition),
 * ScrollWiden (ScrollExpand), EdgeBlur (GradualBlur). 规格常数, 纯函数, 渲染与减弱动效分支.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { REVEAL_SCRUB_END, Reveal, scrubEnds } from "@src/motion/Reveal";
import { EdgeBlur, layerBlur, layerMask } from "@src/surface/reveal/EdgeBlur";
import { MosaicSwap, mosaicRate, quantize } from "@src/surface/reveal/MosaicSwap";
import { ScrollWiden, widenFrame, widenProgress } from "@src/surface/reveal/ScrollWiden";
import { TileFlip } from "@src/surface/reveal/TileFlip";
import { mosaicAmount, tileClip, tileGrid, tileHalf, tileOrders } from "@src/surface/reveal/tile-math";
import { BAYER, EDGE_CURVES, MOSAIC, TILE, WIDEN } from "@src/surface/reveal/tokens";
import { mockReducedMotion, useFakeClock } from "../helpers";

afterEach(() => {
	vi.useRealTimers();
});

describe("Reveal 的 cloak / scrub", () => {
	it("scrub 两端取自预设, 缺的键两端相同", () => {
		expect(REVEAL_SCRUB_END).toBe(0.55);
		const ends = scrubEnds("fadeUp");
		expect(ends.opacity).toEqual([0, 1]);
		expect(ends.y).toEqual([12, 0]);
		expect(ends.scale).toEqual([1, 1]);
	});

	it("默认行为不变; scrub 与 cloak 都能渲染子内容", () => {
		render(<Reveal>plain</Reveal>);
		render(<Reveal cloak>cloaked</Reveal>);
		render(<Reveal scrub>scrubbed</Reveal>);
		expect(screen.getByText("plain")).toBeInTheDocument();
		expect(screen.getByText("cloaked")).toBeInTheDocument();
		expect(screen.getByText("scrubbed")).toBeInTheDocument();
	});
});

describe("TileFlip", () => {
	it("格子总数上限 600, 超了放大格宽", () => {
		expect(TILE.maxPixels).toBe(600);
		const g = tileGrid(2000, 1000, 10);
		expect(g.cols * g.rows).toBeLessThanOrEqual(600 * 1.1);
		expect(g.cell).toBeGreaterThan(10);
		expect(tileGrid(96, 48, 48)).toEqual({ cols: 2, rows: 1, cell: 48 });
	});

	it("起步顺序: 图案 + 随机, 落在 0..1", () => {
		const left = tileOrders({ cols: 3, rows: 1 }, "left", 0);
		expect(Array.from(left)).toEqual([0, 0.5, 1]);
		const ptr = tileOrders({ cols: 3, rows: 3 }, "pointer", 0, [0, 0]);
		expect(ptr[0]).toBe(0);
		expect(ptr[8]).toBeCloseTo(1, 6);
		for (const v of tileOrders({ cols: 4, rows: 4 }, "random", 0.5)) expect(v).toBeGreaterThanOrEqual(0);
	});

	it("方块半径: 0 时没有, 1 时超过半格与邻格缝合", () => {
		expect(tileHalf(0, 0)).toBe(0);
		expect(tileHalf(1, 0)).toBeGreaterThan(0.5);
		expect(tileHalf(5, 0)).toBeLessThanOrEqual(1.25);
		expect(tileClip({ cols: 1, rows: 1, cell: 10 }, [0])).toBe("inset(50%)");
		expect(tileClip({ cols: 1, rows: 1, cell: 10 }, [0.5])).toMatch(/^path\('M/);
	});

	it("减弱动效: 激活即整面切换", () => {
		const restore = mockReducedMotion(true);
		const { container, rerender } = render(<TileFlip firstContent="a" secondContent="b" active={false} intro={false} />);
		rerender(<TileFlip firstContent="a" secondContent="b" active intro={false} />);
		const top = container.querySelectorAll("[data-slot=tile-flip] > div")[1] as HTMLElement;
		expect(top.style.clipPath).toBe("none");
		restore();
	});
});

describe("MosaicSwap", () => {
	it("规格常数与覆盖曲线", () => {
		expect(MOSAIC.window).toBe(0.35);
		expect(BAYER).toHaveLength(16);
		expect(mosaicAmount(0.25, 0.4, "pop")).toBe(1);
		expect(mosaicAmount(0.1, 0.4, "pop")).toBe(0);
		expect(mosaicAmount(0.75, 0.4, "pop")).toBe(0);
		expect(mosaicAmount(0.49, 0, "fade")).toBe(1);
		expect(mosaicRate(0.4, false)).toBeCloseTo(1.25, 6);
		expect(mosaicRate(0.4, true)).toBe(Number.POSITIVE_INFINITY);
		expect(quantize(0.33, 0, 0.4)).toBe(0.33);
		expect(quantize(0.33, 5, 0.4)).toBe(0.25);
	});

	it("悬停推进, 过半换面, 离开倒回", () => {
		useFakeClock();
		const { container } = render(<MosaicSwap firstContent="one" secondContent="two" gridSize={4} />);
		const host = container.firstElementChild as HTMLElement;
		expect(container.querySelectorAll("span")).toHaveLength(16);
		fireEvent.pointerEnter(host);
		act(() => vi.advanceTimersByTime(1000));
		expect(screen.getByText("two")).toBeInTheDocument();
		fireEvent.pointerLeave(host);
		act(() => vi.advanceTimersByTime(1000));
		expect(screen.getByText("one")).toBeInTheDocument();
	});
});

describe("ScrollWiden", () => {
	it("展开帧: 0 是起始卡片, 1 是满屏, 文字层按规格区间淡入淡出", () => {
		const o = { startWidth: WIDEN.startWidth, startHeight: WIDEN.startHeight, startRadius: 24, endRadius: 0, mediaZoom: 1.35, overlayScrim: 0.45 };
		const a = widenFrame(0, o);
		expect([a.width, a.height, a.radius, a.zoom, a.title, a.hint, a.content]).toEqual([42, 58, 24, 1.35, 1, 1, 0]);
		const b = widenFrame(1, o);
		expect([b.width, b.height, b.radius, b.zoom, b.scrim, b.title, b.content]).toEqual([100, 100, 0, 1, 0, 0, 1]);
		expect(widenProgress(-600, 1000, 1.2)).toBeCloseTo(0.5, 6);
		expect(widenProgress(100, 1000, 1.2)).toBe(0);
	});

	it("减弱动效: 段落只有一屏高, 直接满屏", () => {
		const restore = mockReducedMotion(true);
		const { container } = render(<ScrollWiden src="x.png" title="T" />);
		const section = container.querySelector("section") as HTMLElement;
		expect(section.style.height).toBe("100vh");
		restore();
	});
});

describe("EdgeBlur", () => {
	it("层模糊逐层增大, 指数分布最后一层到满", () => {
		const a = layerBlur(0, 8, 2, "linear", true);
		const z = layerBlur(7, 8, 2, "linear", true);
		expect(z).toBeCloseTo(2 * 4 * 8, 6);
		expect(a).toBeLessThan(z);
		expect(EDGE_CURVES["ease-out"](1)).toBe(1);
		expect(layerMask(0, 8, "bottom")).toContain("to bottom");
	});

	it("渲染 layers 层, 对读屏隐藏", () => {
		const { container } = render(<EdgeBlur layers={5} />);
		const root = container.firstElementChild as HTMLElement;
		expect(root).toHaveAttribute("aria-hidden", "true");
		expect(root.children).toHaveLength(5);
	});
});
