/**
 * kits/gallery: BendGallery (规格 CircularGallery). 跟随系数, 圆弧摆放, 方向键, 滚轮吸附, 点选, 自动滚动, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BendGallery, arcPlace, followFactor } from "@src/kits/gallery/BendGallery";
import { manualFrames, mockReducedMotion } from "../support";

const items = ["A", "B", "C", "D", "E"].map((label) => ({ label, title: label, image: `/img/${label}.jpg` }));
const xOf = (i: number): number => {
  const node = document.querySelectorAll<HTMLElement>("[data-slot='bend-gallery-card']")[i] as HTMLElement;
  return Number.parseFloat(node.style.transform.split("translate(")[2] ?? "0");
};
const region = (): HTMLElement => screen.getByRole("region");

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("BendGallery 纯函数", () => {
  it("跟随系数与帧率无关: 两个 8ms 等于一个 16ms", () => {
    const one = followFactor(0.05, 16.6667);
    expect(one).toBeCloseTo(0.05, 3);
    const half = followFactor(0.05, 8.3333);
    expect(1 - (1 - half) * (1 - half)).toBeCloseTo(one, 6);
  });

  it("圆弧: 中心不动, 两侧对称下沉并转向; bend 0 为直线", () => {
    expect(arcPlace(0, 900, 3)).toEqual({ dy: 0, deg: 0 });
    const r = arcPlace(150, 900, 3);
    const l = arcPlace(-150, 900, 3);
    expect(r.dy).toBeCloseTo(300 - Math.sqrt(300 * 300 - 150 * 150), 6);
    expect(r.deg).toBeCloseTo(30, 6);
    expect(l.deg).toBeCloseTo(-30, 6);
    expect(arcPlace(-150, 900, -3).dy).toBeLessThan(0);
    expect(arcPlace(100, 900, 0)).toEqual({ dy: 0, deg: 0 });
  });
});

describe("BendGallery 交互", () => {
  it("方向键推一项, 位置按跟随追上, 当前项回调", () => {
    const frames = manualFrames();
    const onActiveChange = vi.fn();
    render(<BendGallery items={items} cardWidth={100} gap={0} onActiveChange={onActiveChange} />);
    expect(xOf(1)).toBeCloseTo(100, 6);
    fireEvent.keyDown(region(), { key: "ArrowRight" });
    act(() => frames.flush(20));
    expect(xOf(1)).toBeGreaterThan(0);
    act(() => frames.flush(400));
    expect(xOf(1)).toBeCloseTo(0, 1);
    expect(onActiveChange).toHaveBeenLastCalledWith(1);
  });

  it("滚轮停下后吸附到整数项", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const frames = manualFrames();
    render(<BendGallery items={items} cardWidth={100} gap={0} />);
    fireEvent.wheel(region(), { deltaY: 100 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => frames.flush(400));
    expect(xOf(1)).toBeCloseTo(0, 1);
  });

  it("点卡片转到它并回调", () => {
    const frames = manualFrames();
    const onItemClick = vi.fn();
    render(<BendGallery items={items} cardWidth={100} gap={0} onItemClick={onItemClick} />);
    fireEvent.click(screen.getByRole("button", { name: "E" }));
    act(() => frames.flush(400));
    expect(xOf(4)).toBeCloseTo(0, 1);
    expect(onItemClick).toHaveBeenCalledWith(4);
  });

  it("自动滚动持续推进; 减弱动效时不动且直接跳", () => {
    const frames = manualFrames();
    const { unmount } = render(<BendGallery items={items} cardWidth={100} gap={0} autoScroll={4} />);
    act(() => frames.flush(60));
    expect(xOf(0)).toBeLessThan(-1);
    unmount();
    mockReducedMotion(true);
    render(<BendGallery items={items} cardWidth={100} gap={0} autoScroll={4} />);
    act(() => frames.flush(60));
    expect(xOf(0)).toBe(0);
    fireEvent.keyDown(region(), { key: "ArrowRight" });
    expect(xOf(1)).toBe(0);
  });
});
