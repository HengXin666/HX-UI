/**
 * scene 族: BayerVeil (DitherVeil). 误差扩散, 格网, 着色器接线, 渲染, 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BayerVeil, VEIL, diffuse, fitRect, isOrdered, quantize, veilGrid, veilTone } from "@src/surface/scene";
import { VEIL_FRAGMENT } from "@src/surface/scene/parts/veil-shader";
import { mockIntersection, mockReducedMotion, mockWebgl2, useFakeClock } from "../backdrop/helpers";
import { recordCanvas2d } from "../helpers";

let restore: Array<() => void> = [];
beforeEach(() => {
  useFakeClock();
  restore = [];
});
afterEach(() => {
  restore.forEach((fn) => fn());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("BayerVeil 抖动", () => {
  it("规格常数; 误差扩散核权重和为 1 (atkinson 故意只推 6/8)", () => {
    expect(VEIL).toMatchObject({ ordered: { bayer: 0, noise: 1, lines: 2 }, maskScale: 0.5, maxBursts: 4, burstSeconds: 1.2, introSeconds: 1.1, linePeriod: 6, pixelSize: 2, levels: 2, contrast: 1.15, revealRadius: 200, softness: 0.6, linger: 1, rim: 0 });
    for (const [name, taps] of Object.entries(VEIL.kernels)) expect(taps.reduce((a, [, , w]) => a + w, 0)).toBeCloseTo(name === "atkinson" ? 0.75 : 1, 9);
    expect(isOrdered("bayer")).toBe(true);
    expect(isOrdered("floyd")).toBe(false);
  });
  it("量化与调色同片元公式", () => {
    expect(quantize(0.4, 2)).toBe(0);
    expect(quantize(0.6, 3)).toBe(0.5);
    expect(veilTone(0.5, 1.15, 0)).toBeCloseTo(0.5, 6);
    expect(veilTone(1, 1.15, 0)).toBe(1);
  });
  it("floyd 把 50% 灰扩成约一半黑一半白, 均值守恒", () => {
    const w = 32;
    const v = diffuse(new Float32Array(w * w).fill(0.5), w, w, "floyd", 2);
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    expect(new Set(Array.from(v))).toEqual(new Set([0, 1]));
    expect(mean).toBeGreaterThan(0.45);
    expect(mean).toBeLessThan(0.55);
    const a = diffuse(new Float32Array(16).fill(0.25), 4, 4, "atkinson", 2);
    expect(a.every((x) => x === 0 || x === 1)).toBe(true);
  });
  it("格网按 pixelSize 切, 超上限等比缩; contain / cover 的放置", () => {
    expect(veilGrid(400, 300, 2)).toEqual({ cols: 200, rows: 150 });
    const big = veilGrid(4000, 3000, 1);
    expect(big.cols * big.rows).toBeLessThanOrEqual(VEIL.maxCells);
    expect(fitRect(200, 100, 100, 100, "contain")).toEqual({ x: 0, y: 25, w: 100, h: 50 });
    expect(fitRect(200, 100, 100, 100, "cover")).toEqual({ x: -50, y: 0, w: 200, h: 100 });
  });
  it("着色器接线", () => {
    expect(VEIL_FRAGMENT).toContain("bayer8");
    expect(VEIL_FRAGMENT).toContain("uniform sampler2D u_dither;");
    expect(VEIL_FRAGMENT).toContain("uniform sampler2D u_mask;");
  });
});

describe("BayerVeil 渲染", () => {
  it("每帧遮罩一遍加上屏一遍, 带 alt 时是 img; 减弱动效只画一帧; 没有 WebGL2 时铺图片兜底", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container, unmount } = render(<BayerVeil src="/a.jpg" alt="静物" pattern="bayer" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    expect(host.getAttribute("role")).toBe("img");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(160));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before + 6);
    unmount();
    const still: string[] = [];
    restore.push(mockWebgl2(still));
    const { container: c2, unmount: u2 } = render(<BayerVeil src="/a.jpg" reducedMotion />);
    expect((c2.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    u2();
    restore.push(recordCanvas2d([]));
    const { container: c3 } = render(<BayerVeil src="/a.jpg" fit="cover" />);
    const h3 = c3.firstElementChild as HTMLElement;
    expect(h3.dataset.backdropStatus).toBe("fallback");
    expect(h3.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("cover");
  });
});
