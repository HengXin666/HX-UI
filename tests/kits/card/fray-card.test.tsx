/**
 * kits/card: FrayCard (规格 DecayCard). 目标侵蚀, 频率, 位移量, 快划变碎再复原, 平移, scope, 减弱动效.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FrayCard, frayFrequency, frayScale, frayWanted } from "@src/kits/card/FrayCard";
import { boxOf, manualFrames, mockReducedMotion } from "./support";

const card = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='fray-card']") as HTMLElement;
const scale = (): number => Number(document.querySelector("feDisplacementMap")?.getAttribute("scale"));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("FrayCard 纯函数", () => {
  it("目标侵蚀 = 速度项 + 悬停 + 呼吸, 钳 0..1", () => {
    expect(frayWanted(2000, 0.5, false, 0.05, 0, 0)).toBe(0.5);
    expect(frayWanted(0, 0.5, true, 0.05, 0, 0)).toBe(0.05);
    expect(frayWanted(99999, 1, true, 0.05, 0, 0)).toBe(1);
    expect(frayWanted(0, 0.5, false, 0, 0.4, 1)).toBeCloseTo(0.06, 9);
  });

  it("频率与位移量", () => {
    expect(frayFrequency(4, 0, 0)).toBeCloseTo(0.016, 9);
    expect(frayScale(1, 0.5)).toBe(30);
    expect(frayScale(2, 0.5)).toBe(30);
  });
});

describe("FrayCard 交互", () => {
  it("快划变碎, 停下按 recovery 复原; 图片反向平移", () => {
    const frames = manualFrames();
    let now = 1;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    render(<FrayCard image="a.png" idle={0} hoverDecay={0} />);
    boxOf(card(), 0, 0, 300, 400);
    fireEvent.pointerMove(window, { clientX: 0, clientY: 200 });
    now = 11;
    fireEvent.pointerMove(window, { clientX: 300, clientY: 200 });
    act(() => frames.flush(5));
    expect(scale()).toBeGreaterThan(5);
    act(() => frames.flush(400));
    expect(scale()).toBe(0);
    const img = document.querySelector<HTMLElement>("[data-slot='fray-card-image']") as HTMLElement;
    expect(img.style.transform).toBe("translate(-25.00px, 0.00px) rotate(2.50deg) scale(1.24)");
  });

  it("scope card: 窗口上的指针不算", () => {
    const frames = manualFrames();
    render(<FrayCard image="a.png" scope="card" idle={0} />);
    boxOf(card(), 0, 0, 300, 400);
    fireEvent.pointerMove(window, { clientX: 300, clientY: 200 });
    act(() => frames.flush(100));
    const img = document.querySelector<HTMLElement>("[data-slot='fray-card-image']") as HTMLElement;
    expect(img.style.transform).toBe("translate(0.00px, 0.00px) rotate(0.00deg) scale(1.24)");
  });

  it("减弱动效: 不位移不平移", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    let now = 1;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    render(<FrayCard image="a.png" />);
    boxOf(card(), 0, 0, 300, 400);
    fireEvent.pointerMove(window, { clientX: 0, clientY: 0 });
    now = 11;
    fireEvent.pointerMove(window, { clientX: 300, clientY: 0 });
    act(() => frames.flush(5));
    expect(scale()).toBe(0);
  });
});
