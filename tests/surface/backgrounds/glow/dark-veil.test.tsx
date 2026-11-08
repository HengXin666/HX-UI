/**
 * glow 路 DarkVeil: 场通道与上屏的 uniform 映射, 多通道调度, 减弱动效只画一帧, WebGL 不可用时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DarkVeil, veilCompositeUniforms, veilFieldScale, veilFieldUniforms, type DarkVeilSettings } from "@src/surface/backgrounds/glow/DarkVeil";
import { DARK_VEIL_FIELD, DARK_VEIL_FRAGMENT, DARK_VEIL_INTRO_SECONDS, DARK_VEIL_MAX_FIELD_PIXELS } from "@src/surface/backgrounds/glow/dark-veil-shader";
import { createFollower } from "@src/surface/backgrounds/glow/glow-kit";
import { mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

const BASE: DarkVeilSettings = { scale: 1, rotation: 180, flow: 1, warp: 0, variation: 0, brightness: 1, sheen: 0, glow: 0.4, mouseStrength: 2, intro: true };

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

describe("DarkVeil 纯函数", () => {
  it("规格常数", () => {
    expect([DARK_VEIL_INTRO_SECONDS, DARK_VEIL_MAX_FIELD_PIXELS]).toEqual([1.8, 900000]);
    expect(DARK_VEIL_FRAGMENT).toContain(`uniform sampler2D ${DARK_VEIL_FIELD}`);
    expect(DARK_VEIL_FRAGMENT).toContain("1.0 - exp(-peak * 1.6)");
  });

  it("quality 钳到 0.1..1, 旋转换弧度, 拖拽速度乘力度, 入场 1.8 秒", () => {
    expect([veilFieldScale(0), veilFieldScale(0.5), veilFieldScale(3)]).toEqual([0.1, 0.5, 1]);
    const f = { ...createFollower(), vx: 0.5, vy: -1 };
    const u = veilFieldUniforms(f, BASE);
    expect(u.u_turn).toBeCloseTo(Math.PI, 6);
    expect(u.u_vel).toEqual([1, -2]);
    const c = veilCompositeUniforms({ colors: [], elapsed: 0.9 }, f, { x: 0.2, y: 0.3 }, BASE);
    expect(c.u_intro).toBeCloseTo(0.5, 6);
    expect(c.u_light_at).toEqual([0.2, 0.3, 0]);
  });
});

describe("DarkVeil 渲染", () => {
  it("WebGL2 可用时 live, 每帧先跑场通道再上屏", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<DarkVeil data-testid="host" />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    expect(calls).toContain("createFramebuffer");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(draws(calls)).toBeGreaterThan(before);
    expect(draws(calls) % 2).toBe(0);
  });

  it("减弱动效: 只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const { getByTestId } = render(<DarkVeil data-testid="host" reducedMotion />);
    expect(getByTestId("host").dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });

  it("拿不到 WebGL2 时铺光晕兜底", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<DarkVeil data-testid="host" />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("fallback");
    expect(getByTestId("host").querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
