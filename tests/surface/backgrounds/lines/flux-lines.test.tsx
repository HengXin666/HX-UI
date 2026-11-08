/**
 * lines 路 FluxLines: 纯函数与常数, WebGL2 可用时 live, 不可用时铺兜底, 减弱动效只画一帧.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FluxLines } from "@src/surface/backgrounds/lines/FluxLines";
import { FLUX_FLOW, FLUX_INTRO_SECONDS, FLUX_LINES_FRAGMENT, FLUX_MAGNET_TAU, fluxReference } from "@src/surface/backgrounds/lines/flux-lines-shader";
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

const draws = (calls: string[]): number => calls.filter((c) => c === "drawArrays").length;

describe("FluxLines 纯函数", () => {
  it("规格常数与流向", () => {
    expect([FLUX_INTRO_SECONDS, FLUX_MAGNET_TAU]).toEqual([1.8, 0.3]);
    expect(FLUX_FLOW.down).toEqual([0, -1]);
    expect(FLUX_FLOW.left).toEqual([-1, 0]);
    expect(FLUX_LINES_FRAGMENT).toContain("fwidth");
  });
  it("参考尺度 700 / scale, scale 下限 0.05", () => {
    expect(fluxReference(1.6)).toBeCloseTo(437.5, 6);
    expect(fluxReference(0)).toBe(14000);
  });
});

describe("FluxLines 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<FluxLines data-testid="host" flowDirection="right" />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(200));
    expect(draws(calls)).toBeGreaterThan(before);
  });
  it("WebGL2 不可用时铺兜底, 不透明时用底色", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<FluxLines data-testid="host" transparent={false} backgroundColor="muted" />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--muted)");
  });
  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    render(<FluxLines reducedMotion />);
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(500));
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });
});
