/**
 * glyph 路 FaultyTerminal: 纯函数与常数, WebGL 可用时 live, 减弱动效只画一帧, 拿不到 webgl2 时走 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FaultyTerminal, TERMINAL_INTRO_SECONDS, terminalScreenUniforms, terminalUniforms } from "@src/surface/backgrounds/glyph/FaultyTerminal";
import { FAULTY_TERMINAL, FAULTY_TERMINAL_FRAGMENT, phosphorDecay, TERMINAL_SCREEN } from "@src/surface/backgrounds/glyph/faulty-terminal-shader";
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
  scale: 1, gridMul: [2, 1], digitSize: 1.5, timeScale: 0.3, scanlineIntensity: 0.3, glitchAmount: 1, flickerAmount: 1, noiseAmp: 1,
  chromaticAberration: 0, dither: 0, curvature: 0.2, mouseReact: false, mouseStrength: 0.2, pageLoadAnimation: true, brightness: 1,
  glyphs: "dots", glow: 0.5, persistence: 0.5, scramble: 0.5, mouseGlow: 0.6, vignette: 0.25, clickEffect: "degauss",
} as const;

describe("FaultyTerminal 纯函数", () => {
  it("规格常数", () => {
    expect([TERMINAL_INTRO_SECONDS, FAULTY_TERMINAL.glitchSeconds, FAULTY_TERMINAL.degaussSeconds]).toEqual([2, 0.7, 1.6]);
    expect(TERMINAL_SCREEN).toContain("u_screen");
    expect(FAULTY_TERMINAL_FRAGMENT).toContain("u_curvature");
  });
  it("余辉 persistence ** (dt * 60)", () => {
    expect(phosphorDecay(0.5, 0)).toBe(1);
    expect(phosphorDecay(0.5, 1 / 60)).toBeCloseTo(0.5, 9);
  });
  it("uniform: 格子按 gridMul 分, 画法与点击编号, 入场", () => {
    const s = terminalScreenUniforms({ elapsed: 1, dt: 0 }, knobs);
    expect(s.u_cell).toEqual([6, 12]);
    expect([s.u_glyphs, s.u_mouse, s.u_decay]).toEqual([1, 0, 1]);
    expect(s.u_intro).toBeCloseTo(0.5, 6);
    const m = terminalUniforms({ colors: [] }, knobs);
    expect([m.u_click, m.u_click_life]).toEqual([2, 1.6]);
  });
});

describe("FaultyTerminal 渲染", () => {
  it("WebGL 可用时 live 并出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<FaultyTerminal glyphs="characters">x</FaultyTerminal>);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    act(() => vi.advanceTimersByTime(100));
    expect(calls).toContain("drawArrays");
  });
  it("减弱动效: 只画静态帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(true));
    const { container } = render(<FaultyTerminal />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });
  it("拿不到 webgl2 时铺光晕兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<FaultyTerminal tint="primary" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
  });
});
