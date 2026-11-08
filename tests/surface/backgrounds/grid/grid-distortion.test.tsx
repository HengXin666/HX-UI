/**
 * GridDistortion: 位移场的建立, 回弹, 指针写入, 打包, cover 缩放, 渲染状态与减弱动效.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GridDistortion, distortFallback } from "@src/surface/backgrounds/grid/GridDistortion";
import {
  DISTORT_MODES, GRID_DISTORTION, GRID_DISTORTION_FRAGMENT, coverScale, makeField, packField, stepField,
} from "@src/surface/backgrounds/grid/grid-distortion-field";
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

const base = { mode: "drag" as const, radius: 0.18, strength: 0.15, relaxation: 0.96, aspect: 1 };

describe("GridDistortion 纯函数", () => {
  it("规格常数", () => {
    expect([GRID_DISTORTION.gain, GRID_DISTORTION.rippleLife, GRID_DISTORTION.revealSeconds]).toEqual([18, 1.6, 0.6]);
    expect(DISTORT_MODES).toEqual({ drag: 0, push: 1, swirl: 2 });
    expect(GRID_DISTORTION_FRAGMENT).toContain("u_field");
  });

  it("按宽高比建场, 格子近似正方", () => {
    const f = makeField(15, 2);
    expect([f.cols, f.rows]).toEqual([15, 8]);
  });

  it("指针速度写进半径内的格子, 之后按 relaxation^(dt*60) 回弹", () => {
    const f = makeField(10, 1);
    stepField(f, 1 / 60, { ...base, pointer: { x: 0.55, y: 0.55, vx: 2, vy: 0 } });
    const at = (5 * 10 + 5) * 2;
    expect(f.data[at]).toBeGreaterThan(0);
    expect(f.data[0]).toBe(0);
    const before = f.data[at];
    stepField(f, 1 / 60, { ...base, pointer: null });
    expect(f.data[at]).toBeCloseTo(before * 0.96, 6);
  });

  it("静止时幽灵量上升, 动起来按 3 倍速退去", () => {
    const f = makeField(4, 1);
    stepField(f, 0.5, { ...base, pointer: null });
    expect(f.phantom).toBeCloseTo(0.5, 6);
    stepField(f, 0.1, { ...base, pointer: { x: 0.5, y: 0.5, vx: 1, vy: 0 } });
    expect(f.phantom).toBeCloseTo(0.2, 6);
  });

  it("打包零点 127, cover 缩放保持图像比例", () => {
    const f = makeField(2, 1);
    f.data[0] = GRID_DISTORTION.range;
    const out = new Uint8ClampedArray(16);
    packField(f, out);
    expect(out[8]).toBe(254);
    expect(out[0]).toBe(127);
    expect(coverScale(2, 1)).toEqual([1, 0.5]);
    expect(coverScale(1, 2)).toEqual([0.5, 1]);
  });
});

describe("GridDistortion 渲染", () => {
  it("webgl2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<GridDistortion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(200));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before);
  });

  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    render(<GridDistortion reducedMotion />);
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });

  it("拿不到 webgl2 时铺兜底, 有图时用图", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<GridDistortion imageSrc="/a.png" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(distortFallback("/a.png", "primary", "accent")).toContain('url("/a.png")');
    expect(distortFallback(undefined, "primary", "accent")).toContain("var(--accent)");
  });
});
