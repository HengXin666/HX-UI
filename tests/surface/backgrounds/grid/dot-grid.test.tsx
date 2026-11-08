/**
 * DotGrid: 弹簧参数, 子步, 格点积分与打包, 渲染状态与减弱动效.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPointerState } from "@src/surface/backdrop/kernel";
import { DotGrid, dotPatternFallback, shocksOf } from "@src/surface/backgrounds/grid/DotGrid";
import { DOT_GRID_FRAGMENT, DOT_SHAPES } from "@src/surface/backgrounds/grid/dot-grid-shader";
import { DOT_GRID, makeLattice, packLattice, springParams, stepLattice, substeps } from "@src/surface/backgrounds/grid/dot-grid-sim";
import { mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

let restore: Array<() => void> = [];
beforeEach(() => {
  useFakeClock();
  restore = [];
});
afterEach(() => {
  restore.forEach((fn) => fn());
  vi.useRealTimers();
});

const idle = { pointer: null, proximity: 140, strength: 1, shocks: [], shockRadius: 320, shockStrength: 5 };

describe("DotGrid 纯函数", () => {
  it("规格常数, 弹簧参数与子步上限", () => {
    expect([DOT_GRID.maxSteps, DOT_GRID.minStep, DOT_GRID.pushGain]).toEqual([24, 1 / 120, 0.35]);
    expect(DOT_SHAPES).toEqual({ circle: 0, square: 1 });
    const p = springParams(0.6, 0.4, 0.8);
    const omega = (2 * Math.PI) / 0.8;
    expect(p.stiffness).toBeCloseTo(omega * omega, 6);
    expect(p.damping).toBeCloseTo(2 * 0.4 * omega, 6);
    expect(p.coupling).toBeCloseTo(0.2 * omega * omega, 6);
    expect(substeps(0.05, p)).toBeGreaterThanOrEqual(6);
    expect(substeps(10, p)).toBe(24);
    expect(DOT_GRID_FRAGMENT).toContain("texelFetch");
  });

  it("指针推开附近的点, 撤掉后回位", () => {
    const l = makeLattice(180, 180, 18);
    expect([l.cols, l.rows]).toEqual([10, 10]);
    const p = springParams(0.6, 0.4, 0.8);
    stepLattice(l, 0.05, p, { ...idle, pointer: [90, 81] });
    const near = (4 * l.cols + 4) * 2;
    expect(l.velocity[near]).toBeLessThan(0);
    for (let i = 0; i < 200; i += 1) stepLattice(l, 0.05, p, idle);
    expect(Math.abs(l.offset[near])).toBeLessThan(0.05);
  });

  it("打包: 静止为零点, 行序自上而下", () => {
    const l = makeLattice(36, 36, 18);
    l.offset[0] = 18 * DOT_GRID.offsetRange;
    const out = new Uint8ClampedArray(l.cols * l.rows * 4);
    packLattice(l, out);
    expect(out[4 * 2]).toBe(254);
    expect(out[0]).toBe(DOT_GRID.zero);
  });

  it("冲击波只取寿命内的点击, 减弱动效时没有", () => {
    const pointer = createPointerState();
    pointer.taps = [{ x: 0.5, y: 0.5, at: 1 }, { x: 0, y: 0, at: 0 }];
    expect(shocksOf({ pointer, elapsed: 1.2 }, 100, 100)).toEqual([{ x: 50, y: 50, age: expect.closeTo(0.2, 6) }]);
    expect(shocksOf({ pointer, elapsed: Number.POSITIVE_INFINITY }, 100, 100)).toEqual([]);
    expect(dotPatternFallback("border", 5, 18)).toContain("var(--border) 2.5px");
  });
});

describe("DotGrid 渲染", () => {
  it("webgl2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<DotGrid />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(200));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before);
  });

  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    render(<DotGrid reducedMotion />);
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });

  it("拿不到 webgl2 时铺点阵兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<DotGrid />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
