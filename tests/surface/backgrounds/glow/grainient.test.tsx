/**
 * glow 路 Grainient: 搅动轨迹的落点 / 老化 / 上限, 色标与入场的 uniform 映射, 着色器调度, 减弱动效只画一帧, WebGL 不可用时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFollower } from "@src/surface/backgrounds/glow/glow-kit";
import { createStirTrail, Grainient, grainientUniforms, stepStirs, stirList, type GrainientSettings } from "@src/surface/backgrounds/glow/Grainient";
import {
  GRAINIENT_FRAGMENT, GRAINIENT_INTRO_SECONDS, GRAINIENT_MAX_COLORS, GRAINIENT_MAX_STIRS, GRAINIENT_MAX_TWIRLS, GRAINIENT_STIR_LIFE, GRAINIENT_STIR_STEP,
  GRAINIENT_TWIRL_LIFE,
} from "@src/surface/backgrounds/glow/grainient-shader";
import { mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

const BASE: GrainientSettings = {
  type: "radial", angle: 90, bands: 0, flow: 0.8, scale: 1, softness: 1, silk: 0.35, grainAmount: 0.08, grainSize: 1.2, grainAnimated: false, contrast: 1,
  saturation: 1, variation: 0, stir: 1, clickSwirl: true, intro: true, lightMode: true,
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

describe("Grainient 纯函数", () => {
  it("规格常数", () => {
    expect([GRAINIENT_MAX_COLORS, GRAINIENT_MAX_STIRS, GRAINIENT_MAX_TWIRLS]).toEqual([8, 24, 4]);
    expect([GRAINIENT_STIR_LIFE, GRAINIENT_STIR_STEP, GRAINIENT_TWIRL_LIFE, GRAINIENT_INTRO_SECONDS]).toEqual([1.3, 0.06, 2.6, 1.6]);
    expect(GRAINIENT_FRAGMENT).toContain("smoothstep(0.5 - edge, 0.5 + edge, x - i)");
    expect(GRAINIENT_FRAGMENT).toContain("smoothstep(0.0, 1.0, u_reveal * 1.5 - length(v_uv - 0.5) * 0.6)");
  });

  it("指针在动时每 STIR_STEP 落一点, 过寿命移除, 至多 24 个", () => {
    const trail = createStirTrail();
    const moving = { ...createFollower(), vx: 1, vy: 0 };
    stepStirs(trail, moving, 0.03, true);
    expect(trail.stirs).toHaveLength(0);
    stepStirs(trail, moving, 0.03, true);
    expect(trail.stirs).toHaveLength(1);
    expect(trail.stirs[0].strength).toBe(1);
    for (let i = 0; i < 60; i += 1) stepStirs(trail, moving, GRAINIENT_STIR_STEP / 2, true);
    expect(trail.stirs.length).toBeLessThanOrEqual(GRAINIENT_MAX_STIRS);
    stepStirs(trail, moving, GRAINIENT_STIR_LIFE, false);
    expect(trail.stirs).toHaveLength(0);
  });

  it("打包搅动点, 类型编号, 亮底提亮, 入场 1.6 秒", () => {
    const trail = { stirs: [{ x: 0.2, y: 0.4, age: 0.65, grow: 1, strength: 0.5 }], since: 0 };
    expect(Array.from(stirList(trail).list.slice(0, 4))).toEqual([0.2, 0.4, 0.5, 0.5].map(Math.fround));
    const u = grainientUniforms({ colors: [], elapsed: 0.8 }, trail, BASE);
    expect([u.u_type, u.u_bands, u.u_lift, u.u_count, u.u_stir_count, u.u_grain_live]).toEqual([1, 1, 0.2, 1, 1, 0]);
    expect(u.u_reveal).toBeCloseTo(0.5, 6);
    expect((u.u_dir as number[])[1]).toBeCloseTo(1, 6);
  });
});

describe("Grainient 渲染", () => {
  it("WebGL2 可用时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<Grainient data-testid="host" />);
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
    const { getByTestId } = render(<Grainient data-testid="host" />);
    expect(getByTestId("host").dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });

  it("拿不到 WebGL2 时铺色标渐变兜底", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<Grainient data-testid="host" />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
