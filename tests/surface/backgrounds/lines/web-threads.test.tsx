/**
 * lines 路 WebThreads: 纯函数与常数, WebGL2 可用时 live, 不可用时铺兜底, 减弱动效只画一帧.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebThreads } from "@src/surface/backgrounds/lines/WebThreads";
import {
  WEB_MAX_COLORS, WEB_MAX_SURGES, WEB_MAX_THREADS, WEB_STROKE_SECONDS, WEB_SURGE_SECONDS, WEB_SURGE_STAGGER, WEB_THREADS_FRAGMENT, webIntroLength, webStagger,
} from "@src/surface/backgrounds/lines/web-threads-shader";
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

describe("WebThreads 纯函数", () => {
  it("规格常数", () => {
    expect([WEB_MAX_THREADS, WEB_MAX_COLORS, WEB_MAX_SURGES]).toEqual([24, 6, 3]);
    expect([WEB_SURGE_SECONDS, WEB_SURGE_STAGGER, WEB_STROKE_SECONDS]).toEqual([1.6, 0.05, 1.25]);
    expect(WEB_THREADS_FRAGMENT).toContain("smoothstep(0.5, 2.2, energy)");
    expect(WEB_THREADS_FRAGMENT).not.toMatch(/#[0-9a-f]{6}/i);
  });
  it("逐线错开与入场总长", () => {
    expect(webStagger(6)).toBeCloseTo(0.12, 6);
    expect(webStagger(24)).toBeCloseTo(0.9 / 23, 6);
    expect(webStagger(1)).toBeCloseTo(0.12, 6);
    expect(webIntroLength(6)).toBeCloseTo(5 * 0.12 + 1.25, 6);
  });
});

describe("WebThreads 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<WebThreads data-testid="host" threadCount={40} shimmer depth={0.5} />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(200));
    expect(draws(calls)).toBeGreaterThan(before);
  });
  it("WebGL2 不可用时铺兜底, 有底色时带底色", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<WebThreads data-testid="host" backgroundColor="muted" />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--muted)");
  });
  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    render(<WebThreads reducedMotion />);
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(500));
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });
});
