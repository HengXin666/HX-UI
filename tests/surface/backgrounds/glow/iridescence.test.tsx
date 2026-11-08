/**
 * glow 路 Iridescence: 搅动场衰减与上屏的 uniform 映射, 分辨率倍率, 多通道调度, 减弱动效只画一帧, WebGL 不可用时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFollower } from "@src/surface/backgrounds/glow/glow-kit";
import {
  Iridescence, iridescenceDpr, iridescenceFieldUniforms, iridescenceUniforms, type IridescenceSettings,
} from "@src/surface/backgrounds/glow/Iridescence";
import {
  IRIDESCENCE_FIELD, IRIDESCENCE_FIELD_COLUMNS, IRIDESCENCE_FRAGMENT, IRIDESCENCE_MAX_SWIRLS, IRIDESCENCE_SWIRL_LIFE,
} from "@src/surface/backgrounds/glow/iridescence-shader";
import { mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

const BASE: IridescenceSettings = {
  amplitude: 0.1, scale: 1, detail: 40, rotation: 180, warp: 1, hueShift: 0, saturation: 1, brightness: 1.5, contrast: 1, stir: 0.5, sheen: 0.3, clickSwirl: false,
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

describe("Iridescence 纯函数", () => {
  it("规格常数", () => {
    expect([IRIDESCENCE_FIELD_COLUMNS, IRIDESCENCE_MAX_SWIRLS, IRIDESCENCE_SWIRL_LIFE]).toEqual([48, 6, 3.2]);
    expect(IRIDESCENCE_FRAGMENT).toContain(`uniform sampler2D ${IRIDESCENCE_FIELD}`);
    expect(IRIDESCENCE_FRAGMENT).toContain("exp(-tap.z * 1.35) - exp(-tap.z * 10.0)");
    expect(IRIDESCENCE_FRAGMENT).toContain("3.0 * ease * fade * pow(0.21 / radius, 2.0)");
  });

  it("场衰减 exp(-dt * 1.4), 注入速度乘 stir", () => {
    const f = { ...createFollower(), vx: 2, vy: -1, presence: 1 };
    const u = iridescenceFieldUniforms({ dt: 0.5 }, f, 0.5);
    expect(u.u_decay).toBeCloseTo(Math.exp(-0.7), 6);
    expect(u.u_force).toEqual([1, -0.5]);
    expect(u.u_splat).toEqual([0.5, 0.5, 1]);
  });

  it("细节钳到 12, 旋转换弧度, 旋涡开关, 缺色用亮色兜底, 分辨率乘像素比上限", () => {
    const u = iridescenceUniforms({ colors: [] }, createFollower(), BASE);
    expect(u.u_detail).toBe(12);
    expect(u.u_turn).toBeCloseTo(Math.PI, 6);
    expect(u.u_swirl_on).toBe(0);
    expect(u.u_color).toEqual([0.95, 0.95, 0.95]);
    expect([iridescenceDpr(1), iridescenceDpr(0.5), iridescenceDpr(0.5, 1)]).toEqual([2, 1, 0.5]);
  });
});

describe("Iridescence 渲染", () => {
  it("WebGL2 可用时 live, 每帧先跑搅动场再上屏", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<Iridescence data-testid="host" />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    expect(calls).toContain("createFramebuffer");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(draws(calls)).toBeGreaterThan(before);
    expect(draws(calls) % 2).toBe(0);
  });

  it("减弱动效: 只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(true));
    const { getByTestId } = render(<Iridescence data-testid="host" />);
    expect(getByTestId("host").dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(before).toBeGreaterThan(0);
    expect(draws(calls)).toBe(before);
  });

  it("拿不到 WebGL2 时铺渐变兜底", () => {
    restore.push(recordCanvas2d([]));
    const { getByTestId } = render(<Iridescence data-testid="host" />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
