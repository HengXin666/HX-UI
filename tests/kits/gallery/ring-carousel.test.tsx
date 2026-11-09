/**
 * kits/gallery: RingCarousel (规格 CircularCarousel). 角度与当前项, 最近目标, 半径, 巡航, 滚轮与方向键, 点选, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RING_SPRING, RingCarousel, cruiseVelocity, ringActive, ringRadius, ringTarget } from "@src/kits/gallery/RingCarousel";
import { manualFrames, mockReducedMotion } from "../support";

const items = ["A", "B", "C", "D", "E", "F"].map((label) => ({ label, title: label, image: `/img/${label}.jpg` }));
const ringAngle = (): number => {
  const node = document.querySelector<HTMLElement>("[data-slot='ring-carousel-ring']") as HTMLElement;
  return Number.parseFloat(node.style.transform.split("rotateY(")[1] ?? "0");
};

afterEach(() => vi.restoreAllMocks());

describe("RingCarousel 纯函数", () => {
  it("临界阻尼: damping = 2 sqrt(118)", () => {
    expect(RING_SPRING.damping).toBeCloseTo(2 * Math.sqrt(118), 9);
  });

  it("角度换当前项, 目标走最短路", () => {
    expect(ringActive(-60, 6)).toBe(1);
    expect(ringActive(60, 6)).toBe(5);
    expect(ringTarget(0, 5, 6)).toBe(60);
    expect(ringTarget(-300, 0, 6)).toBe(-360);
  });

  it("半径让卡片不重叠, 不小于 1.2 倍卡宽", () => {
    expect(ringRadius(12, 200, 20)).toBeCloseTo(220 / (2 * Math.tan(Math.PI / 12)), 6);
    expect(ringRadius(6, 200, 20)).toBe(240);
    expect(ringRadius(2, 200, 20)).toBe(240);
  });

  it("巡航速度按时间常数靠向目标", () => {
    expect(cruiseVelocity(0, 12, 600)).toBeCloseTo(12 * (1 - Math.exp(-1)), 9);
  });
});

describe("RingCarousel 交互", () => {
  it("方向键转一项, 标题与回调跟上", () => {
    const frames = manualFrames();
    const onIndexChange = vi.fn();
    render(<RingCarousel items={items} onIndexChange={onIndexChange} />);
    fireEvent.keyDown(document.querySelector("[tabindex='0']") as HTMLElement, { key: "ArrowRight" });
    act(() => frames.flush(120));
    expect(ringAngle()).toBeCloseTo(-60, 1);
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    expect(document.querySelector("[data-slot='ring-carousel-title']")?.textContent).toBe("B");
  });

  it("点卡片走最短路转到它; 滚轮一次一项", () => {
    const frames = manualFrames();
    render(<RingCarousel items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "F" }));
    frames.flush(120);
    expect(ringAngle()).toBeCloseTo(60, 1);
    fireEvent.wheel(document.querySelector("[tabindex='0']") as HTMLElement, { deltaY: 40 });
    frames.flush(120);
    expect(ringAngle()).toBeCloseTo(0, 1);
  });

  it("巡航时角度持续减小, 一按键就停并吸附", () => {
    const frames = manualFrames();
    render(<RingCarousel items={items} cruise cruiseSpeed={30} />);
    frames.flush(60);
    const a = ringAngle();
    expect(a).toBeLessThan(-5);
    fireEvent.keyDown(document.querySelector("[tabindex='0']") as HTMLElement, { key: "ArrowLeft" });
    frames.flush(200);
    expect(Math.abs(ringAngle() % 60)).toBeLessThan(0.01);
  });

  it("减弱动效: 不巡航, 直接转到位", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    render(<RingCarousel items={items} cruise />);
    frames.flush(30);
    expect(ringAngle()).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    expect(ringAngle()).toBe(-120);
  });
});
