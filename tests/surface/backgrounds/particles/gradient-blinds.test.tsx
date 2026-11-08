/**
 * GradientBlinds: 片数, 色带平移与涟漪打包的纯函数, WebGL2 渲染, 兜底与减弱动效静帧.
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GradientBlinds } from "@src/surface/backgrounds/particles/GradientBlinds";
import { BLINDS, BLINDS_FRAGMENT, blindCountFor, blindWaves, stepShift } from "@src/surface/backgrounds/particles/gradient-blinds-shader";
import { mockWebgl2 } from "../../backdrop/helpers";
import { mockReducedMotion, recordCanvas2d, useFakeClock } from "../../helpers";

afterEach(() => {
  vi.useRealTimers();
});

describe("GradientBlinds 纯函数", () => {
  it("规格常数与片元源码", () => {
    expect([BLINDS.maxColors, BLINDS.maxWaves, BLINDS.introSeconds, BLINDS.rippleSeconds, BLINDS.shiftRate, BLINDS.hoverTau]).toEqual([8, 4, 1.8, 1.6, 0.06, 0.35]);
    expect(BLINDS_FRAGMENT.startsWith("#version 300 es")).toBe(true);
    expect(BLINDS_FRAGMENT).toContain("uniform vec3 u_colors[8]");
    expect(BLINDS_FRAGMENT).toContain("uniform vec4 u_waves[4]");
  });

  it("片数受 blindCount 与最小片宽共同限制, 至少 1 片", () => {
    expect(blindCountFor(1600, 16, 60)).toBe(16);
    expect(blindCountFor(600, 16, 60)).toBe(10);
    expect(blindCountFor(20, 16, 60)).toBe(1);
    expect(blindCountFor(600, 16, 0)).toBe(16);
  });

  it("色带平移在 0..2 内循环, 涟漪只收最近 4 次且过期作废", () => {
    expect(stepShift(0, 1, 1)).toBeCloseTo(0.06, 9);
    expect(stepShift(1.98, 1, 1)).toBeCloseTo(0.04, 9);
    expect(stepShift(0, 1, -1)).toBeCloseTo(1.94, 9);
    const taps = [0, 1, 2, 3, 4].map((i) => ({ x: i / 10, y: 0.5, at: i }));
    const waves = blindWaves(taps, 4.5);
    expect(waves.length).toBe(16);
    expect(waves[0]).toBeCloseTo(0.1, 6);
    expect(Array.from(waves.filter((_, i) => i % 4 === 3))).toEqual([0, 0, 1, 1]);
    expect(Array.from(blindWaves([], 1))).toEqual(new Array(16).fill(0));
  });
});

describe("GradientBlinds 渲染", () => {
  it("WebGL2 可用时 live 并持续出帧", () => {
    useFakeClock();
    const calls: string[] = [];
    const restore = mockWebgl2(calls);
    const { container } = render(<GradientBlinds />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(200));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before);
    restore();
  });

  it("拿不到 webgl2 时走 CSS 兜底", () => {
    const restore = recordCanvas2d([]);
    const { container } = render(<GradientBlinds />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    restore();
  });

  it("减弱动效: 只画一帧", () => {
    useFakeClock();
    const calls: string[] = [];
    const restore = mockWebgl2(calls);
    const restoreMotion = mockReducedMotion(true);
    const { container } = render(<GradientBlinds />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    expect(before).toBeGreaterThan(0);
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
    restoreMotion();
    restore();
  });
});
