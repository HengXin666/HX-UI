/**
 * fluid 路 MagicRings: 环的包络, 布局, 跟手弹簧的纯函数, 规格常数, 着色器接线, 内核状态, 减弱动效只画一帧, 无 WebGL 时兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MagicRings } from "@src/surface/backgrounds/fluid/MagicRings";
import {
  RINGS_BURST_LIFE, RINGS_BURST_SPEED, RINGS_CYCLE, RINGS_DAMPING, RINGS_DEPTH, RINGS_MAX, RINGS_MAX_BURSTS, RINGS_STAGGER, ringsBurstLife, ringsLayout,
  ringsPulseLife, stepRingsSpring, type RingsLayout,
} from "@src/surface/backgrounds/fluid/magic-rings-motion";
import { RINGS_FRAGMENT } from "@src/surface/backgrounds/fluid/magic-rings-shader";
import { mockIntersection, mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

let restore: Array<() => void> = [];
beforeEach(() => {
  useFakeClock();
  restore = [];
});
afterEach(() => {
  restore.forEach((fn) => fn());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const draws = (calls: string[]): number => calls.filter((c) => c === "drawArrays").length;
const LAYOUT: RingsLayout = { ringCount: 6, motion: "pulse", baseRadius: 0.35, radiusStep: 0.1, expansion: 0.1, intro: false };

describe("MagicRings 纯函数与常数", () => {
  it("规格常数", () => {
    expect([RINGS_MAX, RINGS_MAX_BURSTS, RINGS_CYCLE, RINGS_STAGGER, RINGS_DEPTH, RINGS_BURST_LIFE, RINGS_BURST_SPEED]).toEqual([12, 3, 3.45, 0.5, 2.6, 1.1, 0.9]);
    expect(RINGS_DAMPING).toBeCloseTo(2 * Math.sqrt(70) * 0.9, 9);
  });
  it("pulse 包络 0.7 秒亮起, 3.25 秒熄灭; 爆环包络两头为 0", () => {
    expect(ringsPulseLife(0)).toBe(0);
    expect(ringsPulseLife(0.7)).toBeGreaterThan(0.9);
    expect(ringsPulseLife(3.3)).toBe(0);
    expect(ringsBurstLife(0)).toBe(0);
    expect(ringsBurstLife(0.3)).toBe(1);
    expect(ringsBurstLife(1)).toBe(0);
  });
  it("布局: pulse 下外环晚出生, static 下半径按步长排开", () => {
    const pulse = ringsLayout(LAYOUT, 0.2, Number.POSITIVE_INFINITY);
    expect(pulse[1]).toBeGreaterThan(0);
    expect(pulse[4 + 1]).toBe(0);
    const still = ringsLayout({ ...LAYOUT, motion: "static" }, 5, Number.POSITIVE_INFINITY);
    expect(still[0]).toBeCloseTo(0.35, 9);
    expect(still[4]).toBeCloseTo(0.45, 9);
    expect(still[6 * 4 + 1]).toBe(0);
    expect(ringsLayout({ ...LAYOUT, motion: "static", intro: true }, 0, 0.1)[1]).toBeLessThan(1);
  });
  it("跟手弹簧收敛到目标, 悬停涨到 1", () => {
    const s = { x: 0, y: 0, vx: 0, vy: 0, hover: 0, hoverVelocity: 0 };
    for (let i = 0; i < 120; i += 1) stepRingsSpring(s, 0.2, -0.1, 1, 1 / 60);
    expect(s.x).toBeCloseTo(0.2, 3);
    expect(s.y).toBeCloseTo(-0.1, 3);
    expect(s.hover).toBeCloseTo(1, 2);
  });
  it("着色器: 环与爆环数组, 峰值压缩", () => {
    expect(RINGS_FRAGMENT).toContain("uniform vec4 u_rings[12];");
    expect(RINGS_FRAGMENT).toContain("vec3 level = 1.0 - exp(-peak);");
    expect(RINGS_FRAGMENT).toContain("float boost = 1.0 + 1.6 * nearness(plane)");
  });
});

describe("MagicRings 渲染", () => {
  it("有 WebGL2 时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container } = render(<MagicRings followMouse dispersion={1} tilt={30} />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(draws(calls)).toBeGreaterThan(before);
  });
  it("减弱动效: 只画静态帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const { container } = render(<MagicRings reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    expect(before).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(draws(calls)).toBe(before);
  });
  it("拿不到 WebGL2 时铺兜底层", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<MagicRings />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
