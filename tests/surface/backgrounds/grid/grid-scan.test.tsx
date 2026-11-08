/**
 * GridScan: 规格常数, 扫描面时序, 渲染状态与减弱动效.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { glowFallback } from "@src/surface/backdrop/kernel/fallback";
import { GridScan, scanPlane } from "@src/surface/backgrounds/grid/GridScan";
import { GRID_SCAN, GRID_SCAN_FRAGMENT, SCAN_LINE_STYLES } from "@src/surface/backgrounds/grid/grid-scan-shader";
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

const timing = { duration: 2, delay: 1, direction: "forward" as const, auto: true, depth: 3, width: 1 };

describe("GridScan 纯函数", () => {
  it("规格常数与线型枚举", () => {
    expect([GRID_SCAN.maxPings, GRID_SCAN.pingLife, GRID_SCAN.introSeconds, GRID_SCAN.eyeDistance]).toEqual([4, 2.4, 2.2, 1.25]);
    expect([GRID_SCAN.eyeTau, GRID_SCAN.hoverTau]).toEqual([0.08, 0.25]);
    expect(SCAN_LINE_STYLES).toEqual({ solid: 0, dashed: 1, dotted: 2 });
    expect(GRID_SCAN_FRAGMENT).toContain("hit_tunnel");
  });

  it("扫描面由近及远推进, 停顿期间熄灭, 循环往复", () => {
    const [z1, a1, d1] = scanPlane(1, timing);
    expect(z1).toBeCloseTo(1.5, 6);
    expect(a1).toBe(1);
    expect(d1).toBe(1);
    expect(scanPlane(2.5, timing)[1]).toBe(0);
    expect(scanPlane(4, timing)[0]).toBeCloseTo(1.5, 6);
    expect(scanPlane(0, timing)[1]).toBe(0);
  });

  it("反向, 来回与只扫一次", () => {
    expect(scanPlane(0.5, { ...timing, direction: "backward" })[0]).toBeGreaterThan(2);
    expect(scanPlane(3.5, { ...timing, direction: "pingpong" })[2]).toBe(-1);
    expect(scanPlane(0.5, { ...timing, direction: "pingpong" })[2]).toBe(1);
    expect(scanPlane(4, { ...timing, auto: false })[1]).toBe(0);
    expect(scanPlane(null, timing)[1]).toBe(0);
    expect(scanPlane(0.15, { ...timing, duration: 0.01, delay: 0 })[0]).toBeCloseTo(1.5, 6);
  });
});

describe("GridScan 渲染", () => {
  it("webgl2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<GridScan lineStyle="dashed" clickEffect="scan" />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(200));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before);
  });

  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const { container } = render(<GridScan reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });

  it("拿不到 webgl2 时铺光晕兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<GridScan />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(glowFallback("background", "primary")).toContain("var(--primary)");
  });
});
