/**
 * fluid 路 MoltenMetal: 拖尾, 耀斑与入场的纯函数, 调色板偏置, 着色器接线, 内核状态, 减弱动效只画一帧, 无 WebGL 时兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MoltenMetal } from "@src/surface/backgrounds/fluid/MoltenMetal";
import {
  MOLTEN_BALANCE, MOLTEN_FLARE_SECONDS, MOLTEN_FRAGMENT, MOLTEN_INTRO_SECONDS, MOLTEN_MAX_COLORS, MOLTEN_MAX_FLARES, MOLTEN_SAMPLE_SECONDS, MOLTEN_TRAIL,
  MOLTEN_TRAIL_SECONDS, moltenFlare, moltenReveal, moltenTrailWeight,
} from "@src/surface/backgrounds/fluid/molten-metal-shader";
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

describe("MoltenMetal 纯函数与常数", () => {
  it("规格常数", () => {
    expect([MOLTEN_MAX_COLORS, MOLTEN_TRAIL, MOLTEN_MAX_FLARES]).toEqual([6, 16, 8]);
    expect([MOLTEN_SAMPLE_SECONDS, MOLTEN_TRAIL_SECONDS, MOLTEN_FLARE_SECONDS, MOLTEN_INTRO_SECONDS]).toEqual([0.06, 0.9, 1.8, 2.4]);
    expect(MOLTEN_BALANCE).toEqual({ molten: 0.5, ember: 0.3, frost: 0.7 });
  });
  it("拖尾权重从 1 平方衰减到 0", () => {
    expect(moltenTrailWeight(0)).toBe(1);
    expect(moltenTrailWeight(MOLTEN_TRAIL_SECONDS / 2)).toBeCloseTo(0.25, 9);
    expect(moltenTrailWeight(MOLTEN_TRAIL_SECONDS)).toBe(0);
    expect(moltenTrailWeight(-1)).toBe(0);
  });
  it("耀斑迅速升起, 寿命内落回 0", () => {
    expect(moltenFlare(0)).toBe(0);
    expect(moltenFlare(0.3)).toBeGreaterThan(0.9);
    expect(moltenFlare(1.5)).toBeLessThan(moltenFlare(0.3));
    expect(moltenFlare(MOLTEN_FLARE_SECONDS)).toBe(0);
  });
  it("入场线性涨满, 关掉或减弱动效时为 1", () => {
    expect(moltenReveal(1.2, true)).toBeCloseTo(0.5, 6);
    expect(moltenReveal(9, true)).toBe(1);
    expect(moltenReveal(0, false)).toBe(1);
    expect(moltenReveal(Number.POSITIVE_INFINITY, true)).toBe(1);
  });
  it("着色器: 调色板数组, 拖尾与耀斑数组, 屏幕导数脊线", () => {
    expect(MOLTEN_FRAGMENT).toContain("uniform vec3 u_colors[6];");
    expect(MOLTEN_FRAGMENT).toContain("uniform vec4 u_trail[16];");
    expect(MOLTEN_FRAGMENT).toContain("float footprint = 0.5 * length(vec2(dFdx(l), dFdy(l)));");
  });
});

describe("MoltenMetal 渲染", () => {
  it("有 WebGL2 时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container } = render(<MoltenMetal colors={["primary", "accent", "accent-2"]} colorMode="ember" />);
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
    const { container } = render(<MoltenMetal reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    expect(before).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(draws(calls)).toBe(before);
  });
  it("拿不到 WebGL2 时铺兜底层", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<MoltenMetal />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
