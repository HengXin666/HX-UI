/**
 * scene 族: PrismOrb (CrystalizedBall). 预设合并, 悬停, 电弧打包, 着色器接线, 渲染, 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PRISM, PRISM_PRESETS, PrismOrb, makePrism, packPrism, prismEnergy, prismLook, stepPrism } from "@src/surface/scene";
import { PRISM_FRAGMENT } from "@src/surface/scene/parts/prism-shader";
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

describe("PrismOrb 状态", () => {
  it("规格常数; 预设打底, 显式覆盖, 数量钳到上限", () => {
    expect(PRISM).toMatchObject({ motions: { rise: 0, fall: 1, drift: 2, orbit: 3 }, shapes: { square: 0, round: 1 }, maxStrands: 8, maxArcs: 4, maxParticles: 40000, introSeconds: 2.2, settleSeconds: 7, size: 0.7, hoverStrength: 0.7 });
    const look = prismLook("plasma", { strands: 20, particleCount: 1e6, motion: "orbit", crackle: undefined });
    expect(look.strands).toBe(8);
    expect(look.particleCount).toBe(40000);
    expect(look.motion).toBe("orbit");
    expect(look.crackle).toBe(PRISM_PRESETS.plasma.crackle);
  });
  it("悬停: 球内趋近 1 并跟住方向, 离开回落", () => {
    const s = makePrism();
    for (let i = 0; i < 30; i += 1) stepPrism(s, 0.016, { dx: 0, dy: -0.5, inside: true });
    expect(s.power).toBeGreaterThan(0.95);
    expect(s.angle).toBeCloseTo(-Math.PI / 2, 6);
    for (let i = 0; i < 60; i += 1) stepPrism(s, 0.016, { dx: 3, dy: 0, inside: true });
    expect(s.power).toBeLessThan(0.01);
  });
  it("打包: 主干数随 strands, 入场长度由 0 长到 1; 悬停时最近一根被拉到指针方向", () => {
    const s = makePrism();
    const look = prismLook("plasma", { strands: 4 });
    const start = packPrism(s, look, 0, 0, true, 0.7);
    expect(start.strands[1]).toBe(0);
    expect(start.strands[4 * 4 + 3]).toBe(0);
    const done = packPrism(s, look, 0, 5, true, 0.7);
    expect(done.strands[1]).toBe(1);
    s.power = 1;
    s.angle = 0.3;
    const pulled = packPrism(s, look, 0, 5, false, 1);
    const angles = [0, 1, 2, 3].map((i) => pulled.strands[i * 4] ?? 0);
    expect(angles.some((a) => Math.abs(Math.atan2(Math.sin(a - 0.3), Math.cos(a - 0.3))) < 1e-6)).toBe(true);
    expect(pulled.arcs).toHaveLength(16);
  });
  it("挂载后的额外能量按 7 秒回落到 1", () => {
    expect(prismEnergy(0)).toBeCloseTo(1 + PRISM.settleBoost, 6);
    expect(prismEnergy(7)).toBe(1);
  });
  it("着色器接线", () => {
    expect(PRISM_FRAGMENT).toContain("uniform vec4 u_strands[8];");
    expect(PRISM_FRAGMENT).toContain("uniform vec4 u_arcs[4];");
    expect(PRISM_FRAGMENT).toContain("smoothstep(0.955, 0.985, r)");
  });
});

describe("PrismOrb 渲染", () => {
  it("每帧一遍上屏; 减弱动效只画一帧; 没有 WebGL2 时退到光晕兜底", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container, unmount } = render(<PrismOrb preset="storm" particleShape="square" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(160));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before + 3);
    unmount();
    const still: string[] = [];
    restore.push(mockWebgl2(still));
    const { container: c2, unmount: u2 } = render(<PrismOrb reducedMotion />);
    expect((c2.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    u2();
    restore.push(recordCanvas2d([]));
    const { container: c3 } = render(<PrismOrb />);
    const h3 = c3.firstElementChild as HTMLElement;
    expect(h3.dataset.backdropStatus).toBe("fallback");
    expect(h3.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
