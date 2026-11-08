/**
 * lines 路 Waves: 纯函数与常数, WebGL2 可用时 live, 不可用时铺兜底, 减弱动效只画一帧.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Waves } from "@src/surface/backgrounds/lines/Waves";
import {
  stepSpring, WAVES_CELL, WAVES_FRAGMENT, WAVES_INTRO_SECONDS, WAVES_RIPPLE_SPEED, WAVES_RIPPLE_WIDTH, WAVES_STYLES,
} from "@src/surface/backgrounds/lines/waves-shader";
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

describe("Waves 纯函数", () => {
  it("规格常数", () => {
    expect(WAVES_STYLES).toEqual({ solid: 0, dashed: 1 });
    expect([WAVES_CELL, WAVES_INTRO_SECONDS, WAVES_RIPPLE_SPEED, WAVES_RIPPLE_WIDTH]).toEqual([12, 2.2, 640, 64]);
    expect(WAVES_FRAGMENT).not.toMatch(/#[0-9a-f]{6}/i);
  });
  it("弹簧收敛到目标, bounce 大时越过目标", () => {
    const s = { x: 0, y: 0, vx: 0, vy: 0 };
    let peak = 0;
    for (let i = 0; i < 300; i += 1) {
      stepSpring(s, 10, 0, 1 / 60, 0.5, 1.4);
      peak = Math.max(peak, s.x);
    }
    expect(s.x).toBeCloseTo(10, 1);
    expect(peak).toBeGreaterThan(10);
    const still = { x: 3, y: 0, vx: 0, vy: 0 };
    expect(stepSpring(still, 10, 0, 0, 0.5, 1.4).x).toBe(3);
  });
});

describe("Waves 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<Waves data-testid="host" lineStyle="dashed" />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(200));
    expect(draws(calls)).toBeGreaterThan(before);
  });
  it("WebGL2 不可用时铺兜底, 有底色时用底色", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<Waves data-testid="host" backgroundColor="muted" />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--muted)");
  });
  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    render(<Waves reducedMotion />);
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(500));
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });
});
