/**
 * field 族: ChromeMark (MetallicPaint). 遮罩栅格化, 倾斜与入场, 着色器接线, 通道调度.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHROME, ChromeMark, chromeSource, makeChrome, maskSize, rasterPath, rasterText, stepChrome } from "@src/surface/field";
import { CHROME_BUMP_PASS, CHROME_FRAGMENT } from "@src/surface/field/parts/chrome-shader";
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
const draws = (calls: string[]): number => calls.filter((c) => c === "drawArrays").length;

describe("ChromeMark 纯函数", () => {
  it("规格常数与默认值", () => {
    expect(CHROME).toMatchObject({ workingSize: 512, timeRate: 0.3, timeOffset: 2.8, thin1: 0.12, thin2: 0.07, density: 2, softness: 0.1, dispersion: 0.3, distortion: 0.07, edgeBend: 0.6, angle: 70, scale: 0.6, mouseTilt: 0.5, fontWeight: 800 });
    expect(maskSize(2, 512)).toEqual([512, 256]);
    expect(maskSize(0.5, 512)).toEqual([256, 512]);
    expect(chromeSource(100, 0.6)).toBeCloseTo(4 / 900, 9);
  });
  it("倾斜跟指针, 离开回零; 入场走满", () => {
    const s = makeChrome(true);
    let a = 0;
    for (let i = 0; i < 120; i += 1) a = stepChrome(s, 1 / 60, 0, 1, { x: 1, inside: true });
    expect(a).toBeCloseTo(CHROME.tiltMax, 2);
    expect(s.intro).toBe(1);
    for (let i = 0; i < 120; i += 1) a = stepChrome(s, 1 / 60, 90, 1, { x: 1, inside: false });
    expect(a).toBeCloseTo(Math.PI / 2, 2);
  });
  it("遮罩栅格化: 有 2d 上下文时出画布, 没有时为 null", () => {
    expect(rasterText("HX", "serif", 800, 512)).toBeNull();
    const calls: string[] = [];
    restore.push(recordCanvas2d(calls));
    const m = rasterText("HX", "serif", 800, 512);
    expect(m?.canvas.width).toBeGreaterThan(0);
    expect(calls).toContain("fillText");
    if (typeof Path2D !== "undefined") expect(rasterPath("M0 0L10 0L10 10Z", [10, 10], 64)?.aspect).toBe(1);
  });
  it("着色器接线", () => {
    expect(CHROME_BUMP_PASS).toContain("uniform sampler2D u_mask;");
    expect(CHROME_FRAGMENT).toContain("maskUv");
  });
});

describe("ChromeMark 渲染", () => {
  it("每帧 24 次隆起迭代再上屏; 减弱动效一次 240 次只画一帧; 没有 WebGL2 时兜底", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container, unmount } = render(<ChromeMark text="HX" />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => vi.advanceTimersByTime(160));
    const delta = draws(calls) - before;
    expect(delta).toBeGreaterThan(0);
    expect(delta % (CHROME.bumpSteps + 1)).toBe(0);
    unmount();
    const still: string[] = [];
    restore.push(mockWebgl2(still));
    const { unmount: u2 } = render(<ChromeMark text="HX" reducedMotion />);
    const once = draws(still);
    expect(once % (CHROME.bumpStillSteps + 1)).toBe(0);
    act(() => vi.advanceTimersByTime(300));
    expect(draws(still)).toBe(once);
    u2();
    restore.push(recordCanvas2d([]));
    const { container: c3 } = render(<ChromeMark text="HX" />);
    expect((c3.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("fallback");
  });
});
