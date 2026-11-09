/**
 * fluid 路 MoltenMetal: 拖尾画布 (尺寸, 淡出, 补点, 乒乓换页), 耀斑与入场的纯函数, 调色板偏置, 着色器接线, 内核状态, 减弱动效只画一帧, 无 WebGL 时兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MoltenMetal } from "@src/surface/backgrounds/fluid/MoltenMetal";
import {
  MOLTEN_BALANCE, MOLTEN_FLARE_SECONDS, MOLTEN_FRAGMENT, MOLTEN_INTRO_SECONDS, MOLTEN_MAX_COLORS, MOLTEN_MAX_FLARES, MOLTEN_SAMPLE_SECONDS, MOLTEN_TRAIL_SECONDS,
  moltenFlare, moltenReveal,
} from "@src/surface/backgrounds/fluid/molten-metal-shader";
import {
  MOLTEN_TRAIL_LONG_MAX, MoltenTrail, moltenSplatBytes, moltenSplatRadius, moltenTrailKeep, moltenTrailSize, moltenTrailStamps,
} from "@src/surface/backgrounds/fluid/molten-metal-trail";
import type { PointerState } from "@src/surface/backdrop/kernel/pointer";
import { mockIntersection, mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";
import { mockWebgl2And2d } from "./prebake-helpers";

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

const pointerAt = (x: number, y: number, inside: boolean): PointerState => ({ x, y, vx: 0, vy: 0, inside, down: false, presence: inside ? 1 : 0, taps: [], movedAt: 0 });
const frameAt = (elapsed: number, pointer: PointerState, reduced = false) => ({
  fit: { width: 800, height: 400, scale: 1 }, dt: 1 / 60, elapsed, reduced, pointer,
});

describe("MoltenMetal 纯函数与常数", () => {
  it("规格常数", () => {
    expect([MOLTEN_MAX_COLORS, MOLTEN_MAX_FLARES]).toEqual([6, 8]);
    expect([MOLTEN_SAMPLE_SECONDS, MOLTEN_TRAIL_SECONDS, MOLTEN_FLARE_SECONDS, MOLTEN_INTRO_SECONDS]).toEqual([0.06, 0.9, 1.8, 2.4]);
    expect(MOLTEN_BALANCE).toEqual({ molten: 0.5, ember: 0.3, frost: 0.7 });
  });
  it("拖尾画布: 短边 96, 长边按比例封顶", () => {
    expect(moltenTrailSize(800, 400)).toEqual([192, 96]);
    expect(moltenTrailSize(4000, 400)).toEqual([MOLTEN_TRAIL_LONG_MAX, 96]);
    expect(moltenTrailSize(0, 0)).toEqual([1, 1]);
  });
  it("淡出: 寿命内降到 exp(-3)", () => {
    expect(moltenTrailKeep(0)).toBe(1);
    expect(moltenTrailKeep(MOLTEN_TRAIL_SECONDS)).toBeCloseTo(Math.exp(-3), 9);
  });
  it("补点: 没有起点只落终点, 否则按间距铺满且含终点, 不再有点数上限", () => {
    expect(moltenTrailStamps(null, [5, 6], 2)).toEqual([[5, 6]]);
    const line = moltenTrailStamps([0, 0], [100, 0], 2);
    expect(line).toHaveLength(50);
    expect(line[49]).toEqual([100, 0]);
  });
  it("热斑贴图: 中心最亮, 颜色通道为 0", () => {
    const r = moltenSplatRadius();
    const size = r * 2 + 1;
    const bytes = moltenSplatBytes();
    const center = (r * size + r) * 4;
    expect(bytes.length).toBe(size * size * 4);
    expect(bytes[center + 3]).toBe(255);
    expect(bytes[center]).toBe(0);
    expect(bytes[3]).toBeLessThan(40);
  });
  it("乒乓换页: 有新落点或在冷却就换画布身份, 冷透后停住; 拿不到 2D 上下文时为 null", () => {
    const ctxCalls: string[] = [];
    restore.push(mockWebgl2And2d([], ctxCalls));
    const trail = new MoltenTrail();
    trail.step(frameAt(0, pointerAt(0.2, 0.5, true)));
    const first = trail.image;
    expect(first).not.toBeNull();
    trail.step(frameAt(MOLTEN_SAMPLE_SECONDS, pointerAt(0.6, 0.5, true)));
    expect(trail.image).not.toBe(first);
    let t = MOLTEN_SAMPLE_SECONDS;
    for (let i = 0; i < 120; i += 1) {
      t += 1 / 60;
      trail.step(frameAt(t, pointerAt(0.6, 0.5, false)));
    }
    const cold = trail.image;
    trail.step(frameAt(t + 1, pointerAt(0.6, 0.5, false)));
    expect(trail.image).toBe(cold);
    expect(ctxCalls.filter((c) => c === "drawImage").length).toBeGreaterThan(2);
    restore.pop()?.();
    restore.push(mockWebgl2([]));
    const none = new MoltenTrail();
    none.step(frameAt(0, pointerAt(0.5, 0.5, true)));
    expect(none.image).toBeNull();
  });
  it("耀斑迅速升起, 寿命内落回 0", () => {
    expect(moltenFlare(0)).toBe(0);
    expect(moltenFlare(0.3)).toBeGreaterThan(0.9);
    expect(moltenFlare(1.5)).toBeLessThan(moltenFlare(0.3));
    expect(moltenFlare(MOLTEN_FLARE_SECONDS)).toBe(0);
  });
  it("入场线性涨满, 关掉或减弱动效时为 1", () => {
    expect(moltenReveal(1.2, true)).toBeCloseTo(0.5, 6);
    expect(moltenReveal(9, true)).toBe(1);
    expect(moltenReveal(0, false)).toBe(1);
    expect(moltenReveal(Number.POSITIVE_INFINITY, true)).toBe(1);
  });
  it("着色器: 调色板数组, 拖尾纹理与耀斑数组, 屏幕导数脊线", () => {
    expect(MOLTEN_FRAGMENT).toContain("uniform vec3 u_colors[6];");
    expect(MOLTEN_FRAGMENT).toContain("uniform sampler2D u_trail_map;");
    expect(MOLTEN_FRAGMENT).not.toContain("u_trail[");
    expect(MOLTEN_FRAGMENT).toContain("float footprint = 0.5 * length(vec2(dFdx(l), dFdy(l)));");
  });
});

describe("MoltenMetal 渲染", () => {
  it("有 WebGL2 时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container } = render(<MoltenMetal colors={["primary", "accent", "accent-2"]} colorMode="ember" />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(draws(calls)).toBeGreaterThan(before);
  });
  it("减弱动效: 只画静态帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const { container } = render(<MoltenMetal reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    expect(before).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(draws(calls)).toBe(before);
  });
  it("拿不到 WebGL2 时铺兜底层", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<MoltenMetal />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
