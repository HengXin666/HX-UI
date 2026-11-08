/**
 * Ballpit: 视野, 撒球, 子步物理 (重力落底, 碰撞分开, 光标推开, 抓取) 的纯函数, Canvas2D 渲染, 兜底与减弱动效静帧.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Ballpit } from "@src/surface/backgrounds/particles/Ballpit";
import { BALLPIT, ballpitView, burstAt, depthScale, makeBalls, makeCursor, pickBall, stepBalls } from "@src/surface/backgrounds/particles/ballpit-field";
import { mockWebgl2 } from "../../backdrop/helpers";
import { mockReducedMotion, recordCanvas2d, stubRect, useFakeClock } from "../../helpers";

afterEach(() => {
  vi.useRealTimers();
});

const PARAMS = { gravity: 0.5, friction: 0.9975, wallBounce: 0.95, bounce: 0.85, depth: 2, drift: 0 };

describe("Ballpit 纯函数", () => {
  it("规格常数", () => {
    expect([BALLPIT.fov, BALLPIT.cameraZ, BALLPIT.maxAspect, BALLPIT.maxSpeed, BALLPIT.slop, BALLPIT.dtCap]).toEqual([50, 20, 1.5, 16, 0.01, 1 / 20]);
    expect([BALLPIT.holdTau, BALLPIT.holdVelocityTau, BALLPIT.cursorRadiusTau, BALLPIT.cursorFollowTau, BALLPIT.glideDamp]).toEqual([0.02, 0.05, 0.12, 0.06, 2.2]);
  });

  it("视野: z=0 平面铺满画布, 宽屏时半宽封顶", () => {
    const sq = ballpitView(1);
    expect(sq.hh).toBeCloseTo(20 * Math.tan((25 * Math.PI) / 180), 6);
    expect(sq.camZ).toBeCloseTo(20, 6);
    const wide = ballpitView(3);
    expect(wide.hw).toBeCloseTo(sq.hh * 1.5, 6);
    expect(wide.hw / wide.hh).toBeCloseTo(3, 6);
    expect(depthScale(sq, 0)).toBe(1);
    expect(depthScale(sq, 2)).toBeGreaterThan(1);
  });

  it("入场时球在盒顶之上, 重力让它们落进盒子并停在盒内", () => {
    const view = ballpitView(1);
    const w = makeBalls(30, view, 0.5, 1, 2, 3, true);
    for (let i = 0; i < w.count; i += 1) expect(w.y[i] - w.r[i]).toBeGreaterThan(view.hh - 1e-6);
    const cursor = makeCursor();
    for (let t = 0; t < 6; t += 1 / 60) stepBalls(w, view, PARAMS, cursor, 1 / 60, t, [0, 0]);
    for (let i = 0; i < w.count; i += 1) {
      expect(w.entered[i]).toBe(1);
      expect(w.y[i] - w.r[i]).toBeGreaterThanOrEqual(-view.hh - 1e-3);
      expect(w.y[i] + w.r[i]).toBeLessThanOrEqual(view.hh + 1e-3);
      expect(Math.abs(w.x[i]) + w.r[i]).toBeLessThanOrEqual(view.hw + 1e-3);
    }
    expect(makeBalls(1e6, view, 0.5, 1, 2, 1, false).count).toBe(BALLPIT.maxCount);
  });

  it("重叠的两球被推开, 光标球把球推出半径, 点中可抓, 爆开给速度", () => {
    const view = ballpitView(1);
    const w = makeBalls(2, view, 1, 1, 0, 1, false);
    [w.x[0], w.y[0], w.x[1], w.y[1]] = [0, 0, 0.5, 0];
    const still = { ...PARAMS, gravity: 0 };
    stepBalls(w, view, still, makeCursor(), 1 / 60, 0, [0, 0]);
    expect(Math.hypot(w.x[1] - w.x[0], w.y[1] - w.y[0])).toBeGreaterThan(2 - 0.05);
    const c = makeCursor();
    c.r = 3;
    [c.x, c.y] = [w.x[0], w.y[0]];
    stepBalls(w, view, still, c, 1 / 60, 0, [0, 0]);
    expect(Math.hypot(w.x[0] - c.x, w.y[0] - c.y)).toBeGreaterThanOrEqual(4 - 0.05);
    expect(pickBall(w, view, w.x[1], w.y[1])).toBe(1);
    expect(pickBall(w, view, 100, 100)).toBe(-1);
    w.vx[1] = 0;
    burstAt(w, w.x[1] - 1, w.y[1]);
    expect(w.vx[1]).toBeGreaterThan(0);
  });
});

describe("Ballpit 渲染", () => {
  it("Canvas2D 可用时 live 并持续出帧, 按下与移动不报错", () => {
    useFakeClock();
    const calls: string[] = [];
    const restore = recordCanvas2d(calls);
    const { container } = render(<Ballpit count={60} />);
    const host = container.firstElementChild as HTMLElement;
    stubRect(host, { left: 0, top: 0, width: 200, height: 120 });
    expect(host.dataset.backdropStatus).toBe("live");
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.pointerMove(host, { clientX: 60, clientY: 40 });
    fireEvent.pointerDown(host, { clientX: 60, clientY: 40 });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.pointerUp(host, { clientX: 80, clientY: 40 });
    calls.length = 0;
    act(() => vi.advanceTimersByTime(100));
    expect(calls).toContain("clearRect");
    expect(calls.filter((c) => c === "clearRect").length).toBeGreaterThan(1);
    restore();
  });

  it("拿不到 2d 上下文时走 CSS 兜底", () => {
    const restore = mockWebgl2([]);
    const { container } = render(<Ballpit count={60} />);
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
    const { container } = render(<Ballpit count={60} material="glossy" />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    expect(calls).toContain("clearRect");
    const before = calls.length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.length).toBe(before);
    restoreMotion();
    restore();
  });
});
