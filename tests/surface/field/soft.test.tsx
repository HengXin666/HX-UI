/**
 * field 族: SoftShape (ShapeBlur). 距离变换, 透镜状态, 着色器接线, 渲染与兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SOFT, SoftShape, edt1d, encodeDistance, makeSoft, signedDistance, softIdlePath, stepSoft } from "@src/surface/field";
import { SOFT_BLUR_H, SOFT_BLUR_V, SOFT_FRAGMENT, SOFT_SHAPE_PASS } from "@src/surface/field/parts/soft-shader";
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

describe("SoftShape 距离场", () => {
  it("规格常数与默认值", () => {
    expect(SOFT).toMatchObject({ field: 512, pad: 0.35, far: 1e20, followActive: 10, followIdle: 3, powerRate: 4, sides: 6, size: 0.8, roundness: 0.2, thickness: 2, echoes: 1, spacing: 12, blur: 16, lensSize: 0.3, lensSoftness: 0.7, chroma: 0.3 });
  });
  it("一维平方距离变换", () => {
    const f = new Float64Array([SOFT.far, SOFT.far, 0, SOFT.far, SOFT.far, SOFT.far]);
    expect(Array.from(edt1d(f))).toEqual([4, 1, 0, 1, 4, 9]);
  });
  it("有符号距离: 外正内负, 中心最深; 编码对称", () => {
    const w = 9;
    const inside = new Uint8Array(w * w);
    for (let y = 2; y <= 6; y += 1) for (let x = 2; x <= 6; x += 1) inside[y * w + x] = 1;
    const sd = signedDistance(inside, w, w);
    expect(sd[4 * w + 4]).toBeCloseTo(-2.5, 6);
    expect(sd[0]).toBeCloseTo(Math.hypot(2, 2) - 0.5, 6);
    expect(sd[4 * w + 1]).toBeCloseTo(0.5, 6);
    expect(encodeDistance(0, 10)).toEqual([128, 0]);
    expect(encodeDistance(99, 10)).toEqual([255, 255]);
  });
  it("透镜在场跟手, 闲置漂移, 自转取模", () => {
    const s = makeSoft();
    for (let i = 0; i < 120; i += 1) stepSoft(s, 1 / 60, 90, true, 1, { x: 0.2, y: 0.8, inside: true });
    expect(s.x).toBeCloseTo(0.2, 2);
    expect(s.power).toBeGreaterThan(0.95);
    expect(s.angle).toBeCloseTo(180, 3);
    for (let i = 0; i < 600; i += 1) stepSoft(s, 1 / 60, 90, false, 1, { x: 0.2, y: 0.8, inside: false });
    expect(s.power).toBeLessThan(0.05);
    expect(softIdlePath(0, 1)[0]).toBe(0.5);
  });
  it("着色器接线", () => {
    expect(SOFT_FRAGMENT).toContain("sdPolygon");
    expect(SOFT_FRAGMENT).toContain("texelFetch(u_field");
  });
  it("真高斯失焦: 形状遍 -> 横向 -> 纵向, 上屏按透镜插值", () => {
    expect(SOFT_SHAPE_PASS).toContain("coverage(d - shift, 0.0), coverage(d, 0.0), coverage(d + shift, 0.0)");
    expect(SOFT_BLUR_H).toContain("uniform sampler2D u_soft_shape;");
    expect(SOFT_BLUR_V).toContain("uniform sampler2D u_soft_h;");
    expect(SOFT_BLUR_H).toContain("exp(-0.5 * x * x / (sigma * sigma))");
    expect(SOFT_FRAGMENT).toContain("texture(u_soft_v, v_uv)");
    expect(SOFT_FRAGMENT).toContain("mix(vec3(coverage(d, 0.0)), blurred, t)");
  });
});

describe("SoftShape 渲染", () => {
  it("每帧三遍离屏 (形状, 横向, 纵向) 加一遍上屏; 减弱动效只画一帧; 没有 WebGL2 时兜底", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container, unmount } = render(<SoftShape shape="polygon" echoes={3} />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = calls.filter((c) => c === "drawArrays").length;
    act(() => vi.advanceTimersByTime(160));
    expect(calls.filter((c) => c === "drawArrays").length).toBeGreaterThan(before + 12);
    unmount();
    const still: string[] = [];
    restore.push(mockWebgl2(still));
    const { container: c2, unmount: u2 } = render(<SoftShape reducedMotion />);
    expect((c2.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    u2();
    restore.push(recordCanvas2d([]));
    const { container: c3 } = render(<SoftShape />);
    expect((c3.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("fallback");
  });
});
