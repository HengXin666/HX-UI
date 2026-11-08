/**
 * glyph 路 PixelSnow: 纯函数与常数, WebGL 可用时 live, 减弱动效只画一帧, 拿不到 webgl2 时走透明兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PixelSnow, pixelSnowUniforms, snowPileUniforms } from "@src/surface/backgrounds/glyph/PixelSnow";
import { PIXEL_SNOW, PIXEL_SNOW_FRAGMENT, pileGrowth, SNOW_PILE, SNOW_VARIANTS } from "@src/surface/backgrounds/glyph/pixel-snow-shader";
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
  variant: "mixed", density: 0.5, wind: 0.25, sway: 0.5, flakeSize: 1, pixelSize: 3, depth: 0.6, brightness: 1, glow: 0.8, twinkle: 0.35,
  accumulate: true, intro: true, fade: 2,
} as const;

describe("PixelSnow 纯函数", () => {
  it("规格常数与图案表", () => {
    expect([PIXEL_SNOW.cell, PIXEL_SNOW.levels, PIXEL_SNOW.introSeconds]).toEqual([9, 5, 1.4]);
    expect(SNOW_VARIANTS.mixed).toBe(4);
    expect(SNOW_PILE).toContain("u_pile");
    expect(PIXEL_SNOW_FRAGMENT).toContain("hxg_bayer4");
  });
  it("积雪增长 (0.25 + density * 0.9) * dt * min(1, speed)", () => {
    expect(pileGrowth(0.5, 2, 1)).toBeCloseTo(0.7 * PIXEL_SNOW.pileRate, 9);
    expect(pileGrowth(0.5, 0.5, 1)).toBeCloseTo(0.35 * PIXEL_SNOW.pileRate, 9);
    expect(pileGrowth(0.5, 1, 0)).toBe(0);
  });
  it("uniform: 图案编号, 淡出钳到 1, 入场; 关指针不推不融", () => {
    const u = pixelSnowUniforms({ colors: [], elapsed: 0.7 }, knobs, false);
    expect([u.u_variant, u.u_fade, u.u_push, u.u_pile_on]).toEqual([4, 1, 0, 1]);
    expect(u.u_intro).toBeCloseTo(0.5, 6);
    const p = snowPileUniforms({ dt: 0.1 }, knobs, 1, false);
    expect(p.u_melt).toBe(0);
    expect(p.u_grow).toBeCloseTo(pileGrowth(0.5, 1, 0.1), 9);
    expect(snowPileUniforms({ dt: 0.1 }, { ...knobs, accumulate: false }, 1, true).u_grow).toBe(0);
  });
});

describe("PixelSnow 渲染", () => {
  it("WebGL 可用时 live 并出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<PixelSnow accumulate>x</PixelSnow>);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    act(() => vi.advanceTimersByTime(100));
    expect(calls).toContain("drawArrays");
  });
  it("减弱动效: 只画静态帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(true));
    const { container } = render(<PixelSnow />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });
  it("拿不到 webgl2 时退到透明兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<PixelSnow />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
  });
});
