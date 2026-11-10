/**
 * field 族: RippleLens (RippleDistortion). 波队列, 着色器接线, 渲染, 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LENS, RippleLens, lensLife, lensRadius, makeLens, packLens, stepLens } from "@src/surface/field";
import { LENS_FRAGMENT } from "@src/surface/field/parts/lens-shader";
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

const tuning = { trigger: "both" as const, spacing: 15, clickStrength: 2, fade: 3, enabled: true };

describe("RippleLens 波队列", () => {
  it("规格常数与公式", () => {
    expect(LENS).toMatchObject({ maxWaves: 100, quality: { low: 0.4, medium: 0.7, high: 1 }, startScale: 1.5, edge: 0.006737947, brushSize: 150, strength: 0.2, swirl: 1, rings: 4, spread: 5, fade: 3, spacing: 15, clickStrength: 2 });
    expect(lensLife(3)).toBeCloseTo(5 / 3, 4);
    expect(lensRadius(0, 150, 5)).toBe(50);
  });
  it("每走 15px 放一个波, 点击放 2 倍波, 过期出队, 关掉后不放", () => {
    const s = makeLens();
    stepLens(s, 0, tuning, { x: 0, y: 0, inside: true }, []);
    stepLens(s, 0.1, tuning, { x: 46, y: 0, inside: true }, []);
    expect(s.waves).toHaveLength(3);
    stepLens(s, 0.2, tuning, { x: 46, y: 0, inside: true }, [{ x: 10, y: 10, at: 0.15 }]);
    expect(s.waves.at(-1)?.strength).toBe(2);
    stepLens(s, 0.2, tuning, { x: 46, y: 0, inside: true }, [{ x: 10, y: 10, at: 0.15 }]);
    expect(s.waves).toHaveLength(4);
    stepLens(s, 3, tuning, { x: 46, y: 0, inside: false }, []);
    expect(s.waves).toHaveLength(0);
    stepLens(s, 3.1, { ...tuning, enabled: false }, { x: 400, y: 0, inside: true }, [{ x: 0, y: 0, at: 3 }]);
    expect(s.waves).toHaveLength(0);
  });
  it("打包按设备像素, 振幅随年龄衰减; 队列上限 100", () => {
    const s = makeLens();
    s.waves.push({ x: 10, y: 20, born: 0, strength: 1 });
    const p = packLens(s, 1, { brushSize: 150, spread: 5, fade: 3 }, 2);
    expect(Array.from(p.list.slice(0, 2))).toEqual([20, 40]);
    expect(p.list[3]).toBeCloseTo(Math.exp(-3), 6);
    for (let i = 0; i < 160; i += 1) s.waves.push({ x: 0, y: 0, born: 0.5, strength: 1 });
    stepLens(s, 0.6, tuning, { x: 0, y: 0, inside: false }, []);
    expect(s.waves).toHaveLength(100);
  });
  it("着色器接线", () => {
    expect(LENS_FRAGMENT).toContain("uniform vec4 u_waves[100];");
    expect(LENS_FRAGMENT).toContain("coverUv");
  });
});

describe("RippleLens 渲染", () => {
  it("每帧一遍上屏, 带 alt 时是 img; 减弱动效只画一帧; 没有 WebGL2 时铺图片兜底", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container, unmount } = render(<RippleLens src="/a.jpg" alt="海" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    expect(host.getAttribute("role")).toBe("img");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(160));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before + 3);
    unmount();
    const still: string[] = [];
    restore.push(mockWebgl2(still));
    const { container: c2, unmount: u2 } = render(<RippleLens src="/a.jpg" reducedMotion />);
    expect((c2.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    u2();
    restore.push(recordCanvas2d([]));
    const { container: c3 } = render(<RippleLens src="/a.jpg" />);
    const h3 = c3.firstElementChild as HTMLElement;
    expect(h3.dataset.backdropStatus).toBe("fallback");
    expect(h3.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("a.jpg");
  });
});
