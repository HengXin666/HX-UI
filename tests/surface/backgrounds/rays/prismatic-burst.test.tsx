/**
 * rays 路 PrismaticBurst: 常数与纯函数, WebGL2 上屏, 减弱动效只画一帧, 拿不到上下文时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaticBurst } from "@src/surface/backgrounds/rays/PrismaticBurst";
import { burstPhaseStep, burstScale, PRISMATIC_BURST, PRISMATIC_BURST_FRAGMENT } from "@src/surface/backgrounds/rays/prismatic-burst-shader";
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

describe("PrismaticBurst", () => {
  it("规格常数, 相位推进与渲染比例", () => {
    expect(PRISMATIC_BURST.quality).toEqual({ low: 0.35, medium: 0.5, high: 0.7 });
    expect([PRISMATIC_BURST.minScale, PRISMATIC_BURST.introSeconds, PRISMATIC_BURST.pulseLife, PRISMATIC_BURST.maxPulses]).toEqual([0.2, 2.4, 1.5, 4]);
    expect(PRISMATIC_BURST.animations).toEqual({ rotate: 0, rotate3d: 1, hover: 2 });
    expect(burstPhaseStep(1, 0.5, 0.5, 1, 2)).toBeCloseTo(1 + 0.5 * 0.5 * 2 + 2 * 0.5, 6);
    expect([burstScale("low"), burstScale("high"), burstScale("medium", 0.1), burstScale("low", 0.9)]).toEqual([0.35, 0.7, 0.2, 0.9]);
    expect(PRISMATIC_BURST_FRAGMENT).toContain("0.5 - 0.35 * (u_ray_width - 1.0)");
    expect(PRISMATIC_BURST_FRAGMENT).toContain("smoothstep(0.15, 0.95, comb)");
  });

  it("WebGL2 下上屏并持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<PrismaticBurst colors={["primary", "accent"]} animationType="hover" rayCount={8} quality="low" />);
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
    const { container } = render(<PrismaticBurst />);
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
    const { container } = render(<PrismaticBurst />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
  });
});
