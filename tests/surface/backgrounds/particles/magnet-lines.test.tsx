/**
 * MagnetLines: 角弹簧, 模式朝向, 影响衰减, 脉冲环, 入场波与网格的纯函数, Canvas2D 渲染, 兜底与减弱动效静帧.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MagnetLines } from "@src/surface/backgrounds/particles/MagnetLines";
import {
  dampingOf, depthLook, hueTurn, influenceAt, introAt, layoutGrid, MAGNET, makeNeedles, modeAngle, pulseAt, springAngle, stiffnessOf,
} from "@src/surface/backgrounds/particles/magnet-lines-field";
import { mockWebgl2 } from "../../backdrop/helpers";
import { mockReducedMotion, recordCanvas2d, stubRect, useFakeClock } from "../../helpers";

afterEach(() => {
  vi.useRealTimers();
});

describe("MagnetLines 纯函数", () => {
  it("规格常数", () => {
    expect([MAGNET.pulseSpeed, MAGNET.pulseSpin, MAGNET.introSpeed, MAGNET.introTime, MAGNET.introSpin, MAGNET.far]).toEqual([520, 0.34, 700, 1.1, 0.65, 4]);
    expect([MAGNET.followTau, MAGNET.wanderTau, MAGNET.headingTau, MAGNET.velocityTau, MAGNET.substep]).toEqual([0.035, 0.6, 0.25, 0.12, 1 / 240]);
  });

  it("刚度 (6 + 42 (1 - inertia)^2)^2, 惯性 0 或减弱动效直接到位; 阻尼随 bounce 变小", () => {
    expect(stiffnessOf(0.35, false)).toBeCloseTo((6 + 42 * 0.65 ** 2) ** 2, 9);
    expect(stiffnessOf(0, false)).toBe(0);
    expect(stiffnessOf(0.5, true)).toBe(0);
    expect(dampingOf(100, 0)).toBe(20);
    expect(dampingOf(100, 1)).toBeCloseTo(5, 9);
    expect(springAngle(0, 0, 1, 0, 0, 0.016, Math.PI * 2)).toEqual([1, 0]);
    let a = 0;
    let v = 0;
    const k = stiffnessOf(0.35, false);
    for (let i = 0; i < 120; i += 1) [a, v] = springAngle(a, v, 1, k, dampingOf(k, 0.3), 1 / 60, Math.PI * 2);
    expect(a).toBeCloseTo(1, 3);
    expect(springAngle(0, 0, Math.PI - 0.1, 0, 0, 0.016, Math.PI)[0]).toBeCloseTo(-0.1, 9);
  });

  it("模式朝向, 影响衰减, 脉冲环, 入场波, 网格上限", () => {
    expect(modeAngle("point", 1, 0, 0)).toBe(0);
    expect(modeAngle("orbit", 1, 0, 0)).toBeCloseTo(Math.PI / 2, 9);
    expect(modeAngle("repel", 1, 0, 0)).toBeCloseTo(Math.PI, 9);
    expect(modeAngle("flow", 1, 0, 0.7)).toBe(0.7);
    expect(influenceAt(0, 200)).toBe(1);
    expect(influenceAt(80, 200)).toBe(1);
    expect(influenceAt(200, 200)).toBe(0);
    expect(pulseAt(520, 1)).toBeCloseTo(0.5, 9);
    expect(pulseAt(0, 3)).toBe(0);
    expect(introAt(700, 1)).toEqual({ shown: 0, spin: MAGNET.introSpin * Math.PI * 2 });
    expect(introAt(0, Number.POSITIVE_INFINITY)).toEqual({ shown: 1, spin: 0 });
    expect(introAt(0, 5).spin).toBe(0);
    const g = layoutGrid(300, 150, 30);
    expect([g.cols, g.rows, g.dx, g.ox]).toEqual([10, 5, 30, 15]);
    expect(layoutGrid(300, 150, 30, 3, 4).cols).toBe(4);
    const big = layoutGrid(10000, 10000, 4);
    expect(big.cols * big.rows).toBeLessThanOrEqual(MAGNET.maxLines);
    const n = makeNeedles(5, 0.2, 0, 1);
    expect(Array.from(n.angle).every((x) => Math.abs(x - 0.2) < 1e-6)).toBe(true);
    expect(hueTurn([0.5, 0.5, 0.5], 1).map((x) => Number(x.toFixed(4)))).toEqual([0.5, 0.5, 0.5]);
  });
});

describe("MagnetLines 深度透视", () => {
  it("近层原样, 远层按 1 / (1 + amount) 缩放, 透明度为缩放的 1.5 次方, 视差近正远负; amount 0 为平面", () => {
    const near = depthLook(0, 4, 0.6);
    const far = depthLook(3, 4, 0.6);
    expect(near.scale).toBe(1);
    expect(far.scale).toBeCloseTo(1 / 1.6, 9);
    expect(far.alpha).toBeCloseTo((1 / 1.6) ** 1.5, 9);
    expect(near.shift).toBeGreaterThan(0);
    expect(far.shift).toBeLessThan(0);
    expect(depthLook(2, 4, 0)).toEqual({ scale: 1, alpha: 1, shift: 0 });
    expect(depthLook(3, 4, 5).scale).toBeCloseTo(0.5, 9);
    expect(depthLook(0, 1, 0.6).scale).toBe(1);
  });

  it("每根线落在一层, order 是由远到近的分桶排列且覆盖全部线, 同种子可复现", () => {
    const n = makeNeedles(500, 0, 0.3, 7);
    const again = makeNeedles(500, 0, 0.3, 7);
    expect(Array.from(n.layer)).toEqual(Array.from(again.layer));
    expect(new Set(n.layer).size).toBe(MAGNET.depthLayers);
    expect([...n.order].sort((a, b) => a - b)).toEqual(Array.from({ length: 500 }, (_, i) => i));
    const seq = Array.from(n.order, (i) => n.layer[i]);
    expect(seq.every((l, j) => j === 0 || l <= seq[j - 1])).toBe(true);
    expect(seq[0]).toBe(MAGNET.depthLayers - 1);
    expect(Array.from(makeNeedles(20, 0, 0, 1, 1).layer).every((l) => l === 0)).toBe(true);
  });
});

describe("MagnetLines 渲染", () => {
  it("Canvas2D 可用时 live 并持续出帧, 指针与点击不报错", () => {
    useFakeClock();
    const calls: string[] = [];
    const restore = recordCanvas2d(calls);
    const { container } = render(<MagnetLines shape="arrow" depth={0.8} />);
    const host = container.firstElementChild as HTMLElement;
    stubRect(host, { left: 0, top: 0, width: 200, height: 120 });
    expect(host.dataset.backdropStatus).toBe("live");
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerMove(host, { clientX: 60, clientY: 40 });
    fireEvent.pointerDown(host, { clientX: 60, clientY: 40 });
    calls.length = 0;
    act(() => vi.advanceTimersByTime(100));
    expect(calls.filter((c) => c === "clearRect").length).toBeGreaterThan(1);
    restore();
  });

  it("拿不到 2d 上下文时走 CSS 兜底", () => {
    const restore = mockWebgl2([]);
    const { container } = render(<MagnetLines />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    restore();
  });

  it("减弱动效: 只画一帧", () => {
    useFakeClock();
    const calls: string[] = [];
    const restore = recordCanvas2d(calls);
    const restoreMotion = mockReducedMotion(true);
    const { container } = render(<MagnetLines shape="needle" rainbow />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    expect(calls).toContain("clearRect");
    const before = calls.length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.length).toBe(before);
    restoreMotion();
    restore();
  });
});
