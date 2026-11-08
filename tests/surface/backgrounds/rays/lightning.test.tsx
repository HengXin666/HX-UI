/**
 * rays 路 Lightning: 常数与纯函数, WebGL2 上屏, 减弱动效只画一帧, 拿不到上下文时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Lightning } from "@src/surface/backgrounds/rays/Lightning";
import { LIGHTNING, LIGHTNING_FRAGMENT, revealLine } from "@src/surface/backgrounds/rays/lightning-shader";
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

describe("Lightning", () => {
  it("规格常数与揭开线", () => {
    expect([LIGHTNING.maxBolts, LIGHTNING.maxStrikes, LIGHTNING.leader, LIGHTNING.life]).toEqual([4, 4, 0.11, 1.3]);
    expect(revealLine(0)).toBeCloseTo(1.1, 6);
    expect(revealLine(1)).toBeCloseTo(-1.3, 6);
    expect(LIGHTNING_FRAGMENT).toContain("const float PERIOD = 8.0;");
    expect(LIGHTNING_FRAGMENT).toContain("const float WARP = 2.1;");
    expect(LIGHTNING_FRAGMENT).toContain("0.82 + 0.18 * sin");
    expect(LIGHTNING_FRAGMENT).toContain("1.0 - exp(-energy * 0.35)");
  });

  it("WebGL2 下上屏并持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<Lightning bolts={3} branches={1} angle={10} />);
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
    const { container } = render(<Lightning />);
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
    const { container } = render(<Lightning />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
  });
});
