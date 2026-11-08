/**
 * GridMotion: 布局, 行方向与折回, 视差与光斑状态, 瓦片滤镜, DOM 渲染与减弱动效.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPointerState } from "@src/surface/backdrop/kernel";
import { GridMotion, motionMask } from "@src/surface/backgrounds/grid/GridMotion";
import {
  GRID_MOTION, MOTION_DIRECTIONS, isImageItem, makeMotionState, motionLayout, rowDirection, stepMotion, tileFilter, wrapShift,
} from "@src/surface/backgrounds/grid/grid-motion-field";
import { mockReducedMotion, useFakeClock } from "../../backdrop/helpers";

let restore: Array<() => void> = [];
beforeEach(() => {
  useFakeClock();
  restore = [];
});
afterEach(() => {
  restore.forEach((fn) => fn());
  vi.useRealTimers();
});

const opts = { rows: 4, aspectRatio: 1.33, gap: 16, angle: 0, count: 3 };

describe("GridMotion 纯函数", () => {
  it("规格常数与方向枚举", () => {
    expect([GRID_MOTION.introSeconds, GRID_MOTION.settleTau, GRID_MOTION.spotInner]).toEqual([0.9, 0.22, 0.25]);
    expect(MOTION_DIRECTIONS).toEqual({ left: 0, right: 1, alternate: 2 });
  });

  it("布局盖住旋转后的画面, 每行瓦片够铺满任意相位", () => {
    const flat = motionLayout(400, 300, opts);
    expect(flat.stageW).toBeCloseTo(400 * GRID_MOTION.coverMargin, 6);
    expect(flat.rowH * 4 + 16 * 3).toBeCloseTo(flat.stageH, 6);
    expect(flat.tileW).toBeCloseTo(flat.rowH * 1.33, 6);
    expect(flat.perRow * flat.step).toBeGreaterThanOrEqual(flat.stageW + flat.period);
    expect(motionLayout(400, 300, { ...opts, angle: 30 }).stageW).toBeGreaterThan(flat.stageW);
  });

  it("行方向与折回区间", () => {
    expect([rowDirection(0, "alternate"), rowDirection(1, "alternate"), rowDirection(1, "left"), rowDirection(0, "right")]).toEqual([-1, 1, -1, 1]);
    expect(wrapShift(10, 100)).toBe(-90);
    expect(wrapShift(-10, 100)).toBe(-10);
    expect(wrapShift(5, 0)).toBe(0);
  });

  it("指针在场时光斑附近亮, 视差随指针偏移; 静态帧直接落到目标", () => {
    const layout = motionLayout(400, 300, opts);
    const step = { rows: 4, layout, width: 400, height: 300, angle: 0, parallax: 0.5, scrollSpeed: 0, direction: "alternate" as const };
    const pointer = createPointerState();
    Object.assign(pointer, { inside: true, presence: 1, x: 1, y: 0.5 });
    const s = makeMotionState();
    const shifts = stepMotion(s, 0, 0, pointer, step);
    expect(shifts).toHaveLength(4);
    expect(s.shifts[0].value).toBeCloseTo(0.5 * GRID_MOTION.parallaxPixels, 6);
    expect(Math.max(...s.lights.map((l) => l.value))).toBeGreaterThan(0.5);
    const gentle = makeMotionState();
    stepMotion(gentle, 0, 0.05, pointer, step);
    expect(gentle.shifts[0].value).toBeGreaterThan(0);
    expect(gentle.shifts[0].value).toBeLessThan(0.5 * GRID_MOTION.parallaxPixels);
  });

  it("滤镜, 遮罩与图片识别", () => {
    expect(tileFilter(0, 1, { dim: 0.35, spotlight: 0.6, grayscale: false })).toBe("brightness(0.650) grayscale(0.000)");
    expect(tileFilter(1, 1, { dim: 0.35, spotlight: 1, grayscale: true })).toBe("brightness(1.250) grayscale(0.000)");
    expect(motionMask(0)).toBeUndefined();
    expect(motionMask(0.5)).toContain("var(--foreground) 35%");
    expect([isImageItem("/a.png"), isImageItem("https://x.dev/p"), isImageItem("hello"), isImageItem(3)]).toEqual([true, true, false, false]);
  });
});

describe("GridMotion 渲染", () => {
  it("DOM 件永远 live, 行随时钟平移", () => {
    restore.push(mockReducedMotion(false));
    const { container } = render(<GridMotion items={["A", "B", "/c.png"]} scrollSpeed={40} />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    expect(host.querySelector("canvas")).toBeNull();
    expect(host.querySelectorAll("[data-grid-motion-row]")).toHaveLength(4);
    act(() => vi.advanceTimersByTime(100));
    const row = host.querySelector<HTMLElement>("[data-grid-motion-row]");
    const before = row?.style.transform;
    act(() => vi.advanceTimersByTime(300));
    expect(row?.style.transform).toContain("translate3d");
    expect(row?.style.transform).not.toBe(before);
  });

  it("减弱动效只摆一帧, 入场视为完成", () => {
    const { container } = render(<GridMotion reducedMotion />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropPlan).toBe("still");
    const stage = host.querySelector<HTMLElement>("[data-grid-motion-stage]");
    expect(stage?.style.opacity).toBe("1.000");
    const row = host.querySelector<HTMLElement>("[data-grid-motion-row]");
    const before = row?.style.transform;
    act(() => vi.advanceTimersByTime(500));
    expect(row?.style.transform).toBe(before);
  });
});
