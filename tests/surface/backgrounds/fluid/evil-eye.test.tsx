/**
 * fluid 路 EvilEye: 瞳孔跟随目标的纯函数, 规格常数, 着色器接线, 内核状态, 减弱动效只画一帧, 无 WebGL 时兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EvilEye } from "@src/surface/backgrounds/fluid/EvilEye";
import { EYE_FRAGMENT, EYE_GLOW_SQUASH, EYE_LOOK_TAU, EYE_PUPIL_SQUASH, eyeLookTarget } from "@src/surface/backgrounds/fluid/evil-eye-shader";
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

describe("EvilEye 纯函数与常数", () => {
  it("规格常数: 瞳孔竖缝 9 x 2.3, 外圈光晕 0.5 x 1.5", () => {
    expect(EYE_PUPIL_SQUASH).toEqual([9, 2.3]);
    expect(EYE_GLOW_SQUASH).toEqual([0.5, 1.5]);
    expect(EYE_LOOK_TAU).toBe(0.2);
  });
  it("瞳孔目标: 指针偏移乘跟随度, 长度封顶 1, 离开或不跟时回正", () => {
    expect(eyeLookTarget(0.75, 0.5, true, 1)).toEqual([0.5, 0]);
    const [x, y] = eyeLookTarget(1, 1, true, 2);
    expect(Math.hypot(x, y)).toBeCloseTo(1, 9);
    expect(eyeLookTarget(0.9, 0.9, false, 1)).toEqual([0, 0]);
    expect(eyeLookTarget(0.9, 0.9, true, 0)).toEqual([0, 0]);
  });
  it("着色器: 竖缝瞳孔, 外圈光晕, 规格的混色", () => {
    expect(EYE_FRAGMENT).toContain("float pupil = 1.0 - length(pupilUv * vec2(9.0, 2.3));");
    expect(EYE_FRAGMENT).toContain("float distanceMask = 1.0 - length(uv);");
    expect(EYE_FRAGMENT).toContain("smoothstep(0.02, 0.82, energy) * 0.96");
  });
});

describe("EvilEye 渲染", () => {
  it("有 WebGL2 时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container } = render(<EvilEye eyeColor="destructive" />);
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
    const { container } = render(<EvilEye reducedMotion />);
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
    const { container } = render(<EvilEye />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
