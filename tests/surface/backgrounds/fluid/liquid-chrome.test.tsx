/**
 * fluid 路 LiquidChrome: 入场与拖动注入的纯函数, 着色器接线, 内核状态, 减弱动效只画一帧, 无 WebGL 时兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiquidChrome } from "@src/surface/backgrounds/fluid/LiquidChrome";
import {
  CHROME_FRAGMENT, CHROME_INTRO_SECONDS, CHROME_SIM_CELL, CHROME_SIM_STEPS, CHROME_SPEED_CAP, CHROME_WAVE_PASS, chromeDragPush, chromeIntro,
} from "@src/surface/backgrounds/fluid/liquid-chrome-shader";
import { mockIntersection, mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

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

const draws = (calls: string[]): number => calls.filter((c) => c === "drawArrays").length;

describe("LiquidChrome 纯函数与常数", () => {
  it("规格常数: 格子 4, 每帧两步, 入场 1.8 秒", () => {
    expect([CHROME_SIM_CELL, CHROME_SIM_STEPS, CHROME_INTRO_SECONDS]).toEqual([4, 2, 1.8]);
  });
  it("入场线性涨满, 关掉或减弱动效时为 1", () => {
    expect(chromeIntro(0.9, true)).toBeCloseTo(0.5, 6);
    expect(chromeIntro(5, true)).toBe(1);
    expect(chromeIntro(0, false)).toBe(1);
    expect(chromeIntro(Number.POSITIVE_INFINITY, true)).toBe(1);
  });
  it("拖动注入随速度涨, 封顶", () => {
    expect(chromeDragPush(0, 1)).toBe(0);
    expect(chromeDragPush(CHROME_SPEED_CAP * 4, 1)).toBe(chromeDragPush(CHROME_SPEED_CAP, 1));
    expect(chromeDragPush(1, 2)).toBeCloseTo(chromeDragPush(1, 1) * 2, 9);
  });
  it("着色器: 上屏读涟漪通道, 涟漪通道读自己", () => {
    expect(CHROME_FRAGMENT).toContain("uniform sampler2D u_wave;");
    expect(CHROME_FRAGMENT).toContain("u_tint");
    expect(CHROME_WAVE_PASS).toContain("u_drop");
  });
});

describe("LiquidChrome 渲染", () => {
  it("有 WebGL2 时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container } = render(<LiquidChrome data-testid="host" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(draws(calls)).toBeGreaterThan(before);
  });
  it("减弱动效: 只画静态帧, 时间推进不再出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const { container } = render(<LiquidChrome reducedMotion />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    expect(before).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(draws(calls)).toBe(before);
  });
  it("拿不到 WebGL2 时铺 CSS 兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<LiquidChrome />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--background)");
  });
});
