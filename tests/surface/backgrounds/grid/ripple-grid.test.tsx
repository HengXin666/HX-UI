/**
 * RippleGrid: 规格常数, 涟漪调度 (自动, 点击, 指针拖尾, 出队), 打包, 渲染状态与减弱动效.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPointerState } from "@src/surface/backdrop/kernel";
import { RippleGrid, makeRippleState, packRipples, rippleFallback, stepRipples } from "@src/surface/backgrounds/grid/RippleGrid";
import { RIPPLE_GRID, RIPPLE_GRID_FRAGMENT, RIPPLE_VARIANTS } from "@src/surface/backgrounds/grid/ripple-grid-shader";
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

const auto = { auto: "center" as const, interval: 2.6, click: true };

describe("RippleGrid 纯函数", () => {
  it("规格常数与样式枚举", () => {
    expect([RIPPLE_GRID.maxRipples, RIPPLE_GRID.introSeconds, RIPPLE_GRID.glowRise, RIPPLE_GRID.glowFall]).toEqual([12, 1.6, 6, 2.5]);
    expect(RIPPLE_VARIANTS).toEqual({ lines: 0, dots: 1, cross: 2 });
    expect(RIPPLE_GRID_FRAGMENT).toContain("u_ripples[12]");
  });

  it("自动涟漪按间隔从中心泛起, 过期出队", () => {
    const s = makeRippleState();
    const pointer = createPointerState();
    expect(stepRipples(s, { time: 0.5, dt: 0.016, pointer }, auto)).toHaveLength(1);
    expect(s.ripples[0]).toMatchObject({ x: 0.5, y: 0.5 });
    expect(stepRipples(s, { time: 1, dt: 0.016, pointer }, auto)).toHaveLength(1);
    expect(stepRipples(s, { time: 3.6, dt: 0.016, pointer }, auto)).toHaveLength(1);
    expect(s.ripples[0].born).toBe(3.6);
    expect(stepRipples(makeRippleState(), { time: 0.5, dt: 0.016, pointer }, { ...auto, auto: "none" })).toHaveLength(0);
  });

  it("新点击放一个涟漪, 同一次点击不重复; 指针移动留弱涟漪; 静态帧不放", () => {
    const s = makeRippleState();
    const pointer = createPointerState();
    pointer.taps = [{ x: 0.2, y: 0.3, at: 1 }];
    const none = { ...auto, auto: "none" as const };
    expect(stepRipples(s, { time: 1, dt: 0.016, pointer }, none)).toHaveLength(1);
    expect(stepRipples(s, { time: 1.1, dt: 0.016, pointer }, none)).toHaveLength(1);
    Object.assign(pointer, { inside: true, vx: 1, vy: 0 });
    expect(stepRipples(s, { time: 1.2, dt: 0.016, pointer }, none).at(-1)?.strength).toBe(0.3);
    expect(stepRipples(makeRippleState(), { time: 1, dt: 0, pointer }, auto)).toHaveLength(0);
  });

  it("光晕随指针升降, 打包年龄, 兜底方格", () => {
    const s = makeRippleState();
    const pointer = createPointerState();
    pointer.inside = true;
    stepRipples(s, { time: 0, dt: 0.1, pointer }, { ...auto, auto: "none" });
    expect(s.glow).toBeCloseTo(1 - Math.exp(-0.6), 6);
    const packed = packRipples([{ x: 0.1, y: 0.2, born: 1, strength: 1 }], 1.5);
    expect(Array.from(packed.slice(0, 4))).toEqual([expect.closeTo(0.1, 6), expect.closeTo(0.2, 6), 0.5, 1]);
    expect(packed).toHaveLength(48);
    expect(rippleFallback("foreground", 48)).toContain("48px 48px");
  });
});

describe("RippleGrid 渲染", () => {
  it("webgl2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<RippleGrid variant="cross" tilt={40} />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(200));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before);
  });

  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const { container } = render(<RippleGrid reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });

  it("拿不到 webgl2 时铺方格兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<RippleGrid />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
