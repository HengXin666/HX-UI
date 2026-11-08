/**
 * fluid 路 Topography: 入场, 脉冲与拖尾的纯函数, 方向常数, 着色器接线, 内核状态, 减弱动效只画一帧, 无 WebGL 时兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Topography } from "@src/surface/backgrounds/fluid/Topography";
import {
  TOPO_DIRECTIONS, TOPO_FOV, TOPO_FRAGMENT, TOPO_FREQUENCY, TOPO_HEIGHT, TOPO_HOVER_SIGN, TOPO_INTRO_SECONDS, TOPO_MAX_PULSES, TOPO_ORBIT, TOPO_PULSE_LIFE, topoIntro,
  topoPulse, topoTrailWeight,
} from "@src/surface/backgrounds/fluid/topography-shader";
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

describe("Topography 纯函数与常数", () => {
  it("规格常数", () => {
    expect([TOPO_FOV, TOPO_ORBIT, TOPO_HEIGHT, TOPO_FREQUENCY, TOPO_INTRO_SECONDS, TOPO_MAX_PULSES]).toEqual([0.32, 9, 1.7, 0.45, 2.8, 4]);
    expect(TOPO_DIRECTIONS.forward).toEqual([0, 1]);
    expect(TOPO_DIRECTIONS.left).toEqual([-1, 0]);
    expect([TOPO_HOVER_SIGN.lift, TOPO_HOVER_SIGN.sink, TOPO_HOVER_SIGN.none]).toEqual([1, -1, 0]);
  });
  it("入场平滑涨满, 关掉或减弱动效时为 1", () => {
    expect(topoIntro(1.4, true)).toBeCloseTo(0.5, 6);
    expect(topoIntro(10, true)).toBe(1);
    expect(topoIntro(0, false)).toBe(1);
    expect(topoIntro(Number.POSITIVE_INFINITY, true)).toBe(1);
  });
  it("点击脉冲 0.1 秒升起后衰减, 寿命外为 0", () => {
    expect(topoPulse(0)).toBe(0);
    expect(topoPulse(0.1)).toBeCloseTo(Math.exp(-0.09), 9);
    expect(topoPulse(TOPO_PULSE_LIFE + 0.1)).toBe(0);
  });
  it("拖尾按 trail * 3 秒线性衰减, trail 为 0 时没有", () => {
    expect(topoTrailWeight(0, 0.3)).toBe(1);
    expect(topoTrailWeight(0.45, 0.3)).toBeCloseTo(0.5, 9);
    expect(topoTrailWeight(0.9, 0.3)).toBe(0);
    expect(topoTrailWeight(0, 0)).toBe(0);
  });
  it("着色器: 射线步进加二分, 过密淡出, 主线加粗", () => {
    expect(TOPO_FRAGMENT).toContain("float mid = 0.5 * (lo + hi);");
    expect(TOPO_FRAGMENT).toContain("float crowd = smoothstep(0.3, 0.75, density * max(width, soft));");
    expect(TOPO_FRAGMENT).toContain("mix(0.45, 1.05, smoothstep(0.0, 1.1, h)) * mix(0.35, 1.25, sun * sun) * (1.0 + 0.6 * major)");
  });
});

describe("Topography 渲染", () => {
  it("有 WebGL2 时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container } = render(<Topography direction="left" hoverEffect="sink" />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(draws(calls)).toBeGreaterThan(before);
  });
  it("减弱动效: 只画静态帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const { container } = render(<Topography reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    expect(before).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(draws(calls)).toBe(before);
  });
  it("拿不到 WebGL2 时铺 CSS 渐变兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<Topography />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--primary)");
  });
});
