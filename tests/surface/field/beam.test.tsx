/**
 * field 族: BeamFlow (LaserFlow). 入场与横移, 着色器接线, 渲染与兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BEAM, BeamFlow, beamIntro, makeBeam, stepBeam } from "@src/surface/field";
import { BEAM_FRAGMENT } from "@src/surface/field/parts/beam-shader";
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

describe("BeamFlow 纯函数", () => {
  it("规格常数与默认值", () => {
    expect(BEAM).toMatchObject({ streakBase: 0.88, streakAmp: 0.24, spreadPx: 250, hug: 14, hugWide: 40, beamPosition: 0.6, intensity: 1.8, beamWidth: 1.5, flare: 1.5, spread: 1.5, spill: 1, fog: 0.2, dust: 1.6, streaks: 1.5, dots: 1, pulse: 1.5, speed: 1.5, seed: 3, revealRadius: 220, revealOpacity: 0.6 });
  });
  it("先落下再铺开; 关掉入场时直接完成", () => {
    expect(beamIntro(0)).toEqual({ drop: 0, flow: 0 });
    expect(beamIntro(BEAM.dropS).drop).toBe(1);
    expect(beamIntro(BEAM.dropS).flow).toBe(0);
    expect(beamIntro(BEAM.dropS + BEAM.flowS)).toEqual({ drop: 1, flow: 1 });
    expect(beamIntro(makeBeam(false).age).flow).toBe(1);
  });
  it("光柱随指针横移, 不超过 12%; 不互动时回原位", () => {
    const s = makeBeam(false);
    let x = 0;
    for (let i = 0; i < 200; i += 1) x = stepBeam(s, 1 / 60, 0.6, { x: 0, inside: true }, true);
    expect(x).toBeCloseTo(0.6 - BEAM.sway, 3);
    for (let i = 0; i < 200; i += 1) x = stepBeam(s, 1 / 60, 0.6, { x: 0, inside: true }, false);
    expect(x).toBeCloseTo(0.6, 3);
  });
  it("着色器接线", () => {
    expect(BEAM_FRAGMENT).toContain("uniform vec3 u_colors[3];");
    expect(BEAM_FRAGMENT).toContain("uniform sampler2D u_image;");
  });
});

describe("BeamFlow 渲染", () => {
  it("每帧一遍上屏; 减弱动效只画一帧; 没有 WebGL2 时兜底", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container, unmount } = render(<BeamFlow />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(160));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before + 3);
    unmount();
    const still: string[] = [];
    restore.push(mockWebgl2(still));
    const { container: c2, unmount: u2 } = render(<BeamFlow reducedMotion />);
    expect((c2.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    u2();
    restore.push(recordCanvas2d([]));
    const { container: c3 } = render(<BeamFlow />);
    expect((c3.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("fallback");
  });
});
