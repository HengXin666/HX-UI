/**
 * rays 路 Lightfall: 常数与纯函数, WebGL2 上屏, 减弱动效只画一帧, 拿不到上下文时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Lightfall } from "@src/surface/backgrounds/rays/Lightfall";
import { dampFollow, LIGHTFALL, LIGHTFALL_FRAGMENT, warpStep } from "@src/surface/backgrounds/rays/lightfall-shader";
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

describe("Lightfall", () => {
  it("规格常数, 冲刺与跟随", () => {
    expect([LIGHTFALL.maxColors, LIGHTFALL.introSeconds, LIGHTFALL.warpSpeed, LIGHTFALL.warpRise, LIGHTFALL.warpFall, LIGHTFALL.travelRate, LIGHTFALL.lensRate]).toEqual([8, 2.6, 9, 2.2, 1.6, 0.1, 6]);
    expect([LIGHTFALL.touchIn, LIGHTFALL.touchOut]).toEqual([4, 2]);
    expect(warpStep(0, true, 1)).toBeCloseTo(1 - Math.exp(-2.2), 6);
    expect(warpStep(1, false, 1)).toBeCloseTo(Math.exp(-1.6), 6);
    expect(warpStep(0.4, true, 0)).toBe(0.4);
    expect(dampFollow(0.15, 0.15)).toBeCloseTo(1 - Math.exp(-1), 6);
    expect(dampFollow(0.1, 0)).toBe(1);
    expect(LIGHTFALL_FRAGMENT).toContain("smoothstep(1.6, 3.2, spacingPx)");
    expect(LIGHTFALL_FRAGMENT).toContain("smoothstep(0.72 * edge, edge");
  });

  it("WebGL2 下上屏并持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<Lightfall colors={["primary", "accent"]} backgroundColor="background" />);
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
    const { container } = render(<Lightfall />);
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
    const { container } = render(<Lightfall />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
  });
});
