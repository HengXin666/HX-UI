/**
 * lines 路 FloatingLines: 纯函数与常数, WebGL2 可用时 live, 不可用时铺兜底, 减弱动效只画一帧.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FloatingLines } from "@src/surface/backgrounds/lines/FloatingLines";
import { dampingTau, FLOATING_INTRO_SECONDS, FLOATING_LINES_FRAGMENT, FLOATING_MAX_CLICKS, FLOATING_MAX_LINES, waveFlags } from "@src/surface/backgrounds/lines/floating-lines-shader";
import { clampCount, introProgress, paletteCount, paletteUniform } from "@src/surface/backgrounds/lines/tokens";
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

describe("FloatingLines 纯函数", () => {
  it("规格常数", () => {
    expect([FLOATING_MAX_LINES, FLOATING_MAX_CLICKS, FLOATING_INTRO_SECONDS]).toEqual([24, 3, 1.8]);
    expect(FLOATING_LINES_FRAGMENT).toContain("u_taps");
    expect(FLOATING_LINES_FRAGMENT).not.toMatch(/#[0-9a-f]{6}/i);
  });
  it("阻尼换时间常数, 启用组换开关", () => {
    expect(dampingTau(0.05)).toBeCloseTo(-1 / (60 * Math.log(0.95)), 6);
    expect(dampingTau(1)).toBe(0);
    expect(dampingTau(0)).toBe(Number.POSITIVE_INFINITY);
    expect(waveFlags(["top", "bottom"])).toEqual([1, 0, 1]);
  });
  it("调色板补齐, 计数钳位, 入场进度", () => {
    const u = paletteUniform([[1, 0, 0], [0, 1, 0]], 4);
    expect(Array.from(u.list).slice(9, 12)).toEqual([0, 1, 0]);
    expect(paletteCount([], 8)).toBe(1);
    expect([clampCount(40, 24), clampCount(0, 24), clampCount(Number.NaN, 24)]).toEqual([24, 1, 1]);
    expect(introProgress(0.9, 1.8, true)).toBeCloseTo(0.5, 6);
    expect(introProgress(Number.POSITIVE_INFINITY, 1.8, true)).toBe(1);
    expect(introProgress(0, 1.8, false)).toBe(1);
  });
});

describe("FloatingLines 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<FloatingLines data-testid="host" />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(200));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before);
  });
  it("WebGL2 不可用时铺渐变兜底", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<FloatingLines data-testid="host" linesGradient={["primary", "ring"]} />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--ring)");
  });
  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    render(<FloatingLines reducedMotion />);
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(before).toBeGreaterThan(0);
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });
});
