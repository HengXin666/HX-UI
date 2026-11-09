/**
 * kits/card: PixelBloom (规格 PixelCard). 布点与延迟, 出现与退场, 聚光趋近, 尺寸, 悬停揭开, 点击切换, 入场, 绘制, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PixelBloom, buildField, pixelSize, stepField, stepSpot } from "@src/kits/card/PixelBloom";
import { boxOf, manualFrames, mockReducedMotion } from "./support";

const card = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='pixel-bloom']") as HTMLElement;
let rects = 0;

beforeEach(() => {
  rects = 0;
  const ctx = { clearRect: vi.fn(), fillRect: () => (rects += 1), setTransform: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), globalAlpha: 1, fillStyle: "" };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(100);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(50);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("PixelBloom 像素场", () => {
  it("按间距布点; 原点处延迟最小, 最远处接近 revealDuration", () => {
    const f = buildField(100, 50, 10, "left", 600);
    expect(f.cols).toBe(10);
    expect(f.rows).toBe(5);
    const near = f.delay[2 * 10] ?? 0;
    const far = f.delay[2 * 10 + 9] ?? 0;
    expect(near).toBeLessThan(0.1);
    expect(far).toBeGreaterThan(0.45);
    expect(far).toBeLessThanOrEqual(0.6);
  });

  it("出现 0.26s, 退场 0.22s, 过了延迟才动", () => {
    const f = buildField(20, 20, 10, "center", 0);
    expect(stepField(f, true, 0, 0.13)).toBe(true);
    expect(f.level[0]).toBeCloseTo(0.5, 5);
    stepField(f, true, 0.2, 0.2);
    expect(f.level[0]).toBe(1);
    expect(stepField(f, true, 0.3, 0.1)).toBe(false);
    stepField(f, false, 0, 0.11);
    expect(f.level[0]).toBeCloseTo(0.5, 5);
  });

  it("聚光升 6/s 降 3/s; 尺寸随出现程度与聚光", () => {
    expect(stepSpot(0, 1, 0.1)).toBeCloseTo(1 - Math.exp(-0.6), 9);
    expect(stepSpot(1, 0, 0.1)).toBeCloseTo(Math.exp(-0.3), 9);
    expect(pixelSize(2, 1, 1, 1, 0.5)).toBe(3);
    expect(pixelSize(2, 0, 1, 1, 0.5)).toBe(0);
  });
});

describe("PixelBloom 交互", () => {
  it("悬停揭开并画出像素, 离开收起", () => {
    const frames = manualFrames();
    render(<PixelBloom intro={false} ariaLabel="px" />);
    expect(card().dataset.active).toBe("false");
    fireEvent.pointerEnter(card());
    act(() => frames.flush(80));
    expect(card().dataset.active).toBe("true");
    expect(rects).toBeGreaterThan(0);
    expect(card().style.boxShadow).toContain("var(--primary)");
    fireEvent.pointerLeave(card());
    expect(card().dataset.active).toBe("false");
  });

  it("click: 按钮语义, 点击或键盘切换", () => {
    manualFrames();
    render(<PixelBloom trigger="click" intro={false} ariaLabel="px" />);
    const btn = screen.getByRole("button", { name: "px" });
    fireEvent.pointerDown(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("intro: 过 introDelay 揭开, 揭完收起", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    manualFrames();
    render(<PixelBloom introDelay={100} />);
    act(() => vi.advanceTimersByTime(100));
    expect(card().dataset.active).toBe("true");
    act(() => vi.advanceTimersByTime(900));
    expect(card().dataset.active).toBe("false");
  });

  it("减弱动效: 无入场, 悬停直接全显", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    boxOf(document.body, 0, 0, 100, 50);
    render(<PixelBloom />);
    expect(card().dataset.active).toBe("false");
    fireEvent.pointerEnter(card());
    act(() => frames.flush(2));
    expect(rects).toBeGreaterThan(0);
  });
});
