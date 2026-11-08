/**
 * fluid 路 LiquidEther: 留存率, 自动演示与注入的纯函数, 四个离屏通道的调度, 减弱动效只画一帧, 无 WebGL 时兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BackdropFrame } from "@src/surface/backdrop/kernel";
import { createPointerState } from "@src/surface/backdrop/kernel";
import { LiquidEther } from "@src/surface/backgrounds/fluid/LiquidEther";
import { createEtherDrive, etherAutoPath, etherKeep, etherVelocityKeep, ETHER_INTRO_SECONDS, stepEther } from "@src/surface/backgrounds/fluid/liquid-ether-drive";
import { ETHER_FRAGMENT, ETHER_PRESSURE_STEPS, ETHER_VELOCITY_PASS } from "@src/surface/backgrounds/fluid/liquid-ether-shader";
import { mockIntersection, mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

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

const draws = (calls: string[]): number => calls.filter((c) => c === "drawArrays").length;
const settings = { mouseForce: 20, cursorSize: 100, clickBurst: true, autoDemo: true, autoSpeed: 0.5, autoIntensity: 2.2, autoResumeDelay: 1000, intro: false, gridScale: 0.25 };
function frameAt(elapsed: number, still = false): BackdropFrame {
  return { time: elapsed, dt: still ? 0 : 1 / 60, elapsed, fit: { width: 400, height: 200, scale: 1 }, pointer: createPointerState(), colors: [], reduced: still, still };
}

describe("LiquidEther 纯函数", () => {
  it("染料半衰期 0.35 + p^2 * 12 秒", () => {
    expect(etherKeep(0, 0.35)).toBeCloseTo(0.5, 9);
    expect(etherKeep(1, 12.35)).toBeCloseTo(0.5, 9);
    expect(etherVelocityKeep(0, 0)).toBe(1);
    expect(etherVelocityKeep(1, 0.1)).toBeLessThan(etherVelocityKeep(0, 0.1));
  });
  it("自动路径在画面内", () => {
    for (let p = 0; p < 20; p += 0.7) {
      const [x, y] = etherAutoPath(p);
      expect(x).toBeGreaterThan(0.1);
      expect(x).toBeLessThan(0.9);
      expect(y).toBeGreaterThan(0.1);
      expect(y).toBeLessThan(0.9);
    }
  });
  it("闲置时自动演示爬升, 静态帧不注入, 入场扫一笔", () => {
    const drive = createEtherDrive();
    expect(stepEther(drive, frameAt(3, true), settings).splatK[1]).toBe(0);
    stepEther(drive, frameAt(3), settings);
    const f = stepEther(drive, frameAt(3.02), settings);
    expect(drive.ramp).toBeGreaterThan(0);
    expect(f.splatK[1]).toBeGreaterThan(0);
    const intro = stepEther(createEtherDrive(), frameAt(ETHER_INTRO_SECONDS / 2), { ...settings, intro: true });
    expect(intro.splat[0]).toBeCloseTo(0.5, 6);
  });
  it("点击外推只触发一次", () => {
    const drive = createEtherDrive();
    const frame = frameAt(2);
    frame.pointer.taps.push({ x: 0.5, y: 0.5, at: 1.9 });
    expect(stepEther(drive, frame, settings).burst[2]).toBeGreaterThan(0);
    expect(stepEther(drive, frame, settings).burst[2]).toBe(0);
  });
  it("着色器接线", () => {
    expect(ETHER_PRESSURE_STEPS).toBe(32);
    expect(ETHER_VELOCITY_PASS).toContain("uniform sampler2D u_press;");
    expect(ETHER_FRAGMENT).toContain("uniform sampler2D u_dye;");
  });
});

describe("LiquidEther 渲染", () => {
  it("每帧跑速度, 散度, 32 次压力, 染料, 再上屏", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container } = render(<LiquidEther />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const delta = draws(calls) - before;
    expect(delta).toBeGreaterThan(0);
    expect(delta % (ETHER_PRESSURE_STEPS + 4)).toBe(0);
  });
  it("减弱动效: 只画静态帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const { container } = render(<LiquidEther reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    expect(before).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(draws(calls)).toBe(before);
  });
  it("拿不到 WebGL2 时铺 CSS 兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<LiquidEther />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--primary)");
  });
});
