/**
 * glyph 路 CRTWarp: 纯函数与常数, WebGL 可用时 live, 减弱动效只画一帧, 拿不到 webgl2 时走 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CRTWarp, crtContentUniforms, crtUniforms } from "@src/surface/backgrounds/glyph/CRTWarp";
import { CRT_CONTENT, CRT_MASKS, CRT_WARP, CRT_WARP_FRAGMENT, crtDecay, crtRise } from "@src/surface/backgrounds/glyph/crt-warp-shader";
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

const knobs = {
  variation: 5, waveAmplitude: 0.3, waveFrequency: 2.5, levels: 3, columns: 80, persistence: 0.4, curvature: 0.25, corners: 0, scanlineStrength: 0.6,
  scanlineFrequency: 200, mask: "slot", maskStrength: 0.3, bloom: 1.5, bloomRadius: 1, rgbShift: 0.003, noise: 0.1, flicker: 0.15, interference: 0.2,
  vignette: 0.3, brightness: 1, intro: true, clickRoll: true,
} as const;

describe("CRTWarp 纯函数", () => {
  it("规格常数与荫罩表", () => {
    expect([CRT_WARP.cellAspect, CRT_WARP.introSeconds, CRT_WARP.flipSeconds]).toEqual([0.56, 1.6, 0.8]);
    expect(CRT_MASKS).toEqual({ none: 0, aperture: 1, shadow: 2, slot: 3 });
    expect(CRT_CONTENT).toContain("u_content");
    expect(CRT_WARP_FRAGMENT).toContain("u_flip");
  });
  it("余辉 persistence ** (dt * 60), 减弱动效为 0; 入场时 rise = dt / 0.22", () => {
    expect(crtDecay(0.4, 1 / 60, false)).toBeCloseTo(0.4, 9);
    expect(crtDecay(0.4, 0, false)).toBe(1);
    expect(crtDecay(0.4, 1 / 60, true)).toBe(0);
    expect(crtRise(0.5, 0.011)).toBeCloseTo(0.05, 9);
    expect(crtRise(1, 0.011)).toBe(1);
  });
  it("uniform: 变体取模, 入场进度, 荫罩编号", () => {
    const c = crtContentUniforms({ elapsed: 0.8, dt: 0, reduced: false }, knobs);
    expect([c.u_variant, c.u_columns, c.u_levels, c.u_decay]).toEqual([1, 80, 3, 1]);
    expect(c.u_reveal).toBeCloseTo(0.5, 6);
    const done = crtContentUniforms({ elapsed: Number.POSITIVE_INFINITY, dt: 0, reduced: true }, { ...knobs, levels: 1, columns: 2 });
    expect([done.u_reveal, done.u_rise, done.u_levels, done.u_columns, done.u_decay]).toEqual([1, 1, 2, 8, 0]);
    const m = crtUniforms({ colors: [] }, knobs);
    expect([m.u_mask, m.u_flip, m.u_roll_on]).toEqual([3, 0.8, 1]);
  });
});

describe("CRTWarp 渲染", () => {
  it("WebGL 可用时 live 并出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<CRTWarp>x</CRTWarp>);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    act(() => vi.advanceTimersByTime(100));
    expect(calls).toContain("drawArrays");
  });
  it("减弱动效: 只画静态帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(true));
    const { container } = render(<CRTWarp />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });
  it("拿不到 webgl2 时铺光晕兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<CRTWarp color="accent" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
  });
});
