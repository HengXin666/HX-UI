/**
 * kits/stack: FlowMasonry (规格 Masonry). 断点, 最短列落位, 起点, 揭开缓出, 弹簧换算, 入场, 换位, 减弱动效.
 */
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FlowMasonry, autoColumns, fromOffset, masonryLayout, revealEase } from "@src/kits/stack/FlowMasonry";
import { omegaSpring } from "@src/kits/tokens";
import { masonrySpring } from "@src/kits/stack/parts/masonry-spec";
import { fakeIntersection, manualFrames, mockReducedMotion } from "../support";

const items = [1, 0.5, 1.5, 1].map((ratio, i) => ({ id: `p${i}`, image: `/${i}.jpg`, alt: `P${i}`, ratio }));
const cell = (i: number): HTMLElement => document.querySelectorAll<HTMLElement>("[data-slot='flow-masonry-item']")[i] as HTMLElement;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("FlowMasonry 纯函数", () => {
  it("列数断点", () => {
    expect(autoColumns(1600)).toBe(5);
    expect(autoColumns(700)).toBe(3);
    expect(autoColumns(300)).toBe(1);
  });

  it("依次放进最矮的一列", () => {
    const { cells, height } = masonryLayout([1, 0.5, 1.5, 1], 2, 210, 10);
    expect(cells.map((c) => [c.x, c.y])).toEqual([
      [0, 0],
      [110, 0],
      [110, 60],
      [0, 110],
    ]);
    expect(height).toBe(210);
  });

  it("起点偏移, 揭开缓出, 弹簧 omega = 2pi / duration", () => {
    expect(fromOffset("bottom", 0)).toEqual([0, 80]);
    expect(fromOffset("left", 3)).toEqual([-80, 0]);
    expect(revealEase(0.5)).toBeCloseTo(0.875, 9);
    expect(masonrySpring(0.6)).toEqual(omegaSpring((Math.PI * 2) / 0.6, 1));
  });
});

function mount(width: number, reduce = false): ReturnType<typeof manualFrames> {
  if (reduce) mockReducedMotion(true);
  const frames = manualFrames();
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(width);
  return frames;
}

describe("FlowMasonry 交互", () => {
  it("从下方飞入并错峰揭开, 最终在格位上不透明", () => {
    const frames = mount(210);
    const io = fakeIntersection();
    render(<FlowMasonry items={items} columns={2} gap={10} />);
    act(() => frames.flush(5));
    expect(cell(0).style.opacity).toBe("0");
    act(() => io.fire([screen.getByRole("list")], true));
    act(() => frames.flush(2));
    expect(cell(0).style.transform).toMatch(/translate3d\(0px, [1-9]/);
    expect(Number(cell(3).style.opacity)).toBe(0);
    expect(cell(0).style.filter).toMatch(/blur/);
    act(() => frames.flush(200));
    expect(cell(2).style.transform).toBe("translate3d(110px, 60px, 0)");
    expect(cell(2).style.opacity).toBe("1");
    expect(cell(2).style.filter).toBe("");
  });

  it("点击回调该项; 无链接时是按钮", () => {
    mount(210);
    const click = vi.fn();
    render(<FlowMasonry items={items} columns={2} onItemClick={click} />);
    screen.getByRole("button", { name: "P1" }).click();
    expect(click).toHaveBeenCalledWith(items[1]);
  });

  it("减弱动效: 直接在位且不透明", () => {
    mount(210, true);
    render(<FlowMasonry items={items} columns={2} gap={10} />);
    expect(cell(3).style.transform).toBe("translate3d(0px, 110px, 0)");
    expect(cell(3).style.opacity).toBe("1");
  });
});
