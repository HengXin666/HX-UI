/**
 * Hyperspeed: 加速 / 视场弹簧 / 转向的状态推进, 离屏场景加泛光金字塔, WebGL2 渲染, 兜底与减弱动效静帧.
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Hyperspeed } from "@src/surface/backgrounds/particles/Hyperspeed";
import { CURVE_KIND, HYPERSPEED, HYPERSPEED_FRAGMENT, hyperspeedComposite, makeHyperspeedState, stepHyperspeed } from "@src/surface/backgrounds/particles/hyperspeed-shader";
import { mockWebgl2 } from "../../backdrop/helpers";
import { mockReducedMotion, recordCanvas2d, useFakeClock } from "../../helpers";

afterEach(() => {
  vi.useRealTimers();
});

describe("Hyperspeed 纯函数", () => {
  it("规格常数与片元源码", () => {
    expect([HYPERSPEED.travel, HYPERSPEED.maxPoles, HYPERSPEED.maxColors, HYPERSPEED.boostRise, HYPERSPEED.boostFall]).toEqual([400, 80, 8, 0.28, 0.85]);
    expect([HYPERSPEED.fovStiffness, HYPERSPEED.fovDamping, HYPERSPEED.steerTau]).toEqual([90, 13, 0.35]);
    expect(CURVE_KIND.straight).toBe(0);
    expect(HYPERSPEED_FRAGMENT).toContain("uniform vec3 u_heads[8]");
  });

  it("场景离屏写线性光与覆盖率, 上屏合成四级泛光", () => {
    expect([HYPERSPEED.bloomLevels, HYPERSPEED.bloomThreshold, HYPERSPEED.bloomKnee, HYPERSPEED.bloomGain]).toEqual([4, 0.6, 0.5, 1.5]);
    expect(HYPERSPEED_FRAGMENT).toContain("o_color = bloom_encode(col, clamp(alpha, 0.0, 1.0));");
    expect(HYPERSPEED_FRAGMENT).not.toContain("u_bloom");
    expect(HYPERSPEED_FRAGMENT).not.toContain("gl_FragCoord");
    const composite = hyperspeedComposite("// pyramid");
    expect(composite.startsWith("#version 300 es")).toBe(true);
    expect(composite).toContain("bloom_glow(v_uv)");
  });

  it("加速升快落慢, 视场被弹簧拉向目标, 行程随加速变快", () => {
    const s = makeHyperspeedState(90);
    stepHyperspeed(s, 0.05, { wanted: 3, fovTarget: 130, steerTarget: 1, cruise: 60 });
    const risen = s.boost;
    expect(risen).toBeCloseTo(3 * (1 - Math.exp(-0.05 / 0.28)), 9);
    expect(s.fov).toBeGreaterThan(90);
    expect(s.steer).toBeGreaterThan(0);
    expect(s.travel).toBeCloseTo(0.05 * 60 * (1 + risen), 9);
    const fall = makeHyperspeedState(90);
    fall.boost = risen;
    stepHyperspeed(fall, 0.05, { wanted: 0, fovTarget: 90, steerTarget: 0, cruise: 60 });
    expect(risen - fall.boost).toBeLessThan(risen);
    expect(risen - fall.boost).toBeCloseTo(risen * (1 - Math.exp(-0.05 / 0.85)), 9);
    for (let i = 0; i < 400; i += 1) stepHyperspeed(s, 0.016, { wanted: 3, fovTarget: 130, steerTarget: 1, cruise: 60 });
    expect(s.fov).toBeCloseTo(130, 1);
  });
});

describe("Hyperspeed 渲染", () => {
  it("WebGL2 可用时 live 并持续出帧", () => {
    useFakeClock();
    const calls: string[] = [];
    const restore = mockWebgl2(calls);
    const { container } = render(<Hyperspeed />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(200));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before);
    restore();
  });

  it("拿不到 webgl2 时走 CSS 兜底", () => {
    const restore = recordCanvas2d([]);
    const { container } = render(<Hyperspeed />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    restore();
  });

  it("减弱动效: 只画一帧", () => {
    useFakeClock();
    const calls: string[] = [];
    const restore = mockWebgl2(calls);
    const restoreMotion = mockReducedMotion(true);
    const { container } = render(<Hyperspeed />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    expect(before).toBe(1 + HYPERSPEED.bloomLevels + 1);
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
    restoreMotion();
    restore();
  });
});
