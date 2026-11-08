/**
 * rays 路 LightRays: 常数与纯函数, WebGL2 上屏, 减弱动效只画一帧, 拿不到上下文时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LightRays } from "@src/surface/backgrounds/rays/LightRays";
import { aimToward, turn } from "@src/surface/backgrounds/rays/LightRays";
import { LIGHT_RAYS, LIGHT_RAYS_FRAGMENT } from "@src/surface/backgrounds/rays/light-rays-shader";
import { mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

let restore: Array<() => void> = [];
beforeEach(() => {
  useFakeClock();
  restore = [];
});
afterEach(() => {
  restore.forEach((fn) => fn());
  vi.useRealTimers();
});

function draws(calls: readonly string[]): number {
  return calls.filter((c) => c === "drawArrays").length;
}

describe("LightRays", () => {
  it("规格常数, 朝向与旋转", () => {
    expect([LIGHT_RAYS.pixelBudget, LIGHT_RAYS.maxPulses, LIGHT_RAYS.openSeconds, LIGHT_RAYS.steerTau, LIGHT_RAYS.glideTau]).toEqual([2.4e6, 4, 1.8, 0.2, 0.08]);
    expect(LIGHT_RAYS_FRAGMENT).toContain("0.62");
    const down = aimToward([0.5, 1], [0.5, 0], 2);
    expect(down[0]).toBeCloseTo(0, 6);
    expect(down[1]).toBeCloseTo(-1, 6);
    const right = turn([1, 0], 90);
    expect(right[0]).toBeCloseTo(0, 6);
    expect(right[1]).toBeCloseTo(1, 6);
  });

  it("WebGL2 下上屏并持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<LightRays raysOrigin="left" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(draws(calls)).toBeGreaterThan(before);
  });

  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(true));
    const { container } = render(<LightRays />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    expect(before).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(draws(calls)).toBe(before);
  });

  it("拿不到 webgl2 时铺兜底层, 画布隐藏", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<LightRays />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
  });
});
