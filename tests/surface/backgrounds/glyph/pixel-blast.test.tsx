/**
 * glyph 路 PixelBlast: 纯函数与常数, WebGL 可用时 live, 减弱动效只画一帧, 拿不到 webgl2 时走 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PixelBlast, pixelBlastUniforms } from "@src/surface/backgrounds/glyph/PixelBlast";
import { PIXEL_BLAST, PIXEL_BLAST_FRAGMENT, PIXEL_HOVERS, PIXEL_SHAPES, pixelIntroEase } from "@src/surface/backgrounds/glyph/pixel-blast-shader";
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
  variant: "cross", pixelSize: 3, transparent: true, patternScale: 2, patternDensity: 1, pixelSizeJitter: 2, enableRipples: true, rippleSpeed: 0.4,
  rippleThickness: 0.12, rippleIntensityScale: 1.5, edgeFade: 0.25, softness: 0, hover: "reveal", hoverRadius: 0.2, intro: true,
} as const;

describe("PixelBlast 纯函数", () => {
  it("规格常数与形状表", () => {
    expect([PIXEL_BLAST.introSeconds, PIXEL_BLAST.introEase, PIXEL_BLAST.maxClicks]).toEqual([1.8, 2.4, 8]);
    expect(PIXEL_SHAPES).toEqual({ square: 0, circle: 1, triangle: 2, diamond: 3, cross: 4, ring: 5 });
    expect(PIXEL_HOVERS.reveal).toBe(2);
    expect(PIXEL_BLAST_FRAGMENT).toContain("hxg_bayer8");
  });
  it("入场缓出 1 - (1 - t) ** 2.4", () => {
    expect(pixelIntroEase(0)).toBe(0);
    expect(pixelIntroEase(1)).toBe(1);
    expect(pixelIntroEase(0.5)).toBeCloseTo(1 - 0.5 ** 2.4, 9);
  });
  it("uniform: 形状与悬停编号, 透明底, 抖动钳到 1, 入场", () => {
    const u = pixelBlastUniforms({ colors: [], elapsed: 0.9 }, knobs);
    expect([u.u_shape, u.u_hover, u.u_opaque, u.u_jitter, u.u_ripple_life]).toEqual([4, 2, 0, 1, 3]);
    expect(u.u_intro).toBeCloseTo(0.5, 6);
    const d = pixelBlastUniforms({ colors: [], elapsed: Number.POSITIVE_INFINITY }, { ...knobs, variant: "hex" as never, transparent: false, pixelSize: 0 });
    expect([d.u_shape, d.u_opaque, d.u_pixel, d.u_intro]).toEqual([0, 1, 1, 1]);
  });
});

describe("PixelBlast 渲染", () => {
  it("WebGL 可用时 live 并出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<PixelBlast variant="ring">x</PixelBlast>);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    act(() => vi.advanceTimersByTime(100));
    expect(calls).toContain("drawArrays");
  });
  it("减弱动效: 只画静态帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(true));
    const { container } = render(<PixelBlast />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });
  it("拿不到 webgl2 时铺 CSS 兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<PixelBlast color="accent" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--accent)");
  });
});
