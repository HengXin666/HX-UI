/**
 * glyph 路 Scanner: 纯函数与常数, WebGL 可用时 live, 减弱动效只画一帧, 拿不到 webgl2 时走 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Scanner, scannerUniforms } from "@src/surface/backgrounds/glyph/Scanner";
import { pingFade, pingWidth, SCAN_DIRECTIONS, SCANNER, SCANNER_FRAGMENT } from "@src/surface/backgrounds/glyph/scanner-shader";
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
  sweepSpeed: 0.25, sweepWidth: 1.6, trail: 0.5, reverse: true, scale: 1.5, frequency: 2, ripple: 0.22, bandDensity: 0, lineWidth: 1.2, glow: 0.6,
  scanDirection: "diagonal", colorSpread: 0.7, brightness: 1, vignette: 0.3, scanline: false, scanlineIntensity: 0.5, grain: true, grainIntensity: 0.04,
  intro: true,
} as const;

describe("Scanner 纯函数", () => {
  it("规格常数与方向表", () => {
    expect([SCANNER.maxPings, SCANNER.introSeconds]).toEqual([6, 2]);
    expect(SCAN_DIRECTIONS).toEqual({ vertical: 0, horizontal: 1, diagonal: 2 });
    expect(SCANNER_FRAGMENT).toContain("u_sweep_width");
  });
  it("回波环宽 0.12 + 0.1 * age, 亮度 exp(-0.9 * age) * smoothstep(0, 0.12, age)", () => {
    expect(pingWidth(1)).toBeCloseTo(0.22, 9);
    expect(pingFade(0)).toBe(0);
    expect(pingFade(1)).toBeCloseTo(Math.exp(-0.9), 9);
  });
  it("uniform: 方向编号, 反向, 开关折进强度, 条纹下限, 入场", () => {
    const u = scannerUniforms({ colors: [], elapsed: 1 }, knobs);
    expect([u.u_dir, u.u_reverse, u.u_scanline, u.u_grain, u.u_bands]).toEqual([2, 1, 0, 0.04, 1]);
    expect(u.u_intro).toBeCloseTo(0.5, 6);
    expect(scannerUniforms({ colors: [], elapsed: Number.POSITIVE_INFINITY }, { ...knobs, scanDirection: "spiral" as never }).u_dir).toBe(0);
  });
});

describe("Scanner 渲染", () => {
  it("WebGL 可用时 live 并出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<Scanner>x</Scanner>);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    act(() => vi.advanceTimersByTime(100));
    expect(calls).toContain("drawArrays");
  });
  it("减弱动效: 只画静态帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(true));
    const { container } = render(<Scanner />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });
  it("拿不到 webgl2 时铺 CSS 兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<Scanner color1="accent" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--accent)");
  });
});
