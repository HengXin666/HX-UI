/**
 * glow 路 Aurora: 色标与入场的 uniform 映射, 着色器调度, 减弱动效只画一帧, WebGL 不可用时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AURORA_DEFAULT_STOPS, Aurora, auroraUniforms, type AuroraSettings } from "@src/surface/backgrounds/glow/Aurora";
import { AURORA_FRAGMENT, AURORA_INTRO_SECONDS, AURORA_MAX_LAYERS, AURORA_MAX_STOPS } from "@src/surface/backgrounds/glow/aurora-shader";
import { createFollower } from "@src/surface/backgrounds/glow/glow-kit";
import { mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

const BASE: AuroraSettings = { amplitude: 1, blend: 0.5, height: 0.45, scale: 1, glow: 0.6, brightness: 1, layers: 9, direction: "bottom", intro: true };

let restore: Array<() => void> = [];
beforeEach(() => {
  useFakeClock();
  restore = [];
});
afterEach(() => {
  restore.forEach((fn) => fn());
  vi.useRealTimers();
});

describe("Aurora 纯函数", () => {
  it("规格常数", () => {
    expect([AURORA_MAX_STOPS, AURORA_MAX_LAYERS, AURORA_INTRO_SECONDS]).toEqual([5, 3, 2.4]);
    expect(AURORA_FRAGMENT).toContain("uniform vec3 u_stops[5]");
    expect(AURORA_DEFAULT_STOPS[0]).toBe("primary");
  });

  it("层数钳到 3, 方向翻转, 入场按 2.4 秒走, 外部时钟覆写 u_time", () => {
    const frame = { colors: [[1, 0, 0] as const, [0, 1, 0] as const], elapsed: 1.2, time: 3 };
    const u = auroraUniforms(frame, createFollower(), { ...BASE, time: 42 });
    expect(u.u_layers).toBe(3);
    expect(u.u_flip).toBe(1);
    expect(u.u_stop_count).toBe(2);
    expect(u.u_reveal).toBeCloseTo(0.5, 6);
    expect(u.u_time).toBe(42);
    const done = auroraUniforms({ ...frame, elapsed: Number.POSITIVE_INFINITY }, createFollower(), BASE);
    expect(done.u_reveal).toBe(1);
    expect(done.u_time).toBeUndefined();
  });
});

describe("Aurora 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<Aurora data-testid="host" />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before);
  });

  it("减弱动效: 只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const { getByTestId } = render(<Aurora data-testid="host" reducedMotion />);
    expect(getByTestId("host").dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(before).toBeGreaterThan(0);
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });

  it("拿不到 WebGL2 时铺色标渐变兜底", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<Aurora data-testid="host" colorStops={["primary", "accent"]} />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--primary)");
  });
});
