/**
 * field 族: InkSplash (SplashCursor). 驱动纯函数, 着色器接线, 通道调度, 减弱动效, 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPointerState, type BackdropFrame } from "@src/surface/backdrop/kernel";
import { INK, InkSplash, createInkDrive, hueRgb, inkPetals, inkSpread, packInk, stepInk } from "@src/surface/field";
import { INK_SCENE, INK_VELOCITY_PASS } from "@src/surface/field/parts/ink-shader";
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

const settings = { size: 1, force: 1, intensity: 1, colorSpeed: 1, rainbow: true, clickSplash: true, intro: false, simScale: 0.25 };
function frameAt(elapsed: number, still = false): BackdropFrame {
  return { time: elapsed, dt: still ? 0 : 1 / 60, elapsed, fit: { width: 400, height: 200, scale: 1 }, pointer: createPointerState(), colors: [[1, 0, 0]], reduced: still, still };
}
const draws = (calls: string[]): number => calls.filter((c) => c === "drawArrays").length;

describe("InkSplash 驱动", () => {
  it("规格常数与公式", () => {
    expect(INK).toMatchObject({ bloomThreshold: 0.3, bloomKnee: 0.7, bloomLevels: 4, push: 6000, dye: 0.15, click: 1100, maxDt: 1 / 60 });
    expect(inkPetals(0, 0)).toBeCloseTo(0.78, 9);
    expect(inkSpread(4)).toBe(2);
    expect(hueRgb(0)).toEqual([1, 0, 0]);
    expect(hueRgb(1 / 3)[1]).toBeCloseTo(1, 9);
  });
  it("拖动打一个沿指针方向的溅点, 静态帧不打, 点击只溅一次", () => {
    const d = createInkDrive();
    expect(stepInk(d, frameAt(1, true), settings, [])).toEqual([]);
    const f = frameAt(1);
    Object.assign(f.pointer, { inside: true, x: 0.3, y: 0.6, vx: 1, vy: 0 });
    const [move] = stepInk(d, f, settings, []);
    expect(move.kind).toBe(0);
    expect(move.vx).toBeCloseTo((1 / 60) * 6000 * 2, 6);
    expect(move.color[0]).toBeGreaterThan(0);
    f.pointer.taps.push({ x: 0.5, y: 0.5, at: 0.9 });
    const burst = stepInk(d, f, settings, []);
    expect(burst.filter((s) => s.kind === 1)).toHaveLength(1);
    expect(burst.find((s) => s.kind === 1)?.vx).toBe(1100);
    expect(stepInk(d, f, settings, []).filter((s) => s.kind === 1)).toHaveLength(0);
  });
  it("非彩虹模式用调色板; 入场一笔; 打包", () => {
    const d = createInkDrive();
    const [intro] = stepInk(d, frameAt(0.6), { ...settings, intro: true, rainbow: false }, [[0, 0, 1]]);
    expect(intro.color[2]).toBeGreaterThan(0);
    expect(intro.color[0]).toBe(0);
    const p = packInk([intro]);
    expect(p.count).toBe(1);
    expect(p.at[0]).toBeCloseTo(0.5, 6);
    expect(p.paint[3]).toBeCloseTo(0.0025, 9);
  });
  it("着色器接线", () => {
    expect(INK_VELOCITY_PASS).toContain("uniform sampler2D u_press;");
    expect(INK_VELOCITY_PASS).toContain("u_curl");
    expect(INK_SCENE).toContain("bloom_encode");
  });
});

describe("InkSplash 渲染", () => {
  it("每帧跑速度, 散度, 压力迭代, 染料, 场景, 再上屏; glow 加 4 级泛光", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container, unmount } = render(<InkSplash quality="low" />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(200));
    const delta = draws(calls) - before;
    expect(delta).toBeGreaterThan(0);
    expect(delta % (INK.quality.low.steps + 5)).toBe(0);
    unmount();
    const glowCalls: string[] = [];
    restore.push(mockWebgl2(glowCalls));
    render(<InkSplash quality="low" glow={1} />);
    const b2 = draws(glowCalls);
    act(() => vi.advanceTimersByTime(200));
    expect((draws(glowCalls) - b2) % (INK.quality.low.steps + 9)).toBe(0);
  });
  it("减弱动效只画一帧; 没有 WebGL2 时铺兜底", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const { container, unmount } = render(<InkSplash reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(300));
    expect(draws(calls)).toBe(before);
    unmount();
    restore.push(recordCanvas2d([]));
    const { container: c2 } = render(<InkSplash />);
    expect((c2.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("fallback");
  });
});
