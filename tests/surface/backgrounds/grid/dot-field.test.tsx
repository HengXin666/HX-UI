/**
 * DotField: 透镜跟随状态, 排布枚举, 入场进度, 渲染状态与减弱动效.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPointerState } from "@src/surface/backdrop/kernel";
import { DOT_FIELD, DotField, stepLens } from "@src/surface/backgrounds/grid/DotField";
import { DOT_FIELD_FRAGMENT, DOT_PATTERNS, GOLDEN_ANGLE } from "@src/surface/backgrounds/grid/dot-field-shader";
import { cssAngleDir, introProgress } from "@src/surface/backgrounds/grid/tokens";
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

describe("DotField 纯函数", () => {
  it("规格常数与排布枚举", () => {
    expect(DOT_FIELD.introSeconds).toBe(1.8);
    expect([DOT_FIELD.lensTauIn, DOT_FIELD.lensTauOut, DOT_FIELD.zoomTau]).toEqual([0.18, 0.4, 0.14]);
    expect(DOT_PATTERNS).toEqual({ grid: 0, hex: 1, spiral: 2, scatter: 3 });
    expect(GOLDEN_ANGLE).toBeCloseTo(2.39996, 4);
    expect(DOT_FIELD_FRAGMENT).toContain("void main()");
  });

  it("入场进度与渐变方向", () => {
    expect(introProgress(0.9, 1.8, true)).toBeCloseTo(0.5, 6);
    expect(introProgress(Number.POSITIVE_INFINITY, 1.8, true)).toBe(1);
    expect(introProgress(0, 1.8, false)).toBe(1);
    const [x, y] = cssAngleDir(90);
    expect(x).toBeCloseTo(1, 6);
    expect(y).toBeCloseTo(0, 6);
  });

  it("透镜随指针进出逼近, 按住才放大, 静态帧直接落到目标", () => {
    const pointer = createPointerState();
    const lens = { value: 0 };
    const zoom = { value: 0 };
    pointer.inside = true;
    pointer.down = true;
    const [l1, z1] = stepLens(lens, zoom, { dt: 0.05, pointer }, true);
    expect(l1).toBeGreaterThan(0);
    expect(l1).toBeLessThan(1);
    expect(z1).toBeGreaterThan(0);
    expect(stepLens({ value: 0 }, { value: 0 }, { dt: 0.05, pointer }, false)[1]).toBe(0);
    expect(stepLens({ value: 0 }, { value: 0 }, { dt: 0, pointer }, true)).toEqual([1, 1]);
  });
});

describe("DotField 渲染", () => {
  it("webgl2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<DotField data-testid="f" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(200));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before);
  });

  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const { container } = render(<DotField reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });

  it("拿不到 webgl2 时铺渐变兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<DotField />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--primary)");
  });
});
