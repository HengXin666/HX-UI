/**
 * Particles: 点云生成, 投影, 冲击波与悬停位移的纯函数, Canvas2D 渲染与减弱动效静帧.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Particles } from "@src/surface/backgrounds/particles/Particles";
import { burstPush, hoverShift, linkAlpha, makeParticles, PARTICLES, pointSize, project, twinkleOf, wrapSpan } from "@src/surface/backgrounds/particles/particles-field";
import { inkOf, introProgress, paletteUniform, seeded } from "@src/surface/backgrounds/particles/tokens";
import { mockWebgl2 } from "../../backdrop/helpers";
import { mockReducedMotion, recordCanvas2d, stubRect, useFakeClock } from "../../helpers";

afterEach(() => {
  vi.useRealTimers();
});

describe("particles 路公共工具", () => {
  it("取色串, 入场进度, 种子序列, 色板 uniform", () => {
    expect(inkOf([1, 0, 0], 0.5)).toBe("color(srgb 1.0000 0.0000 0.0000 / 0.5000)");
    expect(introProgress(Number.POSITIVE_INFINITY, 2, true)).toBe(1);
    expect(introProgress(1, 2, true)).toBe(0.5);
    expect(introProgress(0, 2, false)).toBe(1);
    const a = seeded(3);
    const b = seeded(3);
    expect([a(), a()]).toEqual([b(), b()]);
    const u = paletteUniform([[1, 0, 0]], 3);
    expect(Array.from(u.list)).toEqual([1, 0, 0, 1, 0, 0, 1, 0, 0]);
  });
});

describe("Particles 纯函数", () => {
  it("规格常数", () => {
    expect([PARTICLES.maxLinked, PARTICLES.maxLines, PARTICLES.maxBursts]).toEqual([900, 9000, 4]);
    expect([PARTICLES.burstSeconds, PARTICLES.burstSpeed, PARTICLES.burstWidth, PARTICLES.introSeconds]).toEqual([1.5, 520, 46, 1.8]);
    expect(PARTICLES.focal).toBeCloseTo(1 / Math.tan((7.5 * Math.PI) / 180), 9);
  });

  it("点云可复现, 落在单位球内, 数量有上限", () => {
    const a = makeParticles(50, 1);
    expect(a).toEqual(makeParticles(50, 1));
    expect(a.every((p) => Math.hypot(p.x, p.y, p.z) <= 1 + 1e-9)).toBe(true);
    expect(makeParticles(1e6, 1)).toHaveLength(PARTICLES.maxCount);
  });

  it("投影, 折回, 尺寸与闪烁", () => {
    expect(project(1, 0, 0, 20)?.sx).toBeCloseTo(PARTICLES.focal / 20, 9);
    expect(project(0, 0, 20, 20)).toBeNull();
    expect(wrapSpan(11, 10)).toBeCloseTo(-9, 9);
    expect(pointSize(100, 0, 0.5, 20)).toBe(5);
    expect(twinkleOf(0, 3, 0.2, 0.4)).toBe(1);
    const tw = twinkleOf(1, 3, 0.2, 0.4);
    expect(tw).toBeGreaterThanOrEqual(0.4);
    expect(tw).toBeLessThanOrEqual(1);
  });

  it("冲击波在前沿最强, 过寿命为 0; 悬停推开为正, 吸引为负; 连线随距离衰减", () => {
    const front = 0.5 * PARTICLES.burstSpeed;
    expect(burstPush(front, 0.5)).toBeGreaterThan(burstPush(front + 100, 0.5));
    expect(burstPush(front, 2)).toBe(0);
    expect(hoverShift(20, 140, "repel")).toBeGreaterThan(0);
    expect(hoverShift(20, 140, "attract")).toBeLessThan(0);
    expect(hoverShift(20, 140, "parallax")).toBe(0);
    expect(hoverShift(200, 140, "repel")).toBe(0);
    expect(linkAlpha(0, 110)).toBeCloseTo(PARTICLES.linkAlpha, 9);
    expect(linkAlpha(120, 110)).toBe(0);
  });
});

describe("Particles 渲染", () => {
  it("Canvas2D 可用时 live, 入场后画出点, 点击不报错", () => {
    useFakeClock();
    const calls: string[] = [];
    const restore = recordCanvas2d(calls);
    const { container } = render(<Particles connections shape="ring" />);
    const host = container.firstElementChild as HTMLElement;
    stubRect(host, { left: 0, top: 0, width: 200, height: 100 });
    expect(host.dataset.backdropStatus).toBe("live");
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.pointerDown(host, { clientX: 50, clientY: 50 });
    calls.length = 0;
    act(() => vi.advanceTimersByTime(100));
    expect(calls).toContain("arc");
    expect(calls).toContain("stroke");
    restore();
  });

  it("拿不到 2d 上下文时走 CSS 兜底", () => {
    const restore = mockWebgl2([]);
    const { container } = render(<Particles />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
    restore();
  });

  it("减弱动效: 只画一帧静止点云", () => {
    useFakeClock();
    const calls: string[] = [];
    const restore = recordCanvas2d(calls);
    const restoreMotion = mockReducedMotion(true);
    const { container } = render(<Particles />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropPlan).toBe("still");
    expect(calls).toContain("arc");
    const before = calls.length;
    act(() => vi.advanceTimersByTime(500));
    expect(calls.length).toBe(before);
    restoreMotion();
    restore();
  });
});
