/**
 * AeroShards: 撒片, 弹簧回家, 按住聚拢, 点击推开, 点击环与投影排序的纯函数, WebGL2 渲染, 兜底与减弱动效静帧.
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AeroShards } from "@src/surface/backgrounds/particles/AeroShards";
import {
  AERO, MARKER_STYLES, makeShards, packShards, pulseShards, ringList, scaleAt, shardIntro, shardStiffness, stepShards,
} from "@src/surface/backgrounds/particles/aero-shards-field";
import { AERO_SHARDS_FRAGMENT } from "@src/surface/backgrounds/particles/aero-shards-shader";
import { mockWebgl2 } from "../../backdrop/helpers";
import { mockReducedMotion, recordCanvas2d, useFakeClock } from "../../helpers";

afterEach(() => {
  vi.useRealTimers();
});

const OPTS = { count: 24, aspect: 1.6, spread: 1, size: 1, placement: "full" as const, seed: 7 };
const IDLE = { time: 0, hold: 0, px: 0, py: 0, presence: 0, mouseStrength: 0.6, billow: 0, twist: 1 };

describe("AeroShards 纯函数", () => {
  it("规格常数与片元源码", () => {
    expect([AERO.floats, AERO.camera, AERO.focus, AERO.shardFocus, AERO.maxBank, AERO.introSeconds]).toEqual([24, 4, 3.1, 2.75, 1, 3.4]);
    expect([AERO.markerFloats, AERO.maxRings, AERO.ringSeconds, AERO.bloomLevels, AERO.substep]).toEqual([8, 4, 2.6, 4, 1 / 120]);
    expect([MARKER_STYLES.plus, MARKER_STYLES.dots]).toEqual([0, 1]);
    expect(shardStiffness(0)).toBe(24);
    expect(shardStiffness(1)).toBeCloseTo(24 * 0.05, 9);
    expect(scaleAt(0)).toBeCloseTo(3.1 / 4, 9);
    expect(AERO_SHARDS_FRAGMENT).toContain("uniform vec4 u_sa[24]");
    expect(AERO_SHARDS_FRAGMENT).toContain("uniform vec4 u_rings[4]");
  });

  it("撒片可复现, 数量钳到 FLOATS, 摆位决定横向区间", () => {
    const a = makeShards(OPTS);
    const b = makeShards(OPTS);
    expect(a.length).toBe(24);
    expect(a.map((s) => s.hx)).toEqual(b.map((s) => s.hx));
    expect(makeShards({ ...OPTS, count: 999 }).length).toBe(24);
    expect(makeShards({ ...OPTS, placement: "left" }).every((s) => s.hx < 0)).toBe(true);
    expect(makeShards({ ...OPTS, placement: "right" }).every((s) => s.hx > 0)).toBe(true);
  });

  it("弹簧把推开的碎片拉回家, 横滚不超过 MAX_BANK", () => {
    const shards = makeShards({ ...OPTS, count: 3 });
    shards[0].vx = 40;
    stepShards(shards, 0.05, IDLE);
    expect(Math.abs(shards[0].bank)).toBeLessThanOrEqual(AERO.maxBank);
    expect(Math.abs(shards[0].bank)).toBeGreaterThan(0);
    for (let i = 0; i < 400; i += 1) stepShards(shards, 1 / 60, IDLE);
    expect(Math.hypot(shards[0].x - shards[0].hx, shards[0].y - shards[0].hy)).toBeLessThan(0.05);
  });

  it("按住: gather 以 0.3s 升起, 碎片聚向指针; 松开以 0.2s 落回", () => {
    const shards = makeShards(OPTS);
    const spreadOf = (): number => shards.reduce((sum, s) => sum + Math.hypot(s.x * scaleAt(s.z) - 0.3, s.y * scaleAt(s.z) - 0.2), 0);
    const before = spreadOf();
    stepShards(shards, 0.05, { ...IDLE, hold: 1, px: 0.3, py: 0.2 });
    expect(shards[0].gather).toBeCloseTo(1 - Math.exp(-0.05 / 0.3), 9);
    for (let i = 0; i < 300; i += 1) stepShards(shards, 1 / 60, { ...IDLE, hold: 1, px: 0.3, py: 0.2 });
    expect(shards[0].gather).toBeGreaterThan(0.99);
    expect(spreadOf()).toBeLessThan(before * 0.5);
    const g = shards[0].gather;
    stepShards(shards, 0.05, IDLE);
    expect(shards[0].gather).toBeCloseTo(g * Math.exp(-0.05 / 0.2), 9);
  });

  it("点击冲量向外推开半径内的碎片", () => {
    const shards = makeShards({ ...OPTS, count: 1 });
    const s = shards[0];
    const sc = scaleAt(s.z);
    pulseShards(shards, s.x * sc - 0.1, s.y * sc);
    expect(s.vx).toBeGreaterThan(0);
    const far = makeShards({ ...OPTS, count: 1 });
    pulseShards(far, far[0].x * scaleAt(far[0].z) + 5, 0);
    expect(far[0].vx).toBe(0);
  });

  it("点击环只留寿命内最近 4 个; 投影按远到近排序, 入场由 0 升到 1", () => {
    const taps = [0, 1, 2, 3, 4, 5].map((i) => ({ x: 0.5, y: 0.5, at: i * 0.2 }));
    const rings = ringList(taps, 1.2);
    expect(Array.from(rings.filter((_, i) => i % 4 === 3))).toEqual([1, 1, 1, 1]);
    expect(rings[2]).toBeCloseTo((1.2 - 0.4) / 2.6, 6);
    expect(ringList([{ x: 0, y: 0, at: 0 }], 3)[3]).toBe(0);
    const packed = packShards(makeShards(OPTS), { camX: 0, camY: 0, elapsed: Infinity, intro: true });
    expect(packed.count).toBe(24);
    for (let i = 1; i < packed.count; i += 1) expect(packed.a[i * 4 + 2]).toBeLessThanOrEqual(packed.a[(i - 1) * 4 + 2]);
    expect(shardIntro(0.5, 0, true)).toBe(0);
    expect(shardIntro(0.5, AERO.introSeconds, true)).toBe(1);
    expect(shardIntro(0.5, 0, false)).toBe(1);
  });
});

describe("AeroShards 渲染", () => {
  it("WebGL2 可用时 live 并持续出帧", () => {
    useFakeClock();
    const calls: string[] = [];
    const restore = mockWebgl2(calls);
    const { container } = render(<AeroShards />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(200));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before);
    restore();
  });

  it("拿不到 webgl2 时走 CSS 兜底", () => {
    const restore = recordCanvas2d([]);
    const { container } = render(<AeroShards backgroundColor="background" />);
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
    const { container } = render(<AeroShards markers="dots" material="frosted" />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = calls.filter((c) => c === "drawArrays").length;
    expect(before).toBeGreaterThan(0);
    act(() => vi.advanceTimersByTime(500));
    expect(calls.filter((c) => c === "drawArrays").length).toBe(before);
    restoreMotion();
    restore();
  });
});
