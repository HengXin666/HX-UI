/**
 * glow 路 SoftAurora: 双色与入场的 uniform 映射, 着色器调度, 减弱动效只画一帧, WebGL 不可用时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFollower } from "@src/surface/backgrounds/glow/glow-kit";
import { SoftAurora, softAuroraUniforms, type SoftAuroraSettings } from "@src/surface/backgrounds/glow/SoftAurora";
import { SOFT_AURORA_FRAGMENT, SOFT_AURORA_INTRO_SECONDS, SOFT_AURORA_MAX_PULSES } from "@src/surface/backgrounds/glow/soft-aurora-shader";
import { mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

const BASE: SoftAuroraSettings = {
  scale: 1.5, brightness: 1, noiseFrequency: 2.5, noiseAmplitude: 1, bandHeight: 0.5, bandSpread: 1, octaveDecay: 0.1, layerOffset: 0, colorSpeed: 1,
  spectrum: 1, tilt: 90, mouseInfluence: 0.25, clickPulse: false, intro: true,
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

describe("SoftAurora 纯函数", () => {
  it("规格常数", () => {
    expect([SOFT_AURORA_MAX_PULSES, SOFT_AURORA_INTRO_SECONDS]).toEqual([4, 2]);
    expect(SOFT_AURORA_FRAGMENT).toContain("0.88 * (1.0 - exp(-1.9 * pow(");
  });

  it("倾角换弧度, 脉冲开关, 入场在 2 秒内走完, 缺色时用兜底", () => {
    const u = softAuroraUniforms({ colors: [], elapsed: 1 }, createFollower(), BASE);
    expect(u.u_tilt).toBeCloseTo(Math.PI / 2, 6);
    expect(u.u_pulse_on).toBe(0);
    expect(u.u_open).toBeCloseTo(0.875, 6);
    expect(u.u_color1).toEqual([0.95, 0.95, 0.95]);
    expect(softAuroraUniforms({ colors: [], elapsed: Number.POSITIVE_INFINITY }, createFollower(), BASE).u_open).toBe(1);
  });
});

describe("SoftAurora 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<SoftAurora data-testid="host" />);
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
    const { getByTestId } = render(<SoftAurora data-testid="host" />);
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
    const { getByTestId } = render(<SoftAurora data-testid="host" />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
