/**
 * glow 路 PlasmaWave: 热度弹簧与透镜的推进, uniform 映射, 粗 / 细两级追踪, 四级泛光金字塔与光照像素封顶, 着色器调度, 减弱动效只画一帧, WebGL 不可用时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPointerState } from "@src/surface/backdrop/kernel/pointer";
import { feedbackSize } from "@src/surface/backdrop/kernel/feedback";
import { bloomPyramid } from "@src/surface/backgrounds/bloom";
import { capLightPasses, createWaveHeat, PlasmaWave, plasmaWaveUniforms, stepWaveHeat, type PlasmaWaveSettings } from "@src/surface/backgrounds/glow/PlasmaWave";
import {
  PLASMA_WAVE_BLOOM, PLASMA_WAVE_BLOOM_LEVELS, PLASMA_WAVE_COARSE, PLASMA_WAVE_COARSE_RATIO, PLASMA_WAVE_COARSE_SCENE, PLASMA_WAVE_HEAT_SPRING,
  PLASMA_WAVE_INTRO_SECONDS, PLASMA_WAVE_MAX_LIGHT_PIXELS, PLASMA_WAVE_SCENE, plasmaWaveComposite,
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
    expect(PLASMA_WAVE_SCENE).toContain("mix(ink, vec3(1.0), smoothstep(12.0, 26.0, peak) * u_core)");
    expect(PLASMA_WAVE_SCENE).toContain("smoothstep(0.32, 0.8, field)");
  });

  it("场景离屏写出预乘线光, 上屏合成泛光后再收尾", () => {
    expect(PLASMA_WAVE_MAX_LIGHT_PIXELS).toBe(2400000);
    expect(PLASMA_WAVE_BLOOM).toEqual({ threshold: 0.5, knee: 0.5, gain: 0.6 });
    expect(PLASMA_WAVE_SCENE).toContain("o_color = bloom_encode(color * u_brightness * (0.6 + 0.6 * hot) * a, a);");
    expect(PLASMA_WAVE_SCENE).not.toContain("glow_finish(");
    const composite = plasmaWaveComposite(bloomPyramid({ scene: PLASMA_WAVE_SCENE, levels: PLASMA_WAVE_BLOOM_LEVELS }).compositeGlsl);
    expect(composite).toContain("vec3 g = bloom_glow(v_uv);");
    expect(composite).toContain("glow_finish((s.rgb + g) / max(a, 0.0001), a, gl_FragCoord.xy)");
  });

  it("粗通道写场强上界提示, 场景按名读同帧粗结果, 提示低于截断一半时跳过", () => {
    expect(PLASMA_WAVE_COARSE).toBe("u_plasma_coarse");
    expect(PLASMA_WAVE_COARSE_SCENE).toContain("vec2 lo = max(d - 1.5 * fwidth(d), 0.0);");
    expect(PLASMA_WAVE_COARSE_SCENE).toContain("o_color = vec4(e / (e + FIELD_CUT), near / (near + 1.0), step(lo.y, lo.x), 1.0);");
    expect(PLASMA_WAVE_COARSE_SCENE).not.toContain("u_plasma_coarse");
    expect(PLASMA_WAVE_SCENE).toContain("uniform sampler2D u_plasma_coarse;");
    expect(PLASMA_WAVE_SCENE).toContain("if (coarse_hint() < 0.3333) { o_color = vec4(0.0); return; }");
    expect(PLASMA_WAVE_SCENE).toContain(`const float FIELD_CUT = ${(-Math.log(0.97)).toFixed(7)};`);
    for (const src of [PLASMA_WAVE_SCENE, PLASMA_WAVE_COARSE_SCENE]) expect(src).toContain("vec2 wave(vec2 uv)");
  });

  it("光照通道按 MAX_LIGHT_PIXELS 封顶, 粗通道为场景的 1/3 且排在场景前, 各级不超过场景比例", () => {
    const passes = bloomPyramid({ scene: PLASMA_WAVE_SCENE, levels: PLASMA_WAVE_BLOOM_LEVELS }).passes;
    const coarse = { name: PLASMA_WAVE_COARSE, fragment: PLASMA_WAVE_COARSE_SCENE };
    const small = capLightPasses(coarse, passes, () => [1200, 800]).map((p) => p.scale ?? 0);
    expect(small[0]).toBeCloseTo(1 / PLASMA_WAVE_COARSE_RATIO, 9);
    expect(small.slice(1)).toEqual([1, 0.5, 0.25, 0.125, 0.0625]);
    const big = capLightPasses(coarse, passes, () => [4000, 2000]);
    const scene = big[1].scale ?? 0;
    const [w, h] = feedbackSize(4000, 2000, scene);
    expect(w * h).toBeLessThanOrEqual(PLASMA_WAVE_MAX_LIGHT_PIXELS);
    expect(scene).toBeGreaterThan(0.5);
    expect(big[0].scale ?? 0).toBeCloseTo(scene / PLASMA_WAVE_COARSE_RATIO, 9);
    expect(big.slice(2).map((p) => p.scale)).toEqual([0.5, 0.25, 0.125, 0.0625]);
    expect(capLightPasses(coarse, passes, () => [0, 0])[1].scale).toBe(1);
    expect(big.map((p) => p.name)).toEqual([PLASMA_WAVE_COARSE, ...passes.map((p) => p.name)]);
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

  it("静态帧画粗通道, 场景, 四级金字塔与上屏共 7 次", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(true));
    render(<PlasmaWave glow={0.5} />);
    expect(draws(calls)).toBe(7);
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
