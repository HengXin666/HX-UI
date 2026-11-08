/**
 * lines 路 ShapeWaves: 纯函数与常数, WebGL2 可用时 live, 不可用时铺兜底, 减弱动效只画一帧.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShapeWaves } from "@src/surface/backgrounds/lines/ShapeWaves";
import {
  SHAPE_GLOW_THRESHOLD, SHAPE_INTRO_BAND, SHAPE_INTRO_END, SHAPE_INTRO_JITTER, SHAPE_INTRO_SECONDS, SHAPE_INTRO_WARP, SHAPE_MODES, SHAPE_NOISE_CELLS,
  SHAPE_TIME_RATE, SHAPE_WAVES_FRAGMENT, shapeIntro, shapeModeOf,
} from "@src/surface/backgrounds/lines/shape-waves-shader";
import {
  advanceField, fieldGrid, makeWaveField, maskSize, packWaves, SHAPE_MAX_GRID, SHAPE_MAX_MASK_SIZE, SHAPE_SETTLED_THRESHOLD, SHAPE_SIMULATION_STEP,
  SHAPE_WAVE_DECAY, SHAPE_WAVE_FRICTION, SHAPE_WAVE_SPEED, splash,
} from "@src/surface/backgrounds/lines/shape-waves-field";
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

describe("ShapeWaves 纯函数", () => {
  it("规格常数", () => {
    expect(SHAPE_MODES).toEqual({ mixed: 0, squares: 1, circles: 2, triangles: 3 });
    expect([SHAPE_NOISE_CELLS, SHAPE_TIME_RATE, SHAPE_MAX_MASK_SIZE, SHAPE_SIMULATION_STEP]).toEqual([32, 0.1, 1024, 1 / 60]);
    expect([SHAPE_WAVE_SPEED, SHAPE_WAVE_FRICTION, SHAPE_WAVE_DECAY, SHAPE_SETTLED_THRESHOLD]).toEqual([0.42, 0.94, 0.972, 0.01]);
    expect([SHAPE_INTRO_BAND, SHAPE_INTRO_WARP, SHAPE_INTRO_JITTER, SHAPE_GLOW_THRESHOLD, SHAPE_INTRO_SECONDS]).toEqual([0.2, 0.3, 0.16, 0.6, 1.6]);
    expect(SHAPE_INTRO_END).toBeCloseTo(1.66, 6);
    expect(SHAPE_WAVES_FRAGMENT).toContain("smoothstep(max(0.0, 1.0 - u_fade * 2.2), 1.0, radius)");
    expect(SHAPE_WAVES_FRAGMENT).not.toMatch(/#[0-9a-f]{6}/i);
  });
  it("形状模式与入场进度", () => {
    expect(shapeModeOf("circles")).toBe(2);
    expect(shapeModeOf("hexagons")).toBe(0);
    expect(shapeIntro(0.8, 1.6, true)).toBeCloseTo(0.5 * SHAPE_INTRO_END, 6);
    expect(shapeIntro(9, 1.6, true)).toBe(SHAPE_INTRO_END);
    expect(shapeIntro(0, 1.6, false)).toBe(SHAPE_INTRO_END);
    expect(shapeIntro(Number.NaN, 1.6, true)).toBe(SHAPE_INTRO_END);
  });
  it("格数与遮罩尺寸有上限", () => {
    expect(fieldGrid(1000, 500, 10)).toEqual([100, 50]);
    expect(fieldGrid(100000, 10, 1)[0]).toBe(SHAPE_MAX_GRID);
    expect(maskSize(4000, 2000)).toEqual([1024, 512]);
    expect(maskSize(300, 200)).toEqual([300, 200]);
  });
  it("水花扩散后衰减到静止", () => {
    const f = makeWaveField(40, 30);
    expect(splash(f, { x: 20, y: 15, radius: 4, strength: 0.4 })).toBe(0);
    expect(splash(f, { x: 21, y: 15, radius: 4, strength: 0.4 })).toBeCloseTo(0.4, 6);
    expect(f.settled).toBe(false);
    advanceField(f, 0.05, null);
    expect(f.h[15 * 40 + 24]).not.toBe(0);
    const bytes = packWaves(f, new Uint8ClampedArray(40 * 30 * 4));
    expect(bytes[(15 * 40 + 21) * 4 + 3]).toBe(255);
    for (let i = 0; i < 2000 && !f.settled; i += 1) advanceField(f, 1 / 60, null);
    expect(f.settled).toBe(true);
    expect(Math.max(...f.h.map(Math.abs))).toBe(0);
  });
});

describe("ShapeWaves 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<ShapeWaves data-testid="host" shapes="triangles" text="HX" flow={2} />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(200));
    expect(draws(calls)).toBeGreaterThan(before);
  });
  it("WebGL2 不可用时铺兜底, 有底色时用底色", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<ShapeWaves data-testid="host" backgroundColor="muted" />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--muted)");
  });
  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    render(<ShapeWaves reducedMotion />);
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(500));
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });
});
