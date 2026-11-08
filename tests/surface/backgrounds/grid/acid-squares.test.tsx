/**
 * AcidSquares: 规格常数, 弹簧与入场时序, 相机, 运动状态, 渲染状态与减弱动效.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPointerState } from "@src/surface/backdrop/kernel";
import { glowFallback } from "@src/surface/backdrop/kernel/fallback";
import { AcidSquares, makeAcidMotion, stepAcidMotion } from "@src/surface/backgrounds/grid/AcidSquares";
import {
  ACID_HOVER, ACID_LIGHTING, ACID_PULSE_ORIGINS, ACID_QUALITY, ACID_SHAPES, ACID_SQUARES, heightReach, introSwell, orbitCamera, revealFront, springStep,
} from "@src/surface/backgrounds/grid/acid-squares-motion";
import { ACID_SQUARES_FRAGMENT } from "@src/surface/backgrounds/grid/acid-squares-shader";
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

describe("AcidSquares 纯函数", () => {
  it("规格常数与枚举", () => {
    expect([ACID_SQUARES.maxRipples, ACID_SQUARES.introSeconds, ACID_SQUARES.revealSeconds, ACID_SQUARES.revealReach]).toEqual([8, 3, 2.6, 19]);
    expect([ACID_SQUARES.hoverStiffness, ACID_SQUARES.hoverDamping, ACID_SQUARES.lookStiffness, ACID_SQUARES.lookDamping]).toEqual([90, 19, 30, 11]);
    expect(ACID_HOVER).toEqual({ press: 1, lift: -1, none: 0 });
    expect(ACID_LIGHTING).toEqual({ split: 0, mono: 1 });
    expect(ACID_SHAPES).toEqual({ square: 0, circle: 1 });
    expect(ACID_PULSE_ORIGINS).toEqual({ center: 0, pointer: 1 });
    expect(ACID_QUALITY).toEqual({ low: 48, medium: 72, high: 96 });
    expect(ACID_SQUARES_FRAGMENT).toContain("cell_height");
    expect(ACID_SQUARES_FRAGMENT).toContain("0.04 + 0.96 * pow(1.0 - ndv, 5.0)");
  });

  it("弹簧趋向目标, 静态帧直接落位", () => {
    const s = { x: 0, y: 0, vx: 0, vy: 0 };
    for (let i = 0; i < 240; i += 1) springStep(s, 1, -1, 1 / 60, 90, 19);
    expect(s.x).toBeCloseTo(1, 3);
    expect(s.y).toBeCloseTo(-1, 3);
    springStep(s, 0.3, 0.4, 0, 90, 19);
    expect([s.x, s.y, s.vx, s.vy]).toEqual([0.3, 0.4, 0, 0]);
  });

  it("入场隆起与揭开前沿", () => {
    expect(introSwell(0, true)).toBeCloseTo(0.9, 6);
    expect(introSwell(1.5, true)).toBeCloseTo(0.9, 6);
    expect(introSwell(3, true)).toBe(0);
    expect(introSwell(0, false)).toBe(0);
    expect(introSwell(Number.POSITIVE_INFINITY, true)).toBe(0);
    expect(revealFront(1.3, true)).toEqual([11, 0]);
    expect(revealFront(5, true)[1]).toBe(1);
    expect(revealFront(Number.POSITIVE_INFINITY, true)).toEqual([19, 1]);
    expect(revealFront(0, false)[1]).toBe(1);
  });

  it("柱顶上限随各项叠加", () => {
    const base = { waves: 1, pulse: 1, bulge: 0.3, swell: 0, hover: false };
    expect(heightReach(base)).toBeCloseTo(0.71 + 0.5 + 0.075 + 0.8, 6);
    expect(heightReach({ ...base, hover: true, swell: 0.9 })).toBeGreaterThan(heightReach(base) + 1.4);
  });

  it("相机: 正交基, 视线穿过地面原点, 缩放改画面半高", () => {
    const cam = orbitCamera({ rotation: 35, tilt: 0.7, zoom: 1, tileSize: 1, depth: 10, look: [0, 0] });
    const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
    expect(dot(cam.forward, cam.right)).toBeCloseTo(0, 6);
    expect(dot(cam.forward, cam.up)).toBeCloseTo(0, 6);
    expect(dot(cam.right, cam.up)).toBeCloseTo(0, 6);
    expect(cam.forward[1]).toBeLessThan(0);
    const t = cam.eye[1] / -cam.forward[1];
    expect(cam.eye[0] + cam.forward[0] * t).toBeCloseTo(0, 6);
    expect(cam.eye[2] + cam.forward[2] * t).toBeCloseTo(0, 6);
    expect(cam.viewHalf).toBe(8);
    expect(orbitCamera({ rotation: 0, tilt: 0.7, zoom: 2, tileSize: 1, depth: 10, look: [0, 0] }).viewHalf).toBe(4);
    expect(cam.focal).toBe(2.5);
  });

  it("运动状态: 指针在场时悬停升起, 关闭交互时不升", () => {
    const pointer = { ...createPointerState(), x: 0.8, y: 0.3, inside: true };
    const m = stepAcidMotion(makeAcidMotion(), { dt: 0, pointer }, true);
    expect([m.hover.x, m.hover.y, m.presence.value]).toEqual([0.8, 0.3, 1]);
    expect(m.look.x).toBeCloseTo(0.036, 6);
    expect(stepAcidMotion(makeAcidMotion(), { dt: 0, pointer }, false).presence.value).toBe(0);
  });
});

describe("AcidSquares 渲染", () => {
  it("webgl2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<AcidSquares shape="circle" hoverEffect="lift" lighting="mono" pulseOrigin="pointer" quality="high" />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(200));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before);
  });

  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const { container } = render(<AcidSquares reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });

  it("拿不到 webgl2 时铺光晕兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<AcidSquares />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(glowFallback("muted", "primary")).toContain("var(--primary)");
  });
});
