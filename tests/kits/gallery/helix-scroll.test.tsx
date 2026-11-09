/**
 * kits/gallery: HelixScroll (规格 InfiniteSpiral). 螺旋姿态, 循环, 边缘渐隐模糊, 自动前进, 悬停暂停, 减弱动效.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HELIX_DEFAULTS, HelixScroll, helixAdvance, helixPose, type HelixLook } from "@src/kits/gallery/HelixScroll";
import { manualFrames, mockReducedMotion } from "../support";

const look: HelixLook = { count: 10, spacing: 60, perTurn: 7, half: 260, edgeFade: 0.3, edgeBlur: 6, centerScale: 1.2 };
const items = Array.from({ length: 10 }, (_, i) => ({ image: `/img/${i}.jpg`, alt: `P${i}` }));
const yOf = (i: number): number => {
  const node = document.querySelectorAll<HTMLElement>("[data-slot='helix-scroll-card']")[i] as HTMLElement;
  return Number.parseFloat(node.style.transform.split("translateY(")[1] ?? "0");
};

afterEach(() => vi.restoreAllMocks());

describe("helixPose", () => {
  it("中央: 不转, 不淡, 不糊, 放大到 centerScale", () => {
    expect(helixPose(0, 0, look)).toEqual({ y: 0, deg: 0, opacity: 1, blur: 0, scale: 1.2 });
  });

  it("每张高一个间距, 转 360 / cardsPerTurn 度; 整条循环", () => {
    const p = helixPose(1, 0, look);
    expect(p.y).toBe(60);
    expect(p.deg).toBeCloseTo(360 / 7, 9);
    expect(helixPose(9, 0, look).y).toBe(-60);
    expect(helixPose(0, 600, look).y).toBe(0);
  });

  it("边缘: 半高处完全透明, 模糊到 edgeBlur; 渐隐只在外侧 30%", () => {
    const edge = helixPose(0, -260, { ...look, count: 20 });
    expect(edge.opacity).toBe(0);
    expect(edge.blur).toBe(6);
    expect(helixPose(0, -150, { ...look, count: 20 }).opacity).toBe(1);
  });

  it("自动速度按 60fps 每帧 px", () => {
    expect(helixAdvance(0.55, 1000)).toBeCloseTo(33, 9);
  });
});

describe("HelixScroll", () => {
  it("自动模式向上前进, 悬停暂停", () => {
    const frames = manualFrames();
    const { container } = render(<HelixScroll items={items} speed={1} />);
    expect(yOf(1)).toBe(HELIX_DEFAULTS.verticalSpacing);
    act(() => frames.flush(10));
    const moved = yOf(1);
    expect(moved).toBeLessThan(60);
    fireEvent.mouseEnter(container.firstElementChild as HTMLElement);
    act(() => frames.flush(10));
    expect(yOf(1)).toBe(moved);
  });

  it("向下时反向", () => {
    const frames = manualFrames();
    render(<HelixScroll items={items} speed={1} direction="down" />);
    act(() => frames.flush(10));
    expect(yOf(1)).toBeGreaterThan(60);
  });

  it("减弱动效: 自动模式不动", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    render(<HelixScroll items={items} />);
    act(() => frames.flush(10));
    expect(yOf(1)).toBe(60);
  });
});
