/**
 * scene 族: SpringMesh (ElasticMesh). 入场弹簧, 抓取拉伸与回弹, 凹陷钳制, 着色器接线, 渲染, 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MESH, SpringMesh, makeMesh, meshSpring, springStep, stepMesh } from "@src/surface/scene";
import { MESH_FRAGMENT } from "@src/surface/scene/parts/mesh-shader";
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
  vi.restoreAllMocks();
});

const tuning = { stiffness: 0.5, wobble: 0.6, stretch: 0.5, press: 0.5 };
const run = (s: ReturnType<typeof makeMesh>, frames: number, p: { x: number; y: number; down: boolean; within: boolean }) => {
  for (let i = 0; i < frames; i += 1) stepMesh(s, 1 / 60, p, tuning);
};

describe("SpringMesh 模拟", () => {
  it("规格常数; 入场阶跃过冲后落到 1", () => {
    expect(MESH).toMatchObject({ materials: { balloon: 0, chrome: 1, jelly: 2, clay: 3 }, omega: 15, zeta: 0.38, firmBase: 0.4, firmGain: 1.2, dentMin: -0.6, dentMax: 0.85, fontWeight: 900, grabRadius: 70 });
    expect(springStep(0)).toBe(0);
    const peak = Math.max(...Array.from({ length: 60 }, (_, i) => springStep(i / 120)));
    expect(peak).toBeGreaterThan(1.05);
    expect(springStep(3)).toBeCloseTo(1, 3);
    expect(meshSpring(tuning).omega).toBeCloseTo(15 * (0.4 + 0.5 * 1.2));
  });
  it("按在形状里拖动会拉伸 (钳到上限), 松手回弹过冲后归零", () => {
    const s = makeMesh();
    run(s, 2, { x: 0, y: 0, down: true, within: true });
    run(s, 10, { x: 2, y: 0, down: true, within: true });
    expect(s.dx).toBeCloseTo(0.5 * MESH.maxStretch * 2, 5);
    let minX = s.dx;
    for (let i = 0; i < 240; i += 1) {
      stepMesh(s, 1 / 60, { x: 2, y: 0, down: false, within: false }, tuning);
      minX = Math.min(minX, s.dx);
    }
    expect(minX).toBeLessThan(0);
    expect(Math.abs(s.dx)).toBeLessThan(1e-3);
  });
  it("按在形状外不抓; 按住时凹陷, 钳在 [-0.6, 0.85]", () => {
    const s = makeMesh();
    run(s, 10, { x: 3, y: 0, down: true, within: false });
    expect(s.grabbing).toBe(false);
    const p = makeMesh();
    run(p, 60, { x: 0, y: 0, down: true, within: true });
    expect(p.dent).toBeGreaterThan(0.3);
    for (let i = 0; i < 120; i += 1) {
      stepMesh(p, 1 / 60, { x: 0, y: 0, down: false, within: true }, { ...tuning, press: 5 });
      expect(p.dent).toBeGreaterThanOrEqual(-0.6);
      expect(p.dent).toBeLessThanOrEqual(0.85);
    }
  });
  it("着色器接线", () => {
    expect(MESH_FRAGMENT).toContain("uniform sampler2D u_shape;");
    expect(MESH_FRAGMENT).toContain("mix(0.55, 1.0, smoothstep(0.0, 12.0, -d))");
    expect(MESH_FRAGMENT).toContain("0.045 + 0.955 * fresnel");
    expect(MESH_FRAGMENT).toContain("smoothstep(0.0, 0.18, pop)");
  });
});

describe("SpringMesh 渲染", () => {
  it("每帧一遍上屏; 减弱动效只画一帧; 没有 WebGL2 时退到兜底", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container, unmount } = render(<SpringMesh material="chrome" src="shape.png" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(160));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before + 3);
    unmount();
    const still: string[] = [];
    restore.push(mockWebgl2(still));
    const { container: c2, unmount: u2 } = render(<SpringMesh src="shape.png" reducedMotion />);
    expect((c2.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    u2();
    restore.push(recordCanvas2d([]));
    const { container: c3 } = render(<SpringMesh src="shape.png" />);
    const h3 = c3.firstElementChild as HTMLElement;
    expect(h3.dataset.backdropStatus).toBe("fallback");
    expect(h3.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});

describe("SpringMesh 文字形状", () => {
  it("没有 src 时把文字栅格化成距离场 (2d 上下文不可用时不崩)", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container } = render(<SpringMesh text="Hi" reducedMotion />);
    expect(container.firstElementChild).not.toBeNull();
  });
});
