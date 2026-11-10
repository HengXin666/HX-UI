/**
 * field 族: SparkMark (ElectricLogo). 形变, 脉冲, 光标弹簧, 着色器接线, 渲染与兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SPARK_MARK, SPARK_BOLT, SparkMark, makeSpark, packPulses, startMorph, stepSpark } from "@src/surface/field";
import { SPARK_FRAGMENT } from "@src/surface/field/parts/spark-shader";
import { mockIntersection, mockReducedMotion, mockWebgl2, useFakeClock } from "../backdrop/helpers";
import { recordCanvas2d } from "../helpers";

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
const away = { x: 0.5, y: 0.5, inside: false };

describe("SparkMark 状态", () => {
  it("规格常数", () => {
    expect(SPARK_MARK).toMatchObject({ raster: 560, cell: 4, far: 1e20, arcs: 5, pulses: 3, pixelBudget: 4e6, morphS: 1.6, morphPendingS: 0.3, pulseS: 1.4, pulseDecay: 1.7, hoverK: 120, hoverC: 19, powerIn: 0.3, powerOut: 0.55, maxDt: 0.05, breath: 0.6, sparkDip: 0.3 });
    expect(SPARK_BOLT.viewBox).toEqual([24, 24]);
  });
  it("形变 1.6s 走满, 排队中 0.3s; 帧长夹到 0.05", () => {
    const s = makeSpark();
    startMorph(s, false);
    stepSpark(s, 1, 0, false, away);
    expect(s.morph).toBeCloseTo(0.05 / 1.6, 9);
    startMorph(s, true);
    for (let i = 0; i < 6; i += 1) stepSpark(s, 0.05, i * 0.05, false, away);
    expect(s.morph).toBe(1);
  });
  it("脉冲轮流占 3 个槽, 进度 1.4s 走满", () => {
    const s = makeSpark();
    stepSpark(s, 0.05, 0, false, away);
    expect(s.pulses[0].progress).toBe(0);
    for (let i = 1; i <= 21; i += 1) stepSpark(s, 0.05, i * 0.05, false, away);
    expect(s.pulses[0].progress).toBeCloseTo(0.75, 6);
    expect(s.pulses[1].progress).toBeGreaterThan(0);
    expect(packPulses(s)).toHaveLength(12);
  });
  it("光标弹簧跟到指针, 力度在场升离开降", () => {
    const s = makeSpark();
    for (let i = 0; i < 40; i += 1) stepSpark(s, 0.05, i * 0.05, true, { x: 0.2, y: 0.8, inside: true });
    expect(s.hover.x).toBeCloseTo(0.2, 2);
    expect(s.hover.power).toBeGreaterThan(0.95);
    for (let i = 0; i < 80; i += 1) stepSpark(s, 0.05, 2 + i * 0.05, true, away);
    expect(s.hover.power).toBeLessThan(0.05);
  });
  it("着色器接线", () => {
    expect(SPARK_FRAGMENT).toContain("uniform sampler2D u_from;");
    expect(SPARK_FRAGMENT).toContain("uniform sampler2D u_to;");
    expect(SPARK_FRAGMENT).toContain("uniform vec4 u_pulses[3];");
  });
});

describe("SparkMark 渲染", () => {
  it("每帧一遍上屏; 减弱动效只画一帧; 没有 WebGL2 时兜底", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container, unmount } = render(<SparkMark />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(160));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before + 3);
    unmount();
    const still: string[] = [];
    restore.push(mockWebgl2(still));
    const { container: c2, unmount: u2 } = render(<SparkMark reducedMotion />);
    expect((c2.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    u2();
    restore.push(recordCanvas2d([]));
    const { container: c3 } = render(<SparkMark />);
    expect((c3.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("fallback");
  });
});
