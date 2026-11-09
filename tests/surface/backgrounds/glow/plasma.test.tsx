/**
 * glow 路 Plasma: 视角弹簧与热点的推进, 体积通道与上屏的 uniform 映射, 多通道调度, 减弱动效只画一帧, WebGL 不可用时 CSS 兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPointerState } from "@src/surface/backdrop/kernel/pointer";
import {
  createPlasmaRig, Plasma, plasmaUniforms, plasmaVolumeScale, plasmaVolumeUniforms, stepPlasmaRig, type PlasmaSettings,
} from "@src/surface/backgrounds/glow/Plasma";
import { PLASMA_FRAGMENT, PLASMA_INTRO_SECONDS, PLASMA_MAX_VOLUME_PIXELS, PLASMA_VOLUME } from "@src/surface/backgrounds/glow/plasma-shader";
import { mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";
import { feedbackSize } from "@src/surface/backdrop/kernel/feedback";

const BASE: PlasmaSettings = { direction: "reverse", scale: 1, twist: 1, wave: 1, softness: 0.25, shine: 1, brightness: 1, intro: true };

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

/** 宿主量成 cssWidth x cssHeight (像素比 1), 假 webgl2 记下每次 texImage2D 的宽高. */
function sizedWebgl2(cssWidth: number, cssHeight: number): { sizes: Array<readonly [number, number]>; undo: () => void } {
  const sizes: Array<readonly [number, number]> = [];
  const original = HTMLCanvasElement.prototype.getContext;
  const gl = new Proxy({}, {
    get: (_target, key) => (...args: unknown[]) => {
      if (key === "texImage2D") sizes.push([Number(args[3]), Number(args[4])]);
      return {};
    },
  });
  HTMLCanvasElement.prototype.getContext = function getContext(kind: string) {
    return kind === "webgl2" ? gl : null;
  } as typeof original;
  const box = { width: cssWidth, height: cssHeight, x: 0, y: 0, top: 0, left: 0, right: cssWidth, bottom: cssHeight, toJSON: () => ({}) };
  const rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(box as DOMRect);
  return {
    sizes,
    undo: () => {
      HTMLCanvasElement.prototype.getContext = original;
      rect.mockRestore();
    },
  };
}

describe("Plasma 纯函数", () => {
  it("规格常数", () => {
    expect([PLASMA_INTRO_SECONDS, PLASMA_MAX_VOLUME_PIXELS]).toEqual([1.6, 1600000]);
    expect(PLASMA_FRAGMENT).toContain(`uniform sampler2D ${PLASMA_VOLUME}`);
    expect(PLASMA_FRAGMENT).toContain("float level = 1.0 - exp(-peak);");
    expect(PLASMA_FRAGMENT).toContain("float hot = smoothstep(1.0, 3.0, peak);");
  });

  it("弹簧把视角带向指针并最终停住, 热点升温; 离开后回正", () => {
    const rig = createPlasmaRig();
    const pointer = { ...createPointerState(), x: 1, y: 0.5, inside: true };
    for (let i = 0; i < 300; i += 1) stepPlasmaRig(rig, { dt: 1 / 60, pointer }, true);
    expect(rig.yaw).toBeCloseTo(0.25, 3);
    expect(rig.heat).toBeGreaterThan(0.99);
    expect(rig.heatX).toBeCloseTo(1, 3);
    for (let i = 0; i < 300; i += 1) stepPlasmaRig(rig, { dt: 1 / 60, pointer: { ...pointer, inside: false } }, true);
    expect(Math.abs(rig.yaw)).toBeLessThan(1e-3);
    expect(rig.heat).toBeLessThan(0.01);
  });

  it("quality 钳到 0.1..1, 方向反转, softness 换锐度, 入场 1.6 秒", () => {
    expect([plasmaVolumeScale(0), plasmaVolumeScale(0.75), plasmaVolumeScale(2)]).toEqual([0.1, 0.75, 1]);
    const v = plasmaVolumeUniforms(createPlasmaRig(), BASE);
    expect([v.u_dir, v.u_sharpness]).toEqual([-1, 0.75]);
    const u = plasmaUniforms({ colors: [], elapsed: 0.8 }, createPlasmaRig(), BASE);
    expect(u.u_intro).toBeCloseTo(0.5, 6);
    expect(u.u_heat).toEqual([0.5, 0.5, 0]);
  });

  it("体积像素按 MAX_VOLUME_PIXELS 封顶: 大画布收倍率, 小画布只按 quality", () => {
    const capped = plasmaVolumeScale(0.75, 2400, 1600);
    expect(capped).toBeLessThan(0.75);
    const [w, h] = feedbackSize(2400, 1600, capped);
    expect(w * h).toBeLessThanOrEqual(PLASMA_MAX_VOLUME_PIXELS);
    expect(w * h).toBeGreaterThan(PLASMA_MAX_VOLUME_PIXELS * 0.99);
    expect(plasmaVolumeScale(0.75, 1280, 720)).toBe(0.75);
    expect(plasmaVolumeScale(1, 0, 0)).toBe(1);
  });
});

describe("Plasma 渲染", () => {
  it("体积通道的缓冲按这次 resize 的画布尺寸封顶", () => {
    const gl = sizedWebgl2(2400, 1600);
    restore.push(gl.undo, mockReducedMotion(true));
    render(<Plasma data-testid="host" />);
    const [w, h] = gl.sizes[gl.sizes.length - 1];
    expect(w * h).toBeLessThanOrEqual(PLASMA_MAX_VOLUME_PIXELS);
    expect(w * h).toBeGreaterThan(PLASMA_MAX_VOLUME_PIXELS * 0.99);
  });

  it("WebGL2 可用时 live, 每帧先跑体积通道再上屏", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    const { getByTestId } = render(<Plasma data-testid="host" />);
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
    const { getByTestId } = render(<Plasma data-testid="host" />);
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
    const { getByTestId } = render(<Plasma data-testid="host" />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
