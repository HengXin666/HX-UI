/**
 * 背景内核的纯函数: 像素比钳制, 画布尺寸, 颜色解析, uniform 映射, 指针换算, 运行方式判定.
 */
import { describe, expect, it } from "vitest";
import {
  approach, atlasGrid, BACKDROP_DPR_CAP, BACKDROP_MAX_TAPS, clampDpr, createPointerState, cssColorOf, fallbackGradient, feedbackSize, fitCanvas,
  kernelUniforms, oklchToRgb, shaderKey, parseColor, planRun, pushTap, seedOf, stepPointer, TAP_LIFETIME, toLocal, uniformData, uniformKind,
} from "@src/surface/backdrop/kernel";

describe("clampDpr / fitCanvas", () => {
  it("取设备值与上限的较小者, 坏值按 1", () => {
    expect(clampDpr(3)).toBe(BACKDROP_DPR_CAP);
    expect(clampDpr(1.5)).toBe(1.5);
    expect(clampDpr(3, 1)).toBe(1);
    expect(clampDpr(Number.NaN)).toBe(1);
    expect(clampDpr(0)).toBe(1);
    expect(clampDpr(2, -4)).toBe(BACKDROP_DPR_CAP);
  });
  it("最长边超限时按比例降采样, 至少 1 像素", () => {
    expect(fitCanvas(400, 300, 2)).toEqual({ width: 800, height: 600, scale: 2 });
    const big = fitCanvas(2000, 1000, 2, 2400);
    expect(big.width).toBe(2400);
    expect(big.height).toBe(1200);
    expect(big.scale).toBeCloseTo(1.2);
    expect(fitCanvas(0, 0, 2)).toEqual({ width: 1, height: 1, scale: 2 });
  });
  it("指数逼近与帧率无关, tau 为 0 时直接落到目标", () => {
    const one = approach(0, 1, 0.1, 0.2);
    const two = approach(approach(0, 1, 0.05, 0.2), 1, 0.05, 0.2);
    expect(two).toBeCloseTo(one, 10);
    expect(approach(3, 7, 0.016, 0)).toBe(7);
  });
});

describe("颜色", () => {
  it("裸标识符读成语义 token, 其余原样", () => {
    expect(cssColorOf("primary")).toBe("var(--primary)");
    expect(cssColorOf("accent-2")).toBe("var(--accent-2)");
    expect(cssColorOf("--done")).toBe("var(--done)");
    expect(cssColorOf("color-mix(in srgb, red 50%, blue)")).toBe("color-mix(in srgb, red 50%, blue)");
  });
  it("解析十六进制, rgb, oklch 与 color(srgb)", () => {
    expect(parseColor("#ff0000")).toEqual([1, 0, 0]);
    expect(parseColor("#0f08")).toEqual([0, 1, 0]);
    const rgb = parseColor("rgb(51, 102, 255)");
    expect(rgb?.[0]).toBeCloseTo(0.2);
    expect(rgb?.[2]).toBeCloseTo(1);
    expect(parseColor("rgba(0 0 0 / 0.5)")).toEqual([0, 0, 0]);
    expect(parseColor("color(srgb 0.25 0.5 0.75)")).toEqual([0.25, 0.5, 0.75]);
    const white = parseColor("oklch(100% 0 0)");
    white?.forEach((c) => expect(c).toBeCloseTo(1, 3));
    expect(parseColor("var(--primary)")).toBeNull();
    expect(parseColor("#12")).toBeNull();
  });
  it("oklch 换算: 黑为 0, 蓝色相的蓝通道最大", () => {
    oklchToRgb(0, 0, 0).forEach((c) => expect(c).toBeCloseTo(0, 5));
    const [r, g, b] = oklchToRgb(0.6, 0.15, 255);
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });
  it("兜底渐变只写 var 与用户色值", () => {
    expect(fallbackGradient([])).toBe("var(--background)");
    expect(fallbackGradient(["primary"])).toBe("var(--primary)");
    expect(fallbackGradient(["primary", "accent-2"], 90)).toBe("linear-gradient(90deg, var(--primary), var(--accent-2))");
  });
});

describe("uniform 映射", () => {
  it("由值的形状推断写入函数", () => {
    expect(uniformKind(1)).toBe("1f");
    expect(uniformKind(true)).toBe("1f");
    expect(uniformKind([1, 2])).toBe("2f");
    expect(uniformKind([1, 2, 3])).toBe("3f");
    expect(uniformKind([1, 2, 3, 4])).toBe("4f");
    expect(uniformKind([1, 2, 3, 4, 5])).toBeNull();
    expect(uniformKind({ list: [1, 2, 3, 4, 5, 6], size: 3 })).toBe("3fv");
    expect(uniformKind(undefined)).toBeNull();
    expect(Array.from(uniformData(false))).toEqual([0]);
  });
  it("内核 uniform: 画布, 时钟, 指针与有效点击", () => {
    const pointer = createPointerState();
    pointer.x = 0.25;
    pointer.down = true;
    pointer.taps = [{ x: 0.1, y: 0.2, at: 1 }, { x: 0.3, y: 0.4, at: 9 }, { x: 0.5, y: 0.5, at: 20 }];
    const u = kernelUniforms({ fit: { width: 300, height: 200, scale: 2 }, time: 4, elapsed: 10 }, pointer);
    expect(u.u_res).toEqual([300, 200]);
    expect(u.u_dpr).toBe(2);
    expect(u.u_pointer).toEqual([0.25, 0.5, 0, 1]);
    expect(u.u_tap_count).toBe(1);
    const taps = u.u_taps as { list: Float32Array };
    expect(taps.list).toHaveLength(BACKDROP_MAX_TAPS * 4);
    expect(Array.from(taps.list.slice(0, 4))).toEqual([expect.closeTo(0.3), expect.closeTo(0.4), 1, 1]);
  });
  it("多通道的渲染器身份随任一片元源码变化", () => {
    const one = shaderKey({ fragment: "a", passes: [{ name: "u_trail", fragment: "b" }] });
    expect(shaderKey({ fragment: "a", passes: [{ name: "u_trail", fragment: "b" }] })).toBe(one);
    expect(shaderKey({ fragment: "a", passes: [{ name: "u_trail", fragment: "c" }] })).not.toBe(one);
    expect(shaderKey({ fragment: "a" })).not.toBe(one);
  });
  it("减弱动效的静态帧 (elapsed 无穷) 不带点击", () => {
    const pointer = createPointerState();
    pointer.taps = [{ x: 0.5, y: 0.5, at: 0 }];
    expect(kernelUniforms({ fit: { width: 1, height: 1, scale: 1 }, time: 8, elapsed: Number.POSITIVE_INFINITY }, pointer).u_tap_count).toBe(0);
  });
});

describe("指针", () => {
  it("视口坐标换成 y 朝上的归一化坐标", () => {
    expect(toLocal(150, 50, { left: 100, top: 0, width: 100, height: 200 })).toEqual([0.5, 0.75]);
    expect(toLocal(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toEqual([0.5, 0.5]);
  });
  it("点击队列满了丢最旧的", () => {
    let taps = pushTap([], { x: 0, y: 0, at: 0 });
    for (let i = 1; i <= BACKDROP_MAX_TAPS; i += 1) taps = pushTap(taps, { x: i, y: 0, at: i });
    expect(taps).toHaveLength(BACKDROP_MAX_TAPS);
    expect(taps[0].x).toBe(1);
  });
  it("在场程度平滑逼近, 过期点击出队", () => {
    const p = createPointerState();
    p.inside = true;
    p.taps = [{ x: 0, y: 0, at: 0 }];
    stepPointer(p, 0.1, TAP_LIFETIME + 1);
    expect(p.presence).toBeGreaterThan(0);
    expect(p.presence).toBeLessThan(1);
    expect(p.taps).toHaveLength(0);
  });
});

describe("调度与杂项", () => {
  it("离屏或隐藏不画, 减弱动效或暂停只画一帧", () => {
    expect(planRun({ inView: true, pageHidden: false, reduced: false, paused: false })).toBe("animate");
    expect(planRun({ inView: false, pageHidden: false, reduced: false, paused: false })).toBe("idle");
    expect(planRun({ inView: true, pageHidden: true, reduced: true, paused: false })).toBe("idle");
    expect(planRun({ inView: true, pageHidden: false, reduced: true, paused: false })).toBe("still");
    expect(planRun({ inView: true, pageHidden: false, reduced: false, paused: true })).toBe("still");
  });
  it("状态缓冲, 图集行列与种子", () => {
    expect(feedbackSize(801, 401, 0.5)).toEqual([401, 201]);
    expect(feedbackSize(10, 10, 0)).toEqual([10, 10]);
    expect(atlasGrid(10)).toEqual([4, 3]);
    const seed = seedOf("hx");
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(1);
    expect(seedOf("hx")).toBe(seed);
  });
});
