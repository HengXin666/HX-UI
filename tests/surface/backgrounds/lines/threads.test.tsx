/**
 * lines 路 Threads: 纯函数与常数, WebGL2 可用时 live, 不可用时铺兜底, 减弱动效只画一帧.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Threads } from "@src/surface/backgrounds/lines/Threads";
import { threadAlpha, THREADS_FOLLOW_TAU, THREADS_FRAGMENT, THREADS_MAX_LINES, THREADS_PRESENCE_TAU, THREADS_WIDTH_UNIT } from "@src/surface/backgrounds/lines/threads-shader";
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

describe("Threads 纯函数", () => {
  it("规格常数", () => {
    expect([THREADS_FOLLOW_TAU, THREADS_PRESENCE_TAU, THREADS_WIDTH_UNIT]).toEqual([1 / 3, 1 / 4, 7]);
    expect(THREADS_MAX_LINES).toBeGreaterThanOrEqual(90);
    expect(THREADS_FRAGMENT).toContain("smoothstep(u_split, max(0.7, u_split + 0.2), x)");
    expect(THREADS_FRAGMENT).not.toMatch(/#[0-9a-f]{6}/i);
  });
  it("外侧线透明收尾", () => {
    expect(threadAlpha(0, 0.85)).toBe(1);
    expect(threadAlpha(1, 0.85)).toBeCloseTo(0.15, 6);
    expect(threadAlpha(0.5, 0)).toBe(1);
  });
});

describe("Threads 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<Threads data-testid="host" parting={0.5} />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(200));
    expect(draws(calls)).toBeGreaterThan(before);
  });
  it("WebGL2 不可用时铺渐变兜底", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<Threads data-testid="host" color="ring" />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--ring)");
  });
  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    render(<Threads reducedMotion />);
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(500));
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });
});
