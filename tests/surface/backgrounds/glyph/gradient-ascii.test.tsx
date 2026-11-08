/**
 * glyph 路 GradientASCII: 纯函数与常数, WebGL 可用时 live, 减弱动效只画一帧, 拿不到 webgl2 时走 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GradientASCII, gradientAsciiUniforms } from "@src/surface/backgrounds/glyph/GradientASCII";
import { ASCII_SHAPES, GRADIENT_ASCII, GRADIENT_ASCII_FRAGMENT } from "@src/surface/backgrounds/glyph/gradient-ascii-shader";
import { atlasUniforms, colorList } from "@src/surface/backgrounds/glyph/kit";
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
  shape: "eclipse", characters: " .#", cellSize: 18, density: 0.8, glyphOpacity: 0.85, glow: 0.2, depthOfField: 0, flicker: 0.2, softness: 0.5,
  scale: 1, flow: 0.5, gradientOpacity: 0.9, grain: 0.08, variation: 0, scrambleRadius: 0.1, clickEffect: "burst", intro: true, lightMode: true,
} as const;

describe("GradientASCII 纯函数", () => {
  it("规格常数", () => {
    expect([GRADIENT_ASCII.maxColors, GRADIENT_ASCII.clickLife, GRADIENT_ASCII.trailLife, GRADIENT_ASCII.introSeconds]).toEqual([8, 1.2, 0.7, 2.4]);
    expect(GRADIENT_ASCII.characters).toBe(" =+xX0S8#@");
    expect(ASCII_SHAPES.eclipse).toBe(3);
    expect(GRADIENT_ASCII_FRAGMENT).toContain("u_atlas");
  });
  it("uniform: 形状, 点击, 入场, 浅色", () => {
    const u = gradientAsciiUniforms({ colors: [[1, 0, 0]], elapsed: 1.2 }, knobs, 3);
    expect([u.u_shape, u.u_click, u.u_light, u.u_count]).toEqual([3, 2, 1, 3]);
    expect(u.u_intro).toBeCloseTo(0.5, 6);
  });
  it("色带平铺: 不足时重复最后一个; 无图集时按字数走方块", () => {
    const { list } = colorList([[1, 0, 0], [0, 1, 0]], 3);
    expect(Array.from(list)).toEqual([1, 0, 0, 0, 1, 0, 0, 1, 0]);
    expect(atlasUniforms(null, "abc")).toEqual({ u_atlas_grid: [1, 1], u_glyph_count: 3, u_has_atlas: 0 });
  });
});

describe("GradientASCII 渲染", () => {
  it("WebGL 可用时 live 并出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<GradientASCII>x</GradientASCII>);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    act(() => vi.advanceTimersByTime(100));
    expect(calls).toContain("drawArrays");
  });
  it("减弱动效: 只画静态帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(true));
    const { container } = render(<GradientASCII />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });
  it("拿不到 webgl2 时铺 CSS 兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<GradientASCII colors={["primary", "accent"]} />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--primary)");
  });
});
