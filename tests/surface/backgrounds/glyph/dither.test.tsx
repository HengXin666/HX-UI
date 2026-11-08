/**
 * glyph 路 Dither: 纯函数与常数, WebGL 可用时 live, 减弱动效只画一帧, 拿不到 webgl2 时走 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dither, ditherUniforms } from "@src/surface/backgrounds/glyph/Dither";
import { DITHER, DITHER_FRAGMENT, DITHER_MODES, ditherDecay } from "@src/surface/backgrounds/glyph/dither-shader";
import { introProgress } from "@src/surface/backgrounds/glyph/kit";
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
  waveSpeed: 0.05, waveFrequency: 3, waveAmplitude: 0.3, colorNum: 4, pixelSize: 2, mouseRadius: 1, ditherMode: "halftone", scale: 1,
  contrast: 1, brightness: 0, mouseEffect: "ripple", mouseStrength: 1, clickRipple: true, intro: true, paletteSize: 2,
} as const;

describe("Dither 纯函数", () => {
  it("规格常数与模式表", () => {
    expect([DITHER.maxPalette, DITHER.introSeconds, DITHER.rippleSeconds]).toEqual([8, 1.8, 1.6]);
    expect(DITHER_MODES.none).toBe(7);
    expect(DITHER_FRAGMENT).toContain("u_trail");
  });
  it("拖尾衰减: exp(-dt / (0.08 + 0.7 * trail)), 静态帧不衰减", () => {
    expect(ditherDecay(0, 0.5)).toBe(1);
    expect(ditherDecay(0.1, 0.5)).toBeCloseTo(Math.exp(-0.1 / 0.43), 6);
  });
  it("uniform: 模式编号, 量化级数, 入场进度", () => {
    const u = ditherUniforms({ colors: [[0, 0, 0], [1, 1, 1]], elapsed: 0.9 }, knobs);
    expect(u.u_mode).toBe(3);
    expect(u.u_effect).toBe(2);
    expect(u.u_levels).toBe(4);
    expect(u.u_intro).toBeCloseTo(0.5, 6);
    const p = ditherUniforms({ colors: [], elapsed: Number.POSITIVE_INFINITY }, { ...knobs, paletteSize: 5, ditherMode: "bayer" });
    expect([p.u_levels, p.u_palette_count, p.u_intro, p.u_mode]).toEqual([5, 5, 1, 0]);
    expect(introProgress(0, 1.8, false)).toBe(1);
  });
});

describe("Dither 渲染", () => {
  it("WebGL 可用时 live, 宿主带 data-backdrop-status", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<Dither data-testid="dither">x</Dither>);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    act(() => vi.advanceTimersByTime(100));
    expect(calls).toContain("drawArrays");
  });
  it("减弱动效: 只画静态帧, 时钟推进不再出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(true));
    const { container } = render(<Dither />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });
  it("拿不到 webgl2 时铺 CSS 兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<Dither waveColor="accent" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--accent)");
  });
});
