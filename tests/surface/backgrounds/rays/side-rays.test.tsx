/**
 * rays 路 SideRays: 常数与纯函数, WebGL2 上屏, 减弱动效只画一帧, 拿不到上下文时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SideRays } from "@src/surface/backgrounds/rays/SideRays";
import { baseAngle, wrapAngle } from "@src/surface/backgrounds/rays/SideRays";
import { SIDE_RAYS, SIDE_RAYS_FRAGMENT, springStep } from "@src/surface/backgrounds/rays/side-rays-shader";
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

describe("SideRays", () => {
  it("规格常数, 角度与临界阻尼弹簧", () => {
    expect([SIDE_RAYS.pixelBudget, SIDE_RAYS.revealSeconds, SIDE_RAYS.focusRate, SIDE_RAYS.focusReach, SIDE_RAYS.stiffness]).toEqual([2.4e6, 1.6, 6, 1.5, 18]);
    expect(SIDE_RAYS_FRAGMENT).toContain("fwidth");
    expect(baseAngle([0, 0.5], 1)).toBeCloseTo(0, 6);
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(Math.PI, 6);
    let s: [number, number] = [0, 0];
    for (let i = 0; i < 600; i += 1) s = springStep(s[0], s[1], 1, 1 / 60);
    expect(s[0]).toBeCloseTo(1, 3);
    const [, v] = springStep(0, 0, 1, 0.01);
    expect(v).toBeCloseTo(0.18, 6);
  });

  it("WebGL2 下上屏并持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<SideRays origin="left" dust={0.5} />);
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
    const { container } = render(<SideRays />);
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
    const { container } = render(<SideRays />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
  });
});
