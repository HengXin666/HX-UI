/**
 * glyph 路 Radar: 纯函数与常数, WebGL 可用时 live, 减弱动效只画一帧, 拿不到 webgl2 时走兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Radar, radarUniforms } from "@src/surface/backgrounds/glyph/Radar";
import { RADAR, RADAR_FRAGMENT, RADAR_MODES, radarSquash } from "@src/surface/backgrounds/glyph/radar-shader";
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

const knobs = {
  mode: "pulse", trail: 0.35, scale: 0.9, ringCount: 0, spokeCount: 12, ticks: true, targets: 40, clutter: 0.35, glow: 1, brightness: 1, gridOpacity: 1,
  lineWidth: 1, tilt: 60, centerX: 0.5, centerY: 0.25, intro: true, grain: 0.03, fade: 0,
} as const;

describe("Radar 纯函数", () => {
  it("规格常数与模式表", () => {
    expect([RADAR.maxTargets, RADAR.history, RADAR.introSeconds]).toEqual([16, 4, 2.2]);
    expect(RADAR_MODES).toEqual({ sweep: 0, pulse: 1 });
    expect(RADAR_FRAGMENT).toContain("u_squash");
  });
  it("俯仰压缩 cos(tilt), 钳在 0..70 度", () => {
    expect(radarSquash(0)).toBe(1);
    expect(radarSquash(60)).toBeCloseTo(0.5, 9);
    expect(radarSquash(90)).toBeCloseTo(Math.cos((70 * Math.PI) / 180), 9);
  });
  it("uniform: 模式, 目标上限, 环数下限, 圆心 y 翻转, 入场", () => {
    const u = radarUniforms({ colors: [], elapsed: 1.1 }, knobs, false, true);
    expect([u.u_mode, u.u_targets, u.u_rings, u.u_opaque, u.u_lock]).toEqual([1, 16, 1, 0, 1]);
    expect(u.u_center).toEqual([0.5, 0.75]);
    expect(u.u_intro).toBeCloseTo(0.5, 6);
    expect(radarUniforms({ colors: [], elapsed: Number.POSITIVE_INFINITY }, knobs, true, false).u_intro).toBe(1);
  });
});

describe("Radar 渲染", () => {
  it("WebGL 可用时 live 并出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { container } = render(<Radar>x</Radar>);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    act(() => vi.advanceTimersByTime(100));
    expect(calls).toContain("drawArrays");
  });
  it("减弱动效: 只画静态帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(true));
    const { container } = render(<Radar />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
  });
  it("拿不到 webgl2 时退到兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<Radar backgroundColor="card" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
  });
});
