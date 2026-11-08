/**
 * glow 路 PlasmaWave: 热度弹簧与透镜的推进, uniform 映射, 着色器调度, 减弱动效只画一帧, WebGL 不可用时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPointerState } from "@src/surface/backdrop/kernel/pointer";
import { createWaveHeat, PlasmaWave, plasmaWaveUniforms, stepWaveHeat, type PlasmaWaveSettings } from "@src/surface/backgrounds/glow/PlasmaWave";
import {
  PLASMA_WAVE_BLOOM_LEVELS, PLASMA_WAVE_COARSE_RATIO, PLASMA_WAVE_FRAGMENT, PLASMA_WAVE_HEAT_SPRING, PLASMA_WAVE_INTRO_SECONDS,
} from "@src/surface/backgrounds/glow/plasma-wave-shader";
import { mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

const BASE: PlasmaWaveSettings = {
  speed1: 0.05, speed2: 0.05, dir2: -3, bend1: 1, bend2: 0.5, thickness: 0.3, focalLength: 0, rotationDeg: 90, xOffset: 0, yOffset: 0, brightness: 1, glow: 1,
  core: 0.6, intro: true,
};

let restore: Array<() => void> = [];
beforeEach(() => {
  useFakeClock();
  restore = [];
});
afterEach(() => {
  restore.forEach((fn) => fn());
  vi.useRealTimers();
});

const draws = (calls: string[]): number => calls.filter((c) => c === "drawArrays").length;

describe("PlasmaWave 纯函数", () => {
  it("规格常数", () => {
    expect([PLASMA_WAVE_BLOOM_LEVELS, PLASMA_WAVE_COARSE_RATIO, PLASMA_WAVE_INTRO_SECONDS]).toEqual([4, 3, 1.8]);
    expect(PLASMA_WAVE_HEAT_SPRING).toEqual({ stiffness: 120, damping: 19, max: 1.15 });
    expect(PLASMA_WAVE_FRAGMENT).toContain("mix(ink, vec3(1.0), smoothstep(12.0, 26.0, peak) * u_core)");
    expect(PLASMA_WAVE_FRAGMENT).toContain("smoothstep(0.32, 0.8, field)");
  });

  it("热度弹簧过冲但不超 1.15, 最终停在 1; 离开后回 0", () => {
    const h = createWaveHeat();
    const pointer = { ...createPointerState(), x: 0.9, y: 0.2, inside: true };
    let top = 0;
    for (let i = 0; i < 240; i += 1) {
      stepWaveHeat(h, { dt: 1 / 60, pointer }, true);
      top = Math.max(top, h.heat);
    }
    expect(top).toBeLessThanOrEqual(1.15);
    expect(h.heat).toBeCloseTo(1, 3);
    expect(h.heatX).toBeCloseTo(0.9, 3);
    expect(h.lensY).toBeCloseTo(0.2, 3);
    for (let i = 0; i < 240; i += 1) stepWaveHeat(h, { dt: 1 / 60, pointer: { ...pointer, inside: false } }, true);
    expect(h.heat).toBeLessThan(0.01);
  });

  it("方向取符号, 焦距下限, 旋转换弧度, 入场 smoothstep", () => {
    const u = plasmaWaveUniforms({ colors: [], elapsed: 0.9 }, createWaveHeat(), BASE);
    expect([u.u_dir2, u.u_focal, u.u_count]).toEqual([-1, 0.1, 1]);
    expect(u.u_turn).toBeCloseTo(Math.PI / 2, 6);
    expect(u.u_presence).toBeCloseTo(0.5, 6);
    expect(plasmaWaveUniforms({ colors: [], elapsed: Number.POSITIVE_INFINITY }, createWaveHeat(), BASE).u_presence).toBe(1);
  });
});

describe("PlasmaWave 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<PlasmaWave data-testid="host" />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(draws(calls)).toBeGreaterThan(before);
  });

  it("减弱动效: 只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(true));
    const { getByTestId } = render(<PlasmaWave data-testid="host" />);
    expect(getByTestId("host").dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });

  it("拿不到 WebGL2 时铺光晕兜底", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<PlasmaWave data-testid="host" />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
