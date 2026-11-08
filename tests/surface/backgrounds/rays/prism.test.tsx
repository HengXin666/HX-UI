/**
 * rays 路 Prism: 常数与纯函数, WebGL2 上屏, 减弱动效只画一帧, 拿不到上下文时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prism } from "@src/surface/backgrounds/rays/Prism";
import { inertiaFollow, PRISM, PRISM_FRAGMENT, rollDecay } from "@src/surface/backgrounds/rays/prism-shader";
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

describe("Prism", () => {
  it("规格常数, 惯性跟随与横滚回正", () => {
    expect([PRISM.introSeconds, PRISM.refFps, PRISM.rollKeep]).toEqual([1.4, 60, 0.9]);
    expect(inertiaFollow(1 / 60, 0.05)).toBeCloseTo(0.05, 6);
    expect(inertiaFollow(2 / 60, 0.05)).toBeCloseTo(1 - 0.95 * 0.95, 6);
    expect(inertiaFollow(0, 0.5)).toBe(0);
    expect(rollDecay(1, 1 / 60)).toBeCloseTo(0.9, 6);
    expect(PRISM_FRAGMENT).toContain("float pyramid(vec3 p)");
  });

  it("WebGL2 下上屏并持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<Prism colors={["primary", "accent"]} animationType="rotate3d" offset={{ x: 10 }} />);
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
    const { container } = render(<Prism />);
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
    const { container } = render(<Prism />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
  });
});
