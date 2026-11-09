/**
 * kits/gallery: SpringCarousel (规格 Carousel). 环上偏移, 松手落点, 翻页弹簧, 拖拽, 自动播放暂停, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SpringCarousel, releaseTarget, slideOffset } from "@src/kits/gallery/SpringCarousel";
import { manualFrames, mockReducedMotion } from "../support";

const slides = ["One", "Two", "Three", "Four"].map((label) => ({ label, content: <span>{label}</span> }));
const shift = (i: number): number => {
  const node = document.querySelectorAll<HTMLElement>("[data-slot='spring-carousel-slide']")[i] as HTMLElement;
  return Number.parseFloat(node.style.transform.replace("translateX(", ""));
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("SpringCarousel 纯函数", () => {
  it("循环时取环上最近偏移", () => {
    expect(slideOffset(3, 0, 4, true)).toBe(-1);
    expect(slideOffset(3, 0, 4, false)).toBe(3);
    expect(slideOffset(1, 0.5, 4, true)).toBe(0.5);
  });

  it("松手: 位移过 20% 或速度过 0.3px/ms 才翻页", () => {
    expect(releaseTarget(2, -50, 0, 400)).toBe(2);
    expect(releaseTarget(2, -100, 0, 400)).toBe(3);
    expect(releaseTarget(2, 10, 0.5, 400)).toBe(1);
  });
});

describe("SpringCarousel 交互", () => {
  it("下一页: 弹簧把当前页送到 -100%, 下一页到 0; 指示点跟着走", () => {
    const frames = manualFrames();
    const onIndexChange = vi.fn();
    render(<SpringCarousel slides={slides} onIndexChange={onIndexChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    frames.flush(120);
    expect(shift(0)).toBeCloseTo(-100, 0);
    expect(shift(1)).toBeCloseTo(0, 0);
    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(screen.getByRole("button", { name: "Two" }).getAttribute("aria-current")).toBe("true");
  });

  it("循环: 从第一页往前到最后一页; 不循环时上一页禁用", () => {
    const frames = manualFrames();
    const { unmount } = render(<SpringCarousel slides={slides} />);
    fireEvent.keyDown(document.querySelector("[tabindex='0']") as HTMLElement, { key: "ArrowLeft" });
    frames.flush(120);
    expect(shift(3)).toBeCloseTo(0, 0);
    unmount();
    render(<SpringCarousel slides={slides} loop={false} />);
    expect((screen.getByRole("button", { name: "Previous slide" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("自动播放按间隔翻页, 悬停时暂停", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    manualFrames();
    const onIndexChange = vi.fn();
    const { container } = render(<SpringCarousel slides={slides} autoplay autoplayDelay={1000} onIndexChange={onIndexChange} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    fireEvent.mouseEnter(container.firstElementChild as HTMLElement);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onIndexChange).toHaveBeenCalledTimes(1);
  });

  it("减弱动效: 直接落到下一页", () => {
    mockReducedMotion(true);
    manualFrames();
    render(<SpringCarousel slides={slides} />);
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(shift(1)).toBe(0);
  });
});
