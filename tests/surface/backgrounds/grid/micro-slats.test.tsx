/**
 * MicroSlats: 规格常数, 浪况预设与覆盖, 墨迹留存, 流体注入 (指针, 点击射流, 静态帧), 五个离屏通道的调度, 减弱动效与兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BackdropFrame } from "@src/surface/backdrop/kernel";
import { createPointerState } from "@src/surface/backdrop/kernel";
import { MicroSlats, slatsFallback } from "@src/surface/backgrounds/grid/MicroSlats";
import {
  createSlatFluidDrive, inkKeep, MAX_SPLATS, MICRO_SLATS_FLUID, SLAT_INK_PASS, SLAT_VELOCITY_PASS, stepSlatFluid,
} from "@src/surface/backgrounds/grid/micro-slats-fluid";
import { MICRO_SLATS, MICRO_SLATS_FRAGMENT, resolveSwell, SWELL_PRESETS } from "@src/surface/backgrounds/grid/micro-slats-shader";
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
const opts = { interactive: true, strength: 1, size: 40 };
function frameAt(elapsed: number, still = false): BackdropFrame {
  return { time: elapsed, dt: still ? 0 : 1 / 60, elapsed, fit: { width: 1920, height: 1080, scale: 1 }, pointer: createPointerState(), colors: [], reduced: still, still };
}

describe("MicroSlats 纯函数", () => {
  it("规格常数与着色器接线", () => {
    expect([MICRO_SLATS_FLUID.size, MICRO_SLATS_FLUID.pressureSteps, MICRO_SLATS_FLUID.splatForce, MICRO_SLATS_FLUID.splashJets]).toEqual([96, 16, 6900, 3]);
    expect(MICRO_SLATS.pixelBudget).toBe(4.5e6);
    expect(MICRO_SLATS_FLUID.size / 1920).toBeCloseTo(MICRO_SLATS_FLUID.scale, 6);
    expect(MAX_SPLATS).toBe(4);
    expect(SLAT_VELOCITY_PASS).toContain("uniform sampler2D u_curl;");
    expect(SLAT_INK_PASS).toContain("u_splat_ink[4]");
    expect(MICRO_SLATS_FRAGMENT).toContain("uniform sampler2D u_ink;");
  });

  it("浪况预设, 显式项覆盖, 未知名落到 swell", () => {
    expect(Object.keys(SWELL_PRESETS)).toEqual(["swell", "chop", "storm", "glass"]);
    expect(resolveSwell("storm", {})).toEqual(SWELL_PRESETS.storm);
    expect(resolveSwell("storm", { chop: 0.1, fog: undefined })).toMatchObject({ chop: 0.1, fog: SWELL_PRESETS.storm.fog });
    expect(resolveSwell("nope", {})).toEqual(SWELL_PRESETS.swell);
  });

  it("墨迹按 trail 时间常数衰减, 静态帧不衰减", () => {
    expect(inkKeep(1.4, 1.4)).toBeCloseTo(Math.exp(-1), 9);
    expect(inkKeep(1.4, 0)).toBe(1);
    expect(inkKeep(0, 0.016)).toBe(0);
  });

  it("指针移动推一笔, 静态帧与关闭交互不注入", () => {
    const frame = frameAt(2);
    Object.assign(frame.pointer, { inside: true, x: 0.3, y: 0.6, vx: 1, vy: 0 });
    const f = stepSlatFluid(createSlatFluidDrive(), frame, opts);
    expect(f.count).toBe(1);
    expect(f.splats[0]).toBeCloseTo(0.3, 6);
    expect(f.splats[2]).toBeGreaterThan(0);
    expect(f.radius).toBeCloseTo((40 * MICRO_SLATS_FLUID.scale) / 2, 6);
    expect(stepSlatFluid(createSlatFluidDrive(), { ...frame, dt: 0, still: true }, opts).count).toBe(0);
    expect(stepSlatFluid(createSlatFluidDrive(), frame, { ...opts, interactive: false }).count).toBe(0);
  });

  it("新点击喷三道射流, 同一次点击不重复", () => {
    const drive = createSlatFluidDrive();
    const frame = frameAt(2);
    frame.pointer.taps.push({ x: 0.5, y: 0.5, at: 1.9 });
    const f = stepSlatFluid(drive, frame, opts);
    expect(f.count).toBe(3);
    const speeds = [0, 1, 2].map((i) => Math.hypot(f.splats[i * 4 + 2], f.splats[i * 4 + 3]));
    speeds.forEach((s) => expect(s).toBeCloseTo(MICRO_SLATS_FLUID.jetSpeed, 4));
    expect(stepSlatFluid(drive, frame, opts).count).toBe(0);
  });

  it("兜底竖百叶", () => {
    const bg = slatsFallback("primary", "background", 10, 3);
    expect(bg).toContain("var(--primary)");
    expect(bg).toContain("10px 13px");
  });
});

describe("MicroSlats 渲染", () => {
  it("每帧跑涡量, 速度, 散度, 16 次压力, 墨迹, 再上屏", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container } = render(<MicroSlats preset="storm" swirl={0.5} perspective={0.6} />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const delta = draws(calls) - before;
    expect(delta).toBeGreaterThan(0);
    expect(delta % (MICRO_SLATS_FLUID.pressureSteps + 5)).toBe(0);
  });

  it("减弱动效只画一帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const { container } = render(<MicroSlats reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    expect(before).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(draws(calls)).toBe(before);
  });

  it("拿不到 webgl2 时铺百叶兜底", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<MicroSlats />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
