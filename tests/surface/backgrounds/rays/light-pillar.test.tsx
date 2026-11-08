/**
 * rays 路 LightPillar: 常数与纯函数, WebGL2 上屏, 减弱动效只画一帧, 拿不到上下文时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LightPillar } from "@src/surface/backgrounds/rays/LightPillar";
import { LIGHT_PILLAR, LIGHT_PILLAR_FRAGMENT, quintic } from "@src/surface/backgrounds/rays/light-pillar-shader";
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

describe("LightPillar", () => {
  it("规格常数与五次入场曲线", () => {
    expect(LIGHT_PILLAR.quality).toEqual({ low: 0.35, medium: 0.5, high: 0.6 });
    expect([LIGHT_PILLAR.introSeconds, LIGHT_PILLAR.pulseLife, LIGHT_PILLAR.minScale, LIGHT_PILLAR.spin, LIGHT_PILLAR.followRate, LIGHT_PILLAR.touchRate]).toEqual([2.1, 1.4, 0.25, 0.96, 2.4, 3]);
    expect([quintic(0), quintic(0.5), quintic(1)]).toEqual([0, 0.5, 1]);
    expect(LIGHT_PILLAR_FRAGMENT).toContain("1.0 / d");
  });

  it("WebGL2 下上屏并持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<LightPillar quality="low" clickPulse={false} />);
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
    const { container } = render(<LightPillar />);
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
    const { container } = render(<LightPillar />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
  });
});
