/**
 * glow 路 ColorBends: 色带取用, 自转与钳位的 uniform 映射, 着色器调度, 减弱动效只画一帧, WebGL 不可用时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bendColors, COLOR_BENDS_DEFAULT_COLORS, ColorBends, colorBendsUniforms, type ColorBendsSettings } from "@src/surface/backgrounds/glow/ColorBends";
import { COLOR_BENDS_FRAGMENT, COLOR_BENDS_MAX_COLORS } from "@src/surface/backgrounds/glow/color-bends-shader";
import { createFollower } from "@src/surface/backgrounds/glow/glow-kit";
import { mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

const BASE: ColorBendsSettings = {
  rotation: 90, transparent: false, autoRotate: 45, scale: 1, frequency: 1, warpStrength: 1, mouseInfluence: 1, parallax: 0.5, noise: 0.15, iterations: 20,
  intensity: 1.5, bandWidth: 6,
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

describe("ColorBends 纯函数", () => {
  it("规格常数", () => {
    expect(COLOR_BENDS_MAX_COLORS).toBe(8);
    expect(COLOR_BENDS_FRAGMENT).toContain("float w = 1.0 - exp(-u_band_width / exp(u_band_width * m));");
    expect(COLOR_BENDS_FRAGMENT).toContain("float gain = 1.0 + max(u_warp_strength - 1.0, 0.0);");
  });

  it("空色带退到默认, 超出 8 条截掉", () => {
    expect(bendColors([])).toEqual(COLOR_BENDS_DEFAULT_COLORS);
    expect(bendColors(Array.from({ length: 10 }, (_, i) => `c${i}`))).toHaveLength(8);
  });

  it("自转随时钟累加, 迭代钳到 6, 透明开关", () => {
    const u = colorBendsUniforms({ colors: [], time: 2 }, createFollower(), BASE);
    expect(u.u_rot).toBeCloseTo(Math.PI, 6);
    expect([u.u_iterations, u.u_transparent, u.u_color_count]).toEqual([6, 0, 1]);
  });
});

describe("ColorBends 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<ColorBends data-testid="host" />);
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
    const { getByTestId } = render(<ColorBends data-testid="host" />);
    expect(getByTestId("host").dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });

  it("拿不到 WebGL2 时铺色带渐变兜底", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<ColorBends data-testid="host" />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
