/**
 * glow 路 GradientWaves: 镜头跟随与回中, 入场浪前沿, 浪面上界与 uniform 映射, 着色器调度, 减弱动效只画一帧, WebGL 不可用时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPointerState } from "@src/surface/backdrop/kernel/pointer";
import {
  createWaveView, GRADIENT_WAVES_INTRO_REACH, GRADIENT_WAVES_STEER_SPAN, GradientWaves, gradientWavesUniforms, stepWaveView, waveIntro, waveTop,
  type GradientWavesSettings,
} from "@src/surface/backgrounds/glow/GradientWaves";
import {
  GRADIENT_WAVES_CAMERA_HEIGHT, GRADIENT_WAVES_FAR, GRADIENT_WAVES_FRAGMENT, GRADIENT_WAVES_INTRO_SECONDS, GRADIENT_WAVES_MAX_SWELLS, GRADIENT_WAVES_QUALITY,
  GRADIENT_WAVES_SWELL_GAIN, GRADIENT_WAVES_SWELL_SECONDS, GRADIENT_WAVES_SWELL_WIDTH,
} from "@src/surface/backgrounds/glow/gradient-waves-shader";
import { mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

const BASE: GradientWavesSettings = {
  amplitude: 2.5, waveScale: 0.6, waveRatio: 0.9, swell: 35, turbulence: 20, tilt: 64, zoom: 1, height: 5.5, fogDepth: 15, relief: 1, lightAngle: 90,
  sheen: 0, brightness: 1, quality: "high", intro: true, background: false,
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

describe("GradientWaves 纯函数", () => {
  it("规格常数", () => {
    expect([GRADIENT_WAVES_MAX_SWELLS, GRADIENT_WAVES_SWELL_SECONDS, GRADIENT_WAVES_SWELL_GAIN, GRADIENT_WAVES_SWELL_WIDTH]).toEqual([4, 3.2, 2.8, 8]);
    expect([GRADIENT_WAVES_INTRO_SECONDS, GRADIENT_WAVES_CAMERA_HEIGHT, GRADIENT_WAVES_FAR]).toEqual([2.6, 30, 4000]);
    expect(GRADIENT_WAVES_QUALITY).toEqual({ low: 56, medium: 84, high: 120 });
    expect(GRADIENT_WAVES_FRAGMENT).toContain("mix(1.0, smoothstep(u_intro.y * 0.45, u_intro.y * 1.6, d), u_intro.z)");
    expect(GRADIENT_WAVES_FRAGMENT).toContain("mix(u_wave, u_crest, smoothstep(0.45, 1.0, crest) * 0.5)");
    expect(GRADIENT_WAVES_FRAGMENT).toContain("1.0 - exp(-dist / (u_fog * 5.0))");
  });

  it("视角跟向指针, 浪向随偏航转, 离开后回中, 静态帧不动", () => {
    const view = createWaveView();
    const pointer = { ...createPointerState(), x: 1, y: 0.5, inside: true };
    for (let i = 0; i < 200; i += 1) stepWaveView(view, { dt: 0.05, pointer }, true);
    expect(view.look[0]).toBeCloseTo(1, 4);
    expect(view.look[1]).toBeCloseTo(0, 6);
    expect(view.steer).toBeCloseTo(GRADIENT_WAVES_STEER_SPAN, 3);
    stepWaveView(view, { dt: 0, pointer: { ...pointer, inside: false } }, true);
    expect(view.look[0]).toBeCloseTo(1, 4);
    for (let i = 0; i < 200; i += 1) stepWaveView(view, { dt: 0.05, pointer }, false);
    expect(view.look[0]).toBeCloseTo(0, 4);
    expect(view.steer).toBeCloseTo(0, 3);
  });

  it("入场前沿由远处收到 0, 减弱动效直接结束", () => {
    expect(waveIntro(0, true)).toEqual([0, GRADIENT_WAVES_INTRO_REACH, 1]);
    const [, mid] = waveIntro(GRADIENT_WAVES_INTRO_SECONDS / 2, true);
    expect(mid).toBeCloseTo(GRADIENT_WAVES_INTRO_REACH / 8, 6);
    expect(waveIntro(Number.POSITIVE_INFINITY, true)).toEqual([1, 0, 0]);
    expect(waveIntro(0, false)).toEqual([1, 0, 0]);
  });

  it("浪面上界, 相机高度, 质量步数, 光源方位, 底色开关", () => {
    expect(waveTop(BASE)).toBeCloseTo(2.5 * (0.92 + 0.35 + 0.12 + 2.8), 6);
    const u = gradientWavesUniforms({ colors: [], elapsed: Number.POSITIVE_INFINITY }, createWaveView(), BASE);
    expect(u.u_eye).toBeCloseTo(GRADIENT_WAVES_CAMERA_HEIGHT, 6);
    expect(u.u_pitch).toBeCloseTo((26 * Math.PI) / 180, 6);
    expect([u.u_steps, u.u_bg_on, u.u_swell_amt, u.u_turb]).toEqual([120, 0, 0.35, 0.2]);
    expect((u.u_light_dir as number[])[0]).toBeCloseTo(0, 6);
    expect(u.u_intro).toEqual([1, 0, 0]);
  });
});

describe("GradientWaves 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<GradientWaves data-testid="host" />);
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
    const { getByTestId } = render(<GradientWaves data-testid="host" />);
    expect(getByTestId("host").dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });

  it("拿不到 WebGL2 时铺渐变兜底", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<GradientWaves data-testid="host" backgroundColor="background" />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
