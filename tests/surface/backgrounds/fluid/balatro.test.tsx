/**
 * fluid 路 Balatro: 搅动衰减, 点击旋涡与入场的纯函数, 着色器接线, 内核状态, 减弱动效只画一帧, 无 WebGL 时兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Balatro } from "@src/surface/backgrounds/fluid/Balatro";
import {
  BALATRO_DECAY_TAU, BALATRO_FIELD_SCALE, BALATRO_FRAGMENT, BALATRO_INTRO_SECONDS, BALATRO_MAX_TWIRLS, BALATRO_STIR_PASS, BALATRO_STIR_RADIUS, BALATRO_TWIRL_LIFE,
  balatroDecay, balatroOpening, balatroTwirl,
} from "@src/surface/backgrounds/fluid/balatro-shader";
import { mockIntersection, mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

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

describe("Balatro 纯函数与常数", () => {
  it("规格常数: 格子 8, 搅动半径 90, 旋涡 4 个, 入场 2.2 秒", () => {
    expect([BALATRO_FIELD_SCALE, BALATRO_STIR_RADIUS, BALATRO_MAX_TWIRLS, BALATRO_INTRO_SECONDS, BALATRO_DECAY_TAU]).toEqual([8, 90, 4, 2.2, 1.6]);
  });
  it("搅动场每帧乘 exp(-dt / 1.6)", () => {
    expect(balatroDecay(0)).toBe(1);
    expect(balatroDecay(1.6)).toBeCloseTo(Math.exp(-1), 9);
    expect(balatroDecay(-1)).toBe(1);
  });
  it("点击旋涡拧起后松开, 寿命外为 0", () => {
    expect(balatroTwirl(0)).toBe(0);
    expect(balatroTwirl(0.15)).toBeCloseTo(Math.exp(-0.18), 9);
    expect(balatroTwirl(2)).toBeLessThan(balatroTwirl(0.3));
    expect(balatroTwirl(BALATRO_TWIRL_LIFE + 0.1)).toBe(0);
  });
  it("入场线性涨满, 关掉或减弱动效时为 1", () => {
    expect(balatroOpening(1.1, true)).toBeCloseTo(0.5, 6);
    expect(balatroOpening(0, false)).toBe(1);
    expect(balatroOpening(Number.POSITIVE_INFINITY, true)).toBe(1);
  });
  it("着色器: 上屏读搅动场, 三色按对比度分带", () => {
    expect(BALATRO_FRAGMENT).toContain("uniform sampler2D u_stir;");
    expect(BALATRO_FRAGMENT).toContain("float contrastMod = 0.25 * u_contrast + 0.5 * u_swirl + 1.2;");
    expect(BALATRO_FRAGMENT).toContain("float c3 = 1.0 - min(1.0, c1 + c2);");
    expect(BALATRO_STIR_PASS).toContain("u_decay");
  });
});

describe("Balatro 渲染", () => {
  it("有 WebGL2 时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container } = render(<Balatro crt={0.5} rotationSpeed={1} />);
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
    const { container } = render(<Balatro reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    expect(before).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(draws(calls)).toBe(before);
  });
  it("拿不到 WebGL2 时铺 CSS 渐变兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<Balatro />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector<HTMLElement>("[data-backdrop-fallback]")?.style.background).toContain("var(--primary)");
  });
});
