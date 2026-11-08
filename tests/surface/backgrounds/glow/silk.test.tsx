/**
 * glow 路 Silk: 五次缓动, 入场冲刺相位与指针的 uniform 映射, 着色器调度, 减弱动效只画一帧, WebGL 不可用时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFollower } from "@src/surface/backgrounds/glow/glow-kit";
import { Silk, silkEase, silkUniforms, type SilkSettings } from "@src/surface/backgrounds/glow/Silk";
import { SILK_FRAGMENT, SILK_INTRO_RUSH, SILK_INTRO_SECONDS, SILK_WAVE_LIFE } from "@src/surface/backgrounds/glow/silk-shader";
import { mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

const BASE: SilkSettings = {
  scale: 1, noiseIntensity: 1.5, rotation: 90, sheen: 0.5, depth: 0.5, glow: 0.3, ripple: 1, wave: 1, variation: 0, interactionStrength: 2, clickRipple: false, intro: true,
};

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

describe("Silk 纯函数", () => {
  it("规格常数", () => {
    expect([SILK_INTRO_SECONDS, SILK_INTRO_RUSH, SILK_WAVE_LIFE]).toEqual([2.2, 1.6, 1.6]);
    expect(SILK_FRAGMENT).toContain("pow(max(dot(normal, halfway), 0.0), 48.0) * smoothstep(0.25, 0.85, n)");
    expect(SILK_FRAGMENT).toContain("1.0 + (dot(normal, toLight) - toLight.z) * 1.8 * u_depth");
  });

  it("五次缓动两端与中点", () => {
    expect([silkEase(-1), silkEase(0.5), silkEase(2)]).toEqual([0, 0.5, 1]);
  });

  it("入场冲刺相位逐步收回, 旋转换弧度, 拖拽速度乘力度, 涟漪开关", () => {
    const f = { ...createFollower(), vx: 0.5, vy: -1 };
    const start = silkUniforms({ colors: [], elapsed: 0, time: 0 }, f, { x: 0.2, y: 0.3 }, BASE);
    expect(start.u_flow).toBeCloseTo(-SILK_INTRO_RUSH, 6);
    expect(start.u_intro).toBe(0);
    expect(start.u_turn).toBeCloseTo(Math.PI / 2, 6);
    expect(start.u_vel).toEqual([1, -2]);
    expect(start.u_ripple_on).toBe(0);
    expect(start.u_light_at).toEqual([0.2, 0.3, 0]);
    const done = silkUniforms({ colors: [], elapsed: Number.POSITIVE_INFINITY, time: 10 }, f, { x: 0.5, y: 0.5 }, BASE);
    expect(done.u_flow).toBeCloseTo(1, 6);
    expect(done.u_intro).toBe(1);
  });
});

describe("Silk 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<Silk data-testid="host" />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(draws(calls)).toBeGreaterThan(before);
  });

  it("减弱动效: 只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(true));
    const { getByTestId } = render(<Silk data-testid="host" />);
    expect(getByTestId("host").dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });

  it("拿不到 WebGL2 时铺渐变兜底", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<Silk data-testid="host" />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
