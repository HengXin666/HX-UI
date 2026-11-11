/**
 * scene 族: CubeField (Cubes). 倾角弹簧, 涟漪, 入场, 着色器接线, 渲染, 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CUBE, CubeField, cubeCenter, cubeGrid, cubeIntro, makeCubes, packCubes, stepCubes } from "@src/surface/scene";
import { CUBE_FRAGMENT } from "@src/surface/scene/parts/cube-shader";
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

const tuning = { maxAngle: 45, radius: 3, speed: 1, bounce: 0.4, brush: 1, autoAnimate: false, rippleOnClick: true, rippleSpeed: 1 };

describe("CubeField 模拟", () => {
  it("规格常数; 格数钳到 64; 中心坐标", () => {
    expect(CUBE).toMatchObject({ styles: { solid: 0, dashed: 1, dotted: 2, none: 3 }, introSeconds: 1.1, follow: 18, velocityBlend: 10, attack: 6, release: 2.5, stiffness: 160, bounceDamp: 0.82, glowFade: 3.2, sweepGain: 4, gridSize: 10, gap: 0.18, maxAngle: 45, radius: 3, bounce: 0.4 });
    expect(cubeGrid(40)).toBe(40);
    expect(cubeGrid(200)).toBe(64);
    expect(cubeCenter(3, 0)).toEqual({ x: -1, y: 1 });
    expect(cubeCenter(3, 8)).toEqual({ x: 1, y: -1 });
  });
  it("光标旁的方块倾过去并稳在 maxAngle 以内, 远处不动; 离开后回平", () => {
    const s = makeCubes(5);
    for (let i = 0; i < 120; i += 1) stepCubes(s, 1 / 60, i / 60, { pointer: { x: 1.5, y: 0 }, taps: [] }, tuning);
    const near = 2 * 5 + 3;
    expect(Math.abs(s.ay[near] ?? 0)).toBeGreaterThan(5);
    expect(Math.abs(s.ay[near] ?? 0)).toBeLessThanOrEqual(45);
    expect(Math.abs(s.ay[0] ?? 0)).toBeLessThan(1);
    for (let i = 0; i < 300; i += 1) stepCubes(s, 1 / 60, 2 + i / 60, { pointer: null, taps: [] }, tuning);
    expect(Math.abs(s.ay[near] ?? 0)).toBeLessThan(0.5);
  });
  it("点击涟漪按格外扩, 扫到的方块发亮; 关掉 rippleOnClick 不发", () => {
    const s = makeCubes(5);
    stepCubes(s, 1 / 60, 0, { pointer: null, taps: [{ x: 0, y: 0, at: 0 }] }, tuning);
    for (let i = 1; i < 40; i += 1) stepCubes(s, 1 / 60, i / 60, { pointer: null, taps: [{ x: 0, y: 0, at: 0 }] }, tuning);
    expect(Math.max(...Array.from(s.glow))).toBeGreaterThan(0.3);
    const off = makeCubes(5);
    for (let i = 0; i < 40; i += 1) stepCubes(off, 1 / 60, i / 60, { pointer: null, taps: [{ x: 0, y: 0, at: 0 }] }, { ...tuning, rippleOnClick: false });
    expect(Math.max(...Array.from(off.glow))).toBe(0);
  });
  it("入场由中心向外; 打包成 2n x n 的 RGBA8, 倾角 16 位往返", () => {
    expect(cubeIntro(0, 0, 0, 10)).toBe(0);
    expect(cubeIntro(0.5, 0, 0, 10)).toBeGreaterThan(cubeIntro(0.5, 4, 4, 10));
    expect(cubeIntro(5, 4, 4, 10)).toBe(1);
    const s = makeCubes(4);
    s.ax[5] = 30;
    s.ay[5] = -12.5;
    s.glow[5] = 0.5;
    const p = packCubes(s, false);
    expect(p).toHaveLength(4 * 2 * 4 * 4);
    const at = (1 * 4 * 2 + 1 * 2) * 4;
    const dec = (h: number, l: number) => ((h * 256 + l) / 65535 * 2 - 1) * 180;
    expect(dec(p[at] ?? 0, p[at + 1] ?? 0)).toBeCloseTo(30, 2);
    expect(dec(p[at + 2] ?? 0, p[at + 4] ?? 0)).toBeCloseTo(-12.5, 2);
    expect(p[at + 5]).toBe(128);
    expect(p[at + 6]).toBe(255);
    expect(p[at + 3]).toBe(255);
    expect(p[at + 7]).toBe(255);
  });
  it("着色器接线", () => {
    expect(CUBE_FRAGMENT).toContain("uniform sampler2D u_cube_tex;");
    expect(CUBE_FRAGMENT).toContain("ivec2(int(g.x) * 2, int(g.y))");
    expect(CUBE_FRAGMENT).toContain("smoothstep(0.06, 0.28, abs(nw.z))");
  });
});

describe("CubeField 渲染", () => {
  it("每帧一遍上屏; 减弱动效只画一帧; 没有 WebGL2 时退到兜底", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container, unmount } = render(<CubeField edgeStyle="dashed" perspective={0.4} />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(160));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before + 3);
    unmount();
    const still: string[] = [];
    restore.push(mockWebgl2(still));
    const { container: c2, unmount: u2 } = render(<CubeField reducedMotion />);
    expect((c2.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    u2();
    restore.push(recordCanvas2d([]));
    const { container: c3 } = render(<CubeField />);
    const h3 = c3.firstElementChild as HTMLElement;
    expect(h3.dataset.backdropStatus).toBe("fallback");
    expect(h3.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
