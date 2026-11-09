/**
 * GhostFibers: 流动 / 滚转 / 指针跟随的纯函数, WebGL2 渲染, 兜底与减弱动效静帧.
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GhostFibers } from "@src/surface/backgrounds/particles/GhostFibers";
import { FIBERS, FIBERS_FRAGMENT, fibersComposite, makeFiberState, stepFibers } from "@src/surface/backgrounds/particles/ghost-fibers-shader";
import { mockWebgl2 } from "../../backdrop/helpers";
import { mockReducedMotion, recordCanvas2d, useFakeClock } from "../../helpers";

afterEach(() => {
  vi.useRealTimers();
});

describe("GhostFibers 纯函数", () => {
  it("规格常数与片元源码", () => {
    expect([FIBERS.introSeconds, FIBERS.flowRate, FIBERS.hoverTau, FIBERS.presenceIn, FIBERS.presenceOut, FIBERS.dtCap]).toEqual([2.6, 12, 0.08, 0.3, 0.6, 0.05]);
    expect(FIBERS.styles).toEqual({ dots: 0, dashes: 0.45, lines: 1 });
    expect(FIBERS.gradients).toEqual({ depth: 0, along: 1, across: 2 });
    expect(FIBERS.hovers).toEqual({ focus: 0, part: 1, none: 2 });
    expect(FIBERS_FRAGMENT.startsWith("#version 300 es")).toBe(true);
    expect(FIBERS_FRAGMENT).toContain("uniform vec3 u_hover");
  });

  it("散景: 失焦的点 / 段混成盘边略亮的圆盘; 场景离屏写压缩前线性光, 上屏加泛光再压缩", () => {
    expect(FIBERS_FRAGMENT).toContain("smoothstep(0.25, 0.7, blur)");
    expect(FIBERS_FRAGMENT).toContain("(0.94 + 0.08 * smoothstep(0.55, 0.95, rho))");
    expect(FIBERS_FRAGMENT).toContain("o_color = bloom_encode(col * 1.3, 1.0);");
    expect(FIBERS_FRAGMENT).not.toContain("hx_tonemap(col");
    expect([FIBERS.bloomLevels, FIBERS.bloomThreshold, FIBERS.bloomKnee]).toEqual([4, 0.775, 0.425]);
    expect(FIBERS.bloomThreshold - FIBERS.bloomKnee).toBeCloseTo(0.35, 9);
    expect(FIBERS.bloomThreshold + FIBERS.bloomKnee).toBeCloseTo(1.2, 9);
    expect(fibersComposite("// pyramid")).toContain("hx_tonemap(bloom_scene(v_uv).rgb + bloom_glow(v_uv))");
  });

  it("流动 dt * flow * 12, 滚转 dt * rollSpeed, 帧长钳 0.05s; 指针 0.08s 跟随, 在场升快落慢", () => {
    const s = makeFiberState();
    stepFibers(s, 0.02, 0.4, 0.15, 0.2, 0.8, true);
    expect([s.hx, s.hy]).toEqual([0.2, 0.8]);
    stepFibers(s, 0.02, 0.4, 0.15, 0.6, 0.8, true);
    expect(s.flow).toBeCloseTo(0.04 * 0.4 * 12, 9);
    expect(s.roll).toBeCloseTo(0.04 * 0.15, 9);
    expect(s.hx).toBeCloseTo(0.2 + 0.4 * (1 - Math.exp(-0.02 / 0.08)), 9);
    expect(s.presence).toBeCloseTo(1 - Math.exp(-0.02 / 0.3), 9);
    const before = s.flow;
    stepFibers(s, 1, 1, 0, 0.6, 0.8, true);
    expect(s.flow - before).toBeCloseTo(0.05 * 12, 9);
    stepFibers(s, 0, 1, 0, 0.6, 0.8, false);
    expect(s.presence).toBe(0);
  });
});

describe("GhostFibers 渲染", () => {
  it("WebGL2 可用时 live 并持续出帧", () => {
    useFakeClock();
    const calls: string[] = [];
    const restore = mockWebgl2(calls);
    const { container } = render(<GhostFibers />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(200));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before);
    restore();
  });

  it("拿不到 webgl2 时走 CSS 兜底", () => {
    const restore = recordCanvas2d([]);
    const { container } = render(<GhostFibers />);
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
    const { container } = render(<GhostFibers fiberStyle="lines" />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    expect(before).toBe(1 + FIBERS.bloomLevels + 1);
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
    restoreMotion();
    restore();
  });
});
