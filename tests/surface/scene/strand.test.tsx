/**
 * scene 族: FiberStrands (Strands). 偏弯, 脉冲, 能量, 入场, 着色器接线, 渲染, 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FiberStrands, STRAND, makeStrands, stepStrands, strandEnergy, strandIntro, strandPulse } from "@src/surface/scene";
import { STRAND_FRAGMENT } from "@src/surface/scene/parts/strand-shader";
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

describe("FiberStrands 模拟", () => {
  it("规格常数", () => {
    expect(STRAND).toMatchObject({ maxColors: 8, cover: 2.6, coreGain: 0.92, edge: 0.04, body: 0.051, chroma: 0.02, gain: 2.4, count: 3, energy: 0.65 });
    expect(STRAND.erf[0]).toBe(0.3275911);
  });
  it("偏弯跟着指针, 离开回 0; 脉冲随时间衰减; 能量叠电平并钳", () => {
    const s = makeStrands();
    for (let i = 0; i < 120; i += 1) stepStrands(s, 1 / 60, { x: 0.3, y: 0.2 });
    expect(s.lx).toBeCloseTo(0.3, 2);
    expect(s.ly).toBeCloseTo(0.2, 2);
    for (let i = 0; i < 240; i += 1) stepStrands(s, 1 / 60, null);
    expect(Math.abs(s.ly)).toBeLessThan(1e-3);
    expect(strandPulse([{ at: 1 }], 1)).toBeCloseTo(1 + STRAND.pulseGain);
    expect(strandPulse([{ at: 1 }], 3)).toBeLessThan(1.01);
    expect(strandPulse([], 3)).toBe(1);
    expect(strandEnergy(0.65, undefined)).toBe(0.65);
    expect(strandEnergy(1, 1)).toBe(1.5);
    expect(strandIntro(0)).toBe(0);
    expect(strandIntro(10)).toBe(1);
  });
  it("着色器接线", () => {
    expect(STRAND_FRAGMENT).toContain("uniform vec3 u_colors[8];");
    expect(STRAND_FRAGMENT).toContain("1.0 - exp(-lum * 2.6)");
    expect(STRAND_FRAGMENT).toContain("smoothstep(0.05, 2.2, lum) * 0.92");
    expect(STRAND_FRAGMENT).toContain("smoothstep(0.8, 1.0, rho)");
    for (const role of ["u_role_core", "u_role_rim", "u_role_key", "u_role_shadow"]) expect(STRAND_FRAGMENT).toContain(`uniform vec3 ${role};`);
    expect(STRAND_FRAGMENT).toContain("roleColor(fi, 0.0) * vf + roleColor(fi, 1.0) * ve + roleColor(fi, 2.0) * halo");
  });
});

describe("FiberStrands 渲染", () => {
  it("每帧一遍上屏; 减弱动效只画一帧; 没有 WebGL2 时退到兜底", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container, unmount } = render(<FiberStrands count={5} colors={["primary", "accent"]} />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(160));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before + 3);
    unmount();
    const still: string[] = [];
    restore.push(mockWebgl2(still));
    const { container: c2, unmount: u2 } = render(<FiberStrands reducedMotion glass={false} />);
    expect((c2.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    u2();
    restore.push(recordCanvas2d([]));
    const { container: c3 } = render(<FiberStrands />);
    const h3 = c3.firstElementChild as HTMLElement;
    expect(h3.dataset.backdropStatus).toBe("fallback");
    expect(h3.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
