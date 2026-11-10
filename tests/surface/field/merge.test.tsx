/**
 * field 族: MergeBlobs (MetaBalls). 模拟纯函数, 着色器接线, 渲染与兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MERGE, MergeBlobs, makeMerge, mergeEase, mergeLook, packMerge, pairForce, settleMerge, stepMerge } from "@src/surface/field";
import { MERGE_FRAGMENT } from "@src/surface/field/parts/merge-shader";
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

const tuning = { speed: 0.3, motion: "orbit" as const, animationSize: 30, clumpFactor: 1, stickiness: 0.5, hoverSmoothness: 0.1, cursorBallSize: 3, interactive: true, clickBurst: true, intro: false };
const away = { x: 100, y: 100, inside: false };

describe("MergeBlobs 模拟", () => {
  it("规格常数与公式", () => {
    expect(MERGE).toMatchObject({ maxBalls: 50, visible: 0.877, repel: 60, cursorRepel: 140, introS: 1.15, ballCount: 15, animationSize: 30, cursorBallSize: 3 });
    const look = mergeLook(1);
    expect(look.threshold).toBeCloseTo(1.3 ** 0.6, 9);
    expect(look.reach).toBeCloseTo(2 ** (0.5 / 0.6), 9);
    expect(Math.SQRT1_2 * 0 + 1 / Math.sqrt(1.3)).toBeCloseTo(MERGE.visible, 3);
    expect(mergeEase(0.5)).toBe(0.5);
    expect(pairForce(0.5, 1, 1, 15)).toBeCloseTo(-60 * (1.2 - 0.5), 9);
    expect(pairForce(10, 1, 1, 15)).toBe(0);
    expect(pairForce(2.5, 1, 1, 15)).toBeGreaterThan(0);
  });
  it("球回到轨道; 点击冲开; 光标在场时打包出光标球", () => {
    const s = makeMerge(6);
    expect(s.balls).toHaveLength(6);
    for (let i = 0; i < 600; i += 1) stepMerge(s, 1 / 60, i / 60, i / 60, tuning, away, []);
    const spread = Math.max(...s.balls.map((b) => Math.hypot(b.x, b.y)));
    expect(spread).toBeGreaterThan(1);
    expect(spread).toBeLessThan(20);
    const b = s.balls[0];
    const before = Math.hypot(b.vx, b.vy);
    stepMerge(s, 1 / 60, 10, 10, tuning, away, [{ x: b.x + 1, y: b.y, at: 9.9 }]);
    expect(Math.hypot(b.vx, b.vy)).toBeGreaterThan(before + 5);
    for (let i = 0; i < 60; i += 1) stepMerge(s, 1 / 60, 11, 11, tuning, { x: 0, y: 0, inside: true }, []);
    const p = packMerge(s, { cursorBallSize: 3, stretch: 0.5, wobble: 0 }, 0);
    expect(p.count).toBe(7);
    expect(p.balls[6 * 4 + 2]).toBeGreaterThan(2.5);
    expect(p.balls[6 * 4 + 3]).toBe(1);
  });
  it("入场时球从中心慢慢放出; 静态帧直接落到轨道起点", () => {
    const s = makeMerge(4);
    stepMerge(s, 1 / 60, 0, 0.05, { ...tuning, intro: true }, away, []);
    expect(s.balls.every((b) => b.x === 0 && b.y === 0)).toBe(true);
    settleMerge(s, 0, { ...tuning, motion: "still" });
    expect(Math.hypot(s.balls[0].x, s.balls[0].y)).toBeGreaterThan(0);
  });
  it("着色器接线", () => {
    expect(MERGE_FRAGMENT).toContain("uniform vec4 u_balls[50];");
    expect(MERGE_FRAGMENT).toContain("fwidth(field)");
  });
});

describe("MergeBlobs 渲染", () => {
  it("每帧一遍上屏; 减弱动效只画一帧; 没有 WebGL2 时兜底", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container, unmount } = render(<MergeBlobs variant="contour" />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(160));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before + 3);
    unmount();
    const still: string[] = [];
    restore.push(mockWebgl2(still));
    const { container: c2, unmount: u2 } = render(<MergeBlobs reducedMotion />);
    expect((c2.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    u2();
    restore.push(recordCanvas2d([]));
    const { container: c3 } = render(<MergeBlobs />);
    expect((c3.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("fallback");
  });
});
