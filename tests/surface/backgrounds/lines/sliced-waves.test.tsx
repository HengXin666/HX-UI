/**
 * lines 路 SlicedWaves: 纯函数与常数, WebGL2 可用时 live, 不可用时铺兜底, 减弱动效只画一帧.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SlicedWaves } from "@src/surface/backgrounds/lines/SlicedWaves";
import {
  SLICED_DISTANCE, SLICED_FOCAL, SLICED_INTRO_SECONDS, SLICED_MAX_RIBBONS, SLICED_WAVES_FRAGMENT, slicedScale, stepFocus,
} from "@src/surface/backgrounds/lines/sliced-waves-shader";
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

const draws = (calls: string[]): number => calls.filter((c) => c === "drawArrays").length;

describe("SlicedWaves 纯函数", () => {
  it("规格常数", () => {
    expect([SLICED_MAX_RIBBONS, SLICED_FOCAL, SLICED_DISTANCE, SLICED_INTRO_SECONDS]).toEqual([6, 1.1, 2.6, 1.5]);
    expect(SLICED_WAVES_FRAGMENT).toContain("1.2732395 + 0.147 * a");
    expect(SLICED_WAVES_FRAGMENT).not.toMatch(/#[0-9a-f]{6}/i);
  });
  it("透视中间为 1, 两侧收窄", () => {
    expect(slicedScale(0, 0.45, 0.5)).toBe(1);
    expect(slicedScale(1, 0.45, 0.5)).toBeLessThan(1);
    expect(slicedScale(1, 0, 0.5)).toBe(1);
  });
  it("聚焦弹簧收敛", () => {
    const f = { value: 0, velocity: 0 };
    for (let i = 0; i < 240; i += 1) stepFocus(f, 1, 1 / 60);
    expect(f.value).toBeCloseTo(1, 2);
  });
});

describe("SlicedWaves 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<SlicedWaves data-testid="host" slices={4} ribbons={9} />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(200));
    expect(draws(calls)).toBeGreaterThan(before);
  });
  it("WebGL2 不可用时铺渐变兜底", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<SlicedWaves data-testid="host" colors={["ring", "muted"]} />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--ring)");
  });
  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    render(<SlicedWaves reducedMotion />);
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(500));
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });
});
