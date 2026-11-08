/**
 * glyph 路 LetterGlitch: 纯函数与常数, WebGL 可用时 live, 减弱动效只画一帧, 拿不到 webgl2 时走 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPointerState } from "@src/surface/backdrop/kernel";
import { LetterGlitch, letterGlitchUniforms } from "@src/surface/backgrounds/glyph/LetterGlitch";
import { glitchRate, LETTER_GLITCH, LETTER_GLITCH_FRAGMENT, stirOf } from "@src/surface/backgrounds/glyph/letter-glitch-shader";
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
  fontSize: 14, spacing: 0.6, density: 0.9, baseOpacity: 0.16, glitchAmount: 1, smooth: true, interactive: false, cursorRadius: 140,
  clickEffect: "none", flow: 0.5, edgeFade: 0, centerFade: 0, intro: true, glitchCount: 3, hasBack: false,
} as const;

describe("LetterGlitch 纯函数", () => {
  it("规格常数", () => {
    expect([LETTER_GLITCH.maxColors, LETTER_GLITCH.introSeconds, LETTER_GLITCH.restRate, LETTER_GLITCH.glitchRate]).toEqual([8, 1.4, 0.2, 0.1]);
    expect(LETTER_GLITCH_FRAGMENT).toContain("u_atlas");
  });
  it("闪烁频率 0.1 * amount ** 1.6, 搅动按 1400 像素每秒封顶", () => {
    expect(glitchRate(1)).toBeCloseTo(0.1, 9);
    expect(glitchRate(0.5)).toBeCloseTo(0.1 * 0.5 ** 1.6, 9);
    expect(stirOf(1, 0, 700, 100)).toBeCloseTo(0.5, 9);
    expect(stirOf(10, 10, 700, 700)).toBe(1);
  });
  it("uniform: 格子尺寸, 关闭交互时半径为 0, 入场进度", () => {
    const u = letterGlitchUniforms({ colors: [], elapsed: 0.7, pointer: createPointerState(), fit: { width: 200, height: 100, scale: 2 } }, knobs);
    const h = 14 * (1 + 0.5 * 0.6);
    expect(u.u_cell).toEqual([h * 0.6, h]);
    expect([u.u_radius, u.u_tear, u.u_has_back, u.u_palette_count]).toEqual([0, 0, 0, 3]);
    expect(u.u_intro).toBeCloseTo(0.5, 6);
  });
});

describe("LetterGlitch 渲染", () => {
  it("WebGL 可用时 live 并出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<LetterGlitch>x</LetterGlitch>);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    act(() => vi.advanceTimersByTime(100));
    expect(calls).toContain("drawArrays");
  });
  it("减弱动效: 只画静态帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(true));
    const { container } = render(<LetterGlitch />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });
  it("拿不到 webgl2 时铺 CSS 兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<LetterGlitch backgroundColor="background" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--background)");
  });
});
