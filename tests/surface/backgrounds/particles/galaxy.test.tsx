/**
 * Galaxy: 层深推进与点击加速的纯函数, WebGL2 渲染, 兜底与减弱动效静帧.
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Galaxy } from "@src/surface/backgrounds/particles/Galaxy";
import { GALAXY, GALAXY_FRAGMENT, makeGalaxyState, stepGalaxy } from "@src/surface/backgrounds/particles/galaxy-shader";
import { mockWebgl2 } from "../../backdrop/helpers";
import { mockReducedMotion, recordCanvas2d, useFakeClock } from "../../helpers";

afterEach(() => {
  vi.useRealTimers();
});

describe("Galaxy 纯函数", () => {
  it("规格常数与片元源码", () => {
    expect([GALAXY.maxLayers, GALAXY.maxColors, GALAXY.introSeconds, GALAXY.boostDecay, GALAXY.boostGain]).toEqual([8, 4, 2.2, 1.3, 14]);
    expect(GALAXY_FRAGMENT.startsWith("#version 300 es")).toBe(true);
    expect(GALAXY_FRAGMENT).toContain("uniform vec3 u_colors[4]");
  });

  it("点击加速让层深走得更快并按 exp(-1.3 dt) 衰减; 静态帧直接取给定层深", () => {
    const calm = makeGalaxyState();
    const warp = makeGalaxyState();
    warp.boost = 1;
    stepGalaxy(calm, 0.05, 0.1, null);
    stepGalaxy(warp, 0.05, 0.1, null);
    expect(warp.depth).toBeCloseTo(calm.depth * 15, 9);
    expect(warp.boost).toBeCloseTo(Math.exp(-0.05 * 1.3), 9);
    stepGalaxy(calm, 0, 0.1, 0.8);
    expect(calm.depth).toBe(0.8);
  });
});

describe("Galaxy 渲染", () => {
  it("WebGL2 可用时 live 并持续出帧", () => {
    useFakeClock();
    const calls: string[] = [];
    const restore = mockWebgl2(calls);
    const { container } = render(<Galaxy />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(200));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before);
    restore();
  });

  it("拿不到 webgl2 时走 CSS 兜底", () => {
    const restore = recordCanvas2d([]);
    const { container } = render(<Galaxy />);
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
    const { container } = render(<Galaxy />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    expect(before).toBeGreaterThan(0);
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
    restoreMotion();
    restore();
  });
});
