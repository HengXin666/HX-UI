/**
 * lines 路 PatternWaves: 纯函数与常数, WebGL2 可用时 live (含字形记号), 不可用时铺兜底, 减弱动效只画一帧.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PatternWaves } from "@src/surface/backgrounds/lines/PatternWaves";
import {
  enumOf, headingOf, PATTERN_WAVES_ATLAS_TILE, PATTERN_WAVES_FADES, PATTERN_WAVES_FOLDS, PATTERN_WAVES_FRAGMENT, PATTERN_WAVES_INTRO_SECONDS,
  PATTERN_WAVES_PATTERNS, PATTERN_WAVES_PRESETS, PATTERN_WAVES_RIPPLE_CELL, PATTERN_WAVES_RIPPLE_RATE, PATTERN_WAVES_UNIT, PATTERN_WAVES_WAVES,
  pitchOf, resolveSurface, stepWake, waveUnit,
} from "@src/surface/backgrounds/lines/pattern-waves-shader";
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

const draws = (calls: string[]): number => calls.filter((c) => c === "drawArrays").length;

/** webgl2 走记录用的假上下文, 2d 走 recordCanvas2d 的桩, 让字形图集能画出来. */
function mockBoth(gl: string[], ctx2d: string[]): () => void {
  const undoGl = mockWebgl2(gl);
  const glContext = HTMLCanvasElement.prototype.getContext;
  const undo2d = recordCanvas2d(ctx2d);
  const twoD = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function getContext(this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
    return kind === "2d" ? twoD.call(this, kind, ...(args as [])) : glContext.call(this, kind, ...(args as []));
  } as typeof glContext;
  return () => {
    undo2d();
    undoGl();
  };
}

describe("PatternWaves 纯函数", () => {
  it("规格常数", () => {
    expect(PATTERN_WAVES_PATTERNS).toEqual({ dot: 0, square: 1, plus: 2, line: 3, glyph: 4 });
    expect(PATTERN_WAVES_WAVES).toEqual({ silk: 0, swell: 1, ripple: 2 });
    expect(PATTERN_WAVES_FADES).toEqual({ none: 0, edges: 1, center: 2, bottom: 3, top: 4 });
    expect([PATTERN_WAVES_ATLAS_TILE, PATTERN_WAVES_UNIT, PATTERN_WAVES_RIPPLE_CELL, PATTERN_WAVES_RIPPLE_RATE, PATTERN_WAVES_INTRO_SECONDS]).toEqual([
      128, 520, 8, 60, 2,
    ]);
    expect(PATTERN_WAVES_FOLDS).toBe(5.5);
    expect(PATTERN_WAVES_FRAGMENT).not.toMatch(/#[0-9a-f]{6}/i);
    expect(PATTERN_WAVES_FRAGMENT).toContain("uniform sampler2D u_atlas;");
  });
  it("预设叠覆写, 未给的项取预设并钳范围", () => {
    expect(resolveSurface("swell", {})).toEqual(PATTERN_WAVES_PRESETS.swell);
    const s = resolveSurface("silk", { wave: "ripple", shine: 3, depth: undefined });
    expect(s.wave).toBe("ripple");
    expect(s.shine).toBe(1);
    expect(s.depth).toBe(PATTERN_WAVES_PRESETS.silk.depth);
  });
  it("枚举, 单位长度, 光照方向, 格距", () => {
    expect(enumOf(PATTERN_WAVES_FADES, "top", "edges")).toBe(4);
    expect(enumOf(PATTERN_WAVES_FADES, "nope", "edges")).toBe(1);
    expect(waveUnit(2)).toBe(260);
    expect(waveUnit(0)).toBe(520 / 0.05);
    const [x, y] = headingOf(90);
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(1, 6);
    expect(pitchOf(2)).toBe(4);
    expect(pitchOf(Number.NaN)).toBe(8);
  });
  it("尾流时钟按 RIPPLE_RATE 增长到 4 并回落到 0", () => {
    let c = 0;
    c = stepWake(c, 1 / 60, true);
    expect(c).toBeCloseTo(1, 6);
    for (let i = 0; i < 10; i += 1) c = stepWake(c, 1 / 60, true);
    expect(c).toBe(4);
    for (let i = 0; i < 10; i += 1) c = stepWake(c, 1 / 60, false);
    expect(c).toBe(0);
  });
});

describe("PatternWaves 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<PatternWaves data-testid="host" preset="ripple" pattern="plus" fade="bottom" />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(200));
    expect(draws(calls)).toBeGreaterThan(before);
  });
  it("字形记号画图集并上传纹理", () => {
    const gl: string[] = [];
    const ctx: string[] = [];
    restore.push(mockBoth(gl, ctx), mockReducedMotion(false));
    const { getByTestId } = render(<PatternWaves data-testid="host" pattern="glyph" characters="ab" />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    expect(ctx.filter((c) => c === "fillText")).toHaveLength(2);
    act(() => vi.advanceTimersByTime(100));
    expect(gl).toContain("texImage2D");
  });
  it("WebGL2 不可用时铺兜底, 有底色时用底色", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<PatternWaves data-testid="host" backgroundColor="muted" />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--muted)");
  });
  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    render(<PatternWaves reducedMotion />);
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(500));
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });
});
