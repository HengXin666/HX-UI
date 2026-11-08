/**
 * lines 路 LineWaves: 纯函数与常数, WebGL2 可用时 live, 不可用时铺兜底, 减弱动效只画一帧.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LineWaves } from "@src/surface/backgrounds/lines/LineWaves";
import {
  LINE_WAVES_CYCLE_RATE, LINE_WAVES_FRAGMENT, LINE_WAVES_INTRO_SECONDS, LINE_WAVES_MAX_RIPPLES, LINE_WAVES_TIME_RATE, revealSweep,
} from "@src/surface/backgrounds/lines/line-waves-shader";
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

describe("LineWaves 纯函数", () => {
  it("规格常数", () => {
    expect([LINE_WAVES_MAX_RIPPLES, LINE_WAVES_INTRO_SECONDS, LINE_WAVES_TIME_RATE, LINE_WAVES_CYCLE_RATE]).toEqual([4, 1.8, 2.5, 0.05]);
    expect(LINE_WAVES_FRAGMENT).toContain("fwidth");
    expect(LINE_WAVES_FRAGMENT).not.toMatch(/#[0-9a-f]{6}/i);
  });
  it("入场扫线从左外侧扫到右外侧", () => {
    const span = 0.5 * Math.sqrt(2);
    expect(revealSweep(0, 1)).toBeCloseTo(-span - 0.6, 6);
    expect(revealSweep(1, 1)).toBeCloseTo(span + 0.6, 6);
  });
});

describe("LineWaves 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<LineWaves data-testid="host" rotation={10} />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(200));
    expect(draws(calls)).toBeGreaterThan(before);
  });
  it("WebGL2 不可用时铺渐变兜底", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<LineWaves data-testid="host" colors={["ring", "muted"]} />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--ring)");
  });
  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    render(<LineWaves reducedMotion />);
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(500));
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });
});
