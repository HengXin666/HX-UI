/**
 * kits/gallery: DriftColumns (规格 DriftWall). 列速度, 趋近时间常数, 取模, 漂移, 悬停停列, 上浮与变淡, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DriftColumns, driftBase, driftSpeedStep, driftWrap } from "@src/kits/gallery/DriftColumns";
import { manualFrames, mockReducedMotion } from "../support";

const items = Array.from({ length: 8 }, (_, i) => ({ image: `/img/${i}.jpg`, alt: `Card ${i}`, title: `T${i}` }));
const ty = (c: number): number => {
  const node = document.querySelectorAll<HTMLElement>("[data-slot='drift-columns-track']")[c] as HTMLElement;
  return Number.parseFloat(node.style.transform.replace("translateY(", "") || "0");
};

afterEach(() => vi.restoreAllMocks());

describe("DriftColumns 纯函数", () => {
  it("列速度错开, alternate 时奇数列反向", () => {
    expect(driftBase(0, 30, true)).toBe(30);
    expect(driftBase(1, 30, true)).toBe(-24);
    expect(driftBase(1, 30, false)).toBe(24);
  });

  it("减速 160ms, 回速 280ms 时间常数", () => {
    expect(driftSpeedStep(10, 0, 160)).toBeCloseTo(10 * Math.exp(-1), 9);
    expect(driftSpeedStep(0, 10, 280)).toBeCloseTo(10 * (1 - Math.exp(-1)), 9);
  });

  it("偏移按一份内容高取模到 (-span, 0]", () => {
    expect(driftWrap(-250, 200)).toBe(-50);
    expect(driftWrap(30, 200)).toBe(-170);
    expect(driftWrap(-30, 0)).toBe(-30);
  });
});

describe("DriftColumns 交互", () => {
  it("列持续漂移, 第二列反向; 悬停一列后该列停下", () => {
    const frames = manualFrames();
    render(<DriftColumns items={items} columns={2} speed={60} />);
    act(() => frames.flush(30));
    expect(ty(0)).toBeLessThan(-1);
    expect(ty(1)).toBeGreaterThan(1);
    fireEvent.mouseEnter(screen.getAllByRole("button", { name: "Card 0" })[0] as HTMLElement);
    act(() => frames.flush(120));
    const a = ty(0);
    act(() => frames.flush(30));
    expect(Math.abs(ty(0) - a)).toBeLessThan(0.05);
    expect(Math.abs(ty(1))).toBeGreaterThan(1);
  });

  it("悬停卡片上浮, 其余变淡, 过渡 420ms", () => {
    manualFrames();
    render(<DriftColumns items={items} columns={2} />);
    const [hot] = screen.getAllByRole("button", { name: "Card 2" });
    fireEvent.mouseEnter(hot as HTMLElement);
    expect((hot as HTMLElement).style.transform).toBe("translateY(-4px) scale(1.02)");
    expect((screen.getAllByRole("button", { name: "Card 1" })[0] as HTMLElement).style.opacity).toBe("0.55");
    expect((hot as HTMLElement).style.transition).toContain("transform 420ms cubic-bezier(0.22, 1, 0.36, 1)");
  });

  it("减弱动效: 不漂移, 无过渡", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    render(<DriftColumns items={items} columns={2} speed={60} />);
    act(() => frames.flush(30));
    expect(ty(0)).toBe(0);
    expect((screen.getAllByRole("button", { name: "Card 0" })[0] as HTMLElement).style.transition).toBe("none");
  });
});
