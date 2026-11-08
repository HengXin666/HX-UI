/**
 * rays 路 Beams: 常数与纯函数, WebGL2 上屏, 减弱动效只画一帧, 拿不到上下文时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Beams } from "@src/surface/backgrounds/rays/Beams";
import { BEAMS, BEAMS_FRAGMENT } from "@src/surface/backgrounds/rays/beams-shader";
import { backdropOf, budgetEdge, followStep, introProgress, paletteList, qualityDpr } from "@src/surface/backgrounds/rays/field";
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

describe("rays 共用", () => {
  it("入场进度, 指数跟随, 底色, 调色板, 画质与像素预算", () => {
    expect(introProgress(0.8, 1.6, true)).toBeCloseTo(0.5, 6);
    expect(introProgress(Number.POSITIVE_INFINITY, 1.6, true)).toBe(1);
    expect(introProgress(0, 1.6, false)).toBe(1);
    expect(followStep(0, 1, 1, Math.log(2))).toBeCloseTo(0.5, 6);
    expect(followStep(0.3, 1, 0, 7)).toBe(0.3);
    expect(backdropOf([[1, 0, 0]], 1, true)).toEqual([0, 0, 0, 0]);
    expect(backdropOf([[1, 0, 0], [0, 1, 0]], 1, true)).toEqual([0, 1, 0, 1]);
    expect(Array.from(paletteList([[1, 0, 0]], 2).list)).toEqual([1, 0, 0, 1, 0, 0]);
    expect(qualityDpr(undefined, 0.75)).toBe(1.5);
    expect(qualityDpr(2, 0)).toBe(0.25);
    expect(budgetEdge(1_600_000)).toBe(1687);
  });
});

describe("Beams", () => {
  it("规格常数与片元源码", () => {
    expect([BEAMS.introSeconds, BEAMS.followRate, BEAMS.reachIn, BEAMS.reachOut, BEAMS.maxFieldPixels]).toEqual([1.6, 7, 3.2, 1.8, 1_600_000]);
    expect(BEAMS_FRAGMENT).toContain("0.028");
    expect(BEAMS_FRAGMENT).toContain("rays_compose");
  });

  it("WebGL2 下上屏并持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<Beams data-testid="beams" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before);
  });

  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<Beams reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });

  it("拿不到 webgl2 时铺 token 光晕兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<Beams color="primary" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
  });
});
