/**
 * fluid 路 Ferrofluid: 脉冲包络, 跟手份额, 流向常数, 着色器接线, 内核状态, 减弱动效只画一帧, 无 WebGL 时兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Ferrofluid } from "@src/surface/backgrounds/fluid/Ferrofluid";
import { FERRO_F0, FERRO_FLOW, FERRO_FRAGMENT, FERRO_INTRO_SECONDS, FERRO_PULSE_LIFE, ferroFollow, ferroPulse } from "@src/surface/backgrounds/fluid/ferrofluid-shader";
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

describe("Ferrofluid 纯函数与常数", () => {
  it("规格常数", () => {
    expect([FERRO_INTRO_SECONDS, FERRO_F0]).toEqual([2.4, 0.06]);
    expect(FERRO_FLOW.down).toEqual([0, -1]);
    expect(FERRO_FLOW.none).toEqual([0, 0]);
  });
  it("脉冲 0.08 秒升起后指数衰减, 寿命外为 0", () => {
    expect(ferroPulse(0)).toBe(0);
    expect(ferroPulse(0.08)).toBeCloseTo(Math.exp(-0.088), 6);
    expect(ferroPulse(1)).toBeLessThan(ferroPulse(0.2));
    expect(ferroPulse(FERRO_PULSE_LIFE + 1)).toBe(0);
  });
  it("阻尼为 0 时贴手, 否则按 1 - exp(-dt / tau)", () => {
    expect(ferroFollow(0.016, 0)).toBe(1);
    expect(ferroFollow(0.15, 0.15)).toBeCloseTo(1 - Math.exp(-1), 9);
  });
  it("着色器: 射线步进加二分细化", () => {
    expect(FERRO_FRAGMENT).toContain("float mid = 0.5 * (lo + hi);");
    expect(FERRO_FRAGMENT).toContain("smoothstep(0.44, 0.86, n)");
  });
});

describe("Ferrofluid 渲染", () => {
  it("有 WebGL2 时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container } = render(<Ferrofluid />);
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
    const { container } = render(<Ferrofluid reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    expect(before).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(draws(calls)).toBe(before);
  });
  it("拿不到 WebGL2 时铺兜底层, 画布隐藏", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<Ferrofluid />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
  });
});
