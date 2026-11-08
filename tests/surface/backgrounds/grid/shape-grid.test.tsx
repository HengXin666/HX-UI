/**
 * ShapeGrid: 格面布局, 投影, 光斑与级联照度, 滚动与光斑弹簧, 画布绘制与减弱动效.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShapeGrid, gridLinesFallback } from "@src/surface/backgrounds/grid/ShapeGrid";
import { SHAPE_GRID, cascadeLight, makeShapeGridState, spotLight, stepShapeGrid } from "@src/surface/backgrounds/grid/shape-grid-field";
import { OFFSET, cellKey, gridSteps, layoutCells, makeProjector } from "@src/surface/backgrounds/grid/shape-grid-geometry";
import { hueRgb, inkOf } from "@src/surface/backgrounds/grid/tokens";
import { mockReducedMotion, useFakeClock } from "../../backdrop/helpers";
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

describe("ShapeGrid 纯函数", () => {
  it("规格常数与格形步长", () => {
    expect(SHAPE_GRID.spotStiffness).toBe(220);
    expect(SHAPE_GRID.spotDamping).toBeCloseTo(2 * Math.sqrt(220) * 0.85, 9);
    expect(OFFSET).toBe(32768);
    expect(gridSteps("square", 40)).toEqual([40, 40]);
    expect(gridSteps("triangle", 40)[0]).toBe(20);
    expect(gridSteps("hex", 40)[1]).toBeCloseTo(60 / Math.sqrt(3), 9);
    expect(cellKey(1, 2)).not.toBe(cellKey(2, 1));
  });

  it("布局铺满画布, 平移整周期后编号不变", () => {
    const a = layoutCells("square", 40, 200, 120, 0, 0, false);
    expect(a.length).toBeGreaterThanOrEqual(5 * 3);
    expect(a.every((c) => c.points.length === 4)).toBe(true);
    const b = layoutCells("square", 40, 200, 120, 0, 0, false, [2, 0]);
    expect(b[0].i).toBe(a[0].i + 2);
    expect(layoutCells("circle", 40, 80, 80, 0, 0, false)[0].radius).toBeCloseTo(16.8, 6);
  });

  it("不倾斜时投影是恒等; 倾斜后远处缩小", () => {
    expect(makeProjector(0, 0, 100, 100).project(10, 20)).toEqual([10, 20, 1]);
    const tilted = makeProjector(30, 0, 100, 100);
    expect(tilted.project(50, 0)[2]).not.toBe(tilted.project(50, 100)[2]);
  });

  it("光斑 smoothstep(reach, 0.15 reach), 级联亮环外扩变淡", () => {
    expect(spotLight(0, 1.5, 40)).toBe(1);
    expect(spotLight(60, 1.5, 40)).toBe(0);
    expect(spotLight(10, 0, 40)).toBe(0);
    const ring = 0.5 * SHAPE_GRID.cascadeCells * 40;
    expect(cascadeLight(ring, 0.5, 40)).toBeCloseTo(1 - 0.5 / SHAPE_GRID.cascadeLife, 6);
    expect(cascadeLight(ring, 2, 40)).toBe(0);
  });

  it("滚动按 speed * 60 走, 光斑弹簧追指针, 静态帧直接贴上", () => {
    const s = makeShapeGridState();
    stepShapeGrid(s, 0.5, { direction: "right", speed: 0.5 }, null);
    expect(s.offsetX).toBeCloseTo(-15, 6);
    stepShapeGrid(s, 0, { direction: "right", speed: 0.5 }, [30, 40]);
    expect([s.spot.x, s.spot.y, s.spot.power]).toEqual([30, 40, 1]);
    stepShapeGrid(s, 0.016, { direction: "none", speed: 0.5 }, [60, 40]);
    expect(s.spot.x).toBeGreaterThan(30);
    expect(s.spot.x).toBeLessThan(60);
  });

  it("取色串与色相环", () => {
    expect(inkOf([1, 0, 0], 0.5)).toBe("color(srgb 1.0000 0.0000 0.0000 / 0.5000)");
    expect(hueRgb(0)).toEqual([1, 0, 0]);
    expect(gridLinesFallback("border", 40, null)).toContain("var(--border) 1px");
  });
});

describe("ShapeGrid 渲染", () => {
  it("2d 可用时 live, 画出底线", () => {
    const calls: string[] = [];
    restore.push(recordCanvas2d(calls), mockReducedMotion(false));
    const { container } = render(<ShapeGrid intro={false} fade={0} />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    act(() => vi.advanceTimersByTime(100));
    expect(calls).toContain("stroke");
    expect(calls).toContain("lineTo");
  });

  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(recordCanvas2d(calls));
    const { container } = render(<ShapeGrid reducedMotion shape="hex" />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "clearRect").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "clearRect").length).toBe(before);
  });
});
