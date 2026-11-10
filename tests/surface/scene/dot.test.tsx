/**
 * scene 族: DotReveal (HalftoneReveal). 跟手与爆开状态, 着色器接线, 渲染, 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DOT, DotReveal, dotFade, dotWanderPath, makeDot, packBursts, stepDot } from "@src/surface/scene";
import { dotMatte } from "@src/surface/scene/parts/dot";
import { DOT_FRAGMENT, DOT_MASK_PASS } from "@src/surface/scene/parts/dot-shader";
import { mockIntersection, mockReducedMotion, mockWebgl2, useFakeClock } from "../backdrop/helpers";
import { recordCanvas2d } from "../helpers";

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

const box = { width: 400, height: 300 };
const tuning = { wander: false, clickBurst: true };

describe("DotReveal 状态", () => {
  it("规格常数", () => {
    expect(DOT).toMatchObject({ modes: { mono: 0, duotone: 1, color: 2 }, shapes: { dot: 0, ellipse: 1, square: 2, diamond: 3, line: 4, cross: 5 }, maxBursts: 4, burstSeconds: 1.3, introSeconds: 1.4, maskScale: 0.5, cellSize: 6, angle: 45, revealRadius: 160, softness: 0.6, linger: 1.2 });
  });
  it("首次进入落在指针处, 之后按 35ms 跟手; 在场按 160ms 趋近", () => {
    const s = makeDot();
    stepDot(s, 0.016, 0, { x: 100, y: 50, inside: true, ...box, taps: [] }, tuning);
    expect([s.x, s.y, s.fromX]).toEqual([100, 50, 100]);
    stepDot(s, 0.035, 0.05, { x: 200, y: 50, inside: true, ...box, taps: [] }, tuning);
    expect(s.fromX).toBe(100);
    expect(s.x).toBeCloseTo(100 + 100 * (1 - Math.exp(-1)), 4);
    expect(s.presence).toBeGreaterThan(0);
    for (let i = 0; i < 60; i += 1) stepDot(s, 0.05, 0.1 + i * 0.05, { x: 0, y: 0, inside: false, ...box, taps: [] }, tuning);
    expect(s.presence).toBeLessThan(0.01);
  });
  it("点击入队一次, 上限 4 个, 1.3 秒出队; 关掉 clickBurst 不入队", () => {
    const s = makeDot();
    const taps = [0, 0.1, 0.2, 0.3, 0.4].map((at) => ({ x: 10, y: 10, at }));
    stepDot(s, 0.016, 0.5, { x: 0, y: 0, inside: true, ...box, taps }, tuning);
    stepDot(s, 0.016, 0.5, { x: 0, y: 0, inside: true, ...box, taps }, tuning);
    expect(s.bursts).toHaveLength(4);
    const packed = packBursts(s, 0.5);
    expect(packed[2]).toBeCloseTo(0.4 / 1.3, 5);
    expect(packed[3]).toBe(1);
    stepDot(s, 0.016, 2, { x: 0, y: 0, inside: true, ...box, taps: [] }, tuning);
    expect(s.bursts).toHaveLength(0);
    const off = makeDot();
    stepDot(off, 0.016, 0, { x: 0, y: 0, inside: true, ...box, taps }, { wander: false, clickBurst: false });
    expect(off.bursts).toHaveLength(0);
  });
  it("漫游: 指针不在时 1.2 秒渐入, 沿路径走", () => {
    const s = makeDot();
    stepDot(s, 0.05, 1, { x: 0, y: 0, inside: false, ...box, taps: [] }, { wander: true, clickBurst: true });
    expect(s.drift).toBeCloseTo(0.05 / 1.2, 5);
    expect(s.x).toBeCloseTo(dotWanderPath(1, 400, 300).x, 4);
    expect(s.presence).toBeGreaterThan(0);
  });
  it("褪色量 dt / linger, 不低于 1/255", () => {
    expect(dotFade(0.12, 1.2)).toBeCloseTo(0.1, 6);
    expect(dotFade(0, 1.2)).toBeCloseTo(1 / 255, 6);
    expect(dotFade(0.016, 0)).toBe(1);
  });
  it("着色器接线", () => {
    expect(DOT_MASK_PASS).toContain("uniform vec4 u_bursts[4];");
    expect(DOT_MASK_PASS).toContain("uniform sampler2D u_mask;");
    expect(DOT_FRAGMENT).toContain("fitUv");
    expect(DOT_FRAGMENT).toContain("keep *= mix(1.0, smoothstep(0.05, 0.2, distance(c, u_matte)), u_key);");
    expect(DOT_FRAGMENT).toContain("mix(u_paper, shown, keep)");
    expect(DOT.fits).toEqual({ cover: 0, contain: 1, fill: 2 });
    expect(DOT_FRAGMENT).toContain("uniform sampler2D u_mask;");
  });
});

describe("DotReveal 抠底", () => {
  it("底色取四角平均; 画布不可用或读不出时为 null", () => {
    const n = DOT.matteGrid;
    const data = new Uint8ClampedArray(n * n * 4);
    for (const i of [0, n - 1, n * (n - 1), n * n - 1]) data.set([255, 51, 0, 255], i * 4);
    const ctx = { drawImage: vi.fn(), getImageData: () => ({ data }) };
    const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    const m = dotMatte(new Image());
    expect(m?.[0]).toBeCloseTo(1, 6);
    expect(m?.[1]).toBeCloseTo(0.2, 6);
    expect(m?.[2]).toBe(0);
    spy.mockReturnValue(null);
    expect(dotMatte(new Image())).toBeNull();
    spy.mockImplementation(() => {
      throw new Error("tainted");
    });
    expect(dotMatte(new Image())).toBeNull();
    spy.mockRestore();
  });
});

describe("DotReveal 渲染", () => {
  it("每帧遮罩一遍加上屏一遍, 带 alt 时是 img; 减弱动效只画一帧; 没有 WebGL2 时铺图片兜底", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container, unmount } = render(<DotReveal src="/a.jpg" alt="街景" mode="duotone" shape="diamond" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    expect(host.getAttribute("role")).toBe("img");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(160));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before + 6);
    unmount();
    const still: string[] = [];
    restore.push(mockWebgl2(still));
    const { container: c2, unmount: u2 } = render(<DotReveal src="/a.jpg" reducedMotion />);
    expect((c2.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    u2();
    restore.push(recordCanvas2d([]));
    const { container: c3 } = render(<DotReveal src="/a.jpg" />);
    const h3 = c3.firstElementChild as HTMLElement;
    expect(h3.dataset.backdropStatus).toBe("fallback");
    expect(h3.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("a.jpg");
    const { container: c4 } = render(<DotReveal src="/b.jpg" fit="contain" keyOut />);
    expect((c4.firstElementChild as HTMLElement).querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("contain");
  });
});
