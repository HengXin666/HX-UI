/**
 * Antigravity: 群体生成, 环半径, 阻尼弹簧与蓄力的纯函数, Canvas2D 渲染, 兜底与减弱动效静帧.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Antigravity } from "@src/surface/backgrounds/particles/Antigravity";
import { ANTIGRAVITY, makeSwarm, omegaOf, ringAt, springStep, stepCharge } from "@src/surface/backgrounds/particles/antigravity-field";
import { mockWebgl2 } from "../../backdrop/helpers";
import { mockReducedMotion, recordCanvas2d, stubRect, useFakeClock } from "../../helpers";

afterEach(() => {
  vi.useRealTimers();
});

describe("Antigravity 纯函数", () => {
  it("规格常数", () => {
    expect([ANTIGRAVITY.worldHeight, ANTIGRAVITY.dampingRatio, ANTIGRAVITY.maxSubsteps, ANTIGRAVITY.chargeRise, ANTIGRAVITY.chargeFall]).toEqual([31.5, 1.64, 4, 0.9, 4]);
    expect([ANTIGRAVITY.cursorStiffness, ANTIGRAVITY.cursorDamping, ANTIGRAVITY.depthScale, ANTIGRAVITY.depthFog, ANTIGRAVITY.pulseDepth]).toEqual([49, 14, 0.32, 0.35, 0.22]);
  });

  it("入场时粒子沉在家位置下方 0.45..0.85 个画布高, 关掉入场就在家", () => {
    const s = makeSwarm(20, 50, 30, 1, true);
    for (let i = 0; i < s.count; i += 1) {
      const drop = (s.y[i] - s.hy[i]) / 30;
      expect(drop).toBeGreaterThanOrEqual(0.45 - 1e-6);
      expect(drop).toBeLessThanOrEqual(0.85 + 1e-6);
    }
    const still = makeSwarm(20, 50, 30, 1, false);
    expect(Array.from(still.y)).toEqual(Array.from(still.hy));
    expect(makeSwarm(1e6, 1, 1, 1, false).count).toBe(ANTIGRAVITY.maxCount);
  });

  it("环半径围绕 ringRadius 起伏, 弹簧收敛到目标, 蓄力升降", () => {
    expect(ringAt(0, 0, 7, 1, 3, 0.4, 0)).toBeCloseTo(7, 9);
    expect(ringAt(Math.PI / 6, 0, 7, 1, 3, 0.4, 0)).toBeCloseTo(8, 9);
    let x = 0;
    let v = 0;
    for (let i = 0; i < 200; i += 1) [x, v] = springStep(x, v, 10, omegaOf(0.05), 1 / 60);
    expect(x).toBeCloseTo(10, 2);
    expect(springStep(1, 2, 5, 0, 0.1)).toEqual([1, 2]);
    expect(stepCharge(0, true, 0.45)).toBeCloseTo(0.5, 9);
    expect(stepCharge(0.5, false, 0.1)).toBeCloseTo(0.1, 9);
  });
});

describe("Antigravity 渲染", () => {
  it("Canvas2D 可用时 live 并持续出帧, 指针按下不报错", () => {
    useFakeClock();
    const calls: string[] = [];
    const restore = recordCanvas2d(calls);
    const { container } = render(<Antigravity count={300} particleShape="box" />);
    const host = container.firstElementChild as HTMLElement;
    stubRect(host, { left: 0, top: 0, width: 200, height: 120 });
    expect(host.dataset.backdropStatus).toBe("live");
    act(() => vi.advanceTimersByTime(3000));
    fireEvent.pointerMove(host, { clientX: 60, clientY: 40 });
    fireEvent.pointerDown(host, { clientX: 60, clientY: 40 });
    calls.length = 0;
    act(() => vi.advanceTimersByTime(100));
    expect(calls).toContain("clearRect");
    expect(calls.length).toBeGreaterThan(5);
    restore();
  });

  it("拿不到 2d 上下文时走 CSS 兜底", () => {
    const restore = mockWebgl2([]);
    const { container } = render(<Antigravity count={300} particleShape="box" />);
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
    const { container } = render(<Antigravity count={300} particleShape="box" />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    expect(calls).toContain("clearRect");
    const before = calls.length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.length).toBe(before);
    restoreMotion();
    restore();
  });
});
