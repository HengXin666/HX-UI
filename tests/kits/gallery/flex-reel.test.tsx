/**
 * kits/gallery: FlexReel (规格 FlexCarousel). 分模式弹簧, 能量升降, 弯折姿态, 方向键与点选, 滚轮吸附, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FLEX_SPRING, FlexReel, flexEnergyStep, flexEnergyTarget, flexPose } from "@src/kits/gallery/FlexReel";
import { manualFrames, mockReducedMotion } from "../support";

const items = ["A", "B", "C", "D", "E"].map((label) => ({ label, image: `/img/${label}.jpg` }));
const tf = (i: number): string => (document.querySelectorAll<HTMLElement>("[data-slot='flex-reel-card']")[i] as HTMLElement).style.transform;
const xOf = (i: number): number => Number.parseFloat(tf(i).split("translateX(")[1] ?? "0");
const degOf = (i: number): number => Number.parseFloat(tf(i).split("rotateY(")[1] ?? "0");

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("FlexReel 纯函数", () => {
  it("弹簧按规格分模式且临界阻尼", () => {
    expect(FLEX_SPRING.snap).toEqual({ stiffness: 55, damping: 2 * Math.sqrt(55), mass: 1 });
    expect(FLEX_SPRING.wheel.stiffness).toBe(80);
  });

  it("能量上升快回落慢", () => {
    expect(flexEnergyStep(0, 1, 70)).toBeCloseTo(1 - Math.exp(-1), 9);
    expect(flexEnergyStep(1, 0, 350)).toBeCloseTo(Math.exp(-1), 9);
    expect(flexEnergyTarget(-12)).toBe(1);
  });

  it("弯折: 无能量不转; 越靠边转得越多, 朝运动反方向", () => {
    expect(flexPose(1, 0, 1)).toEqual({ deg: -0, scale: 1 });
    expect(Math.abs(flexPose(2, 1, 1).deg)).toBeGreaterThan(Math.abs(flexPose(0, 1, 1).deg));
    expect(flexPose(0, 1, 1).deg).toBeLessThan(0);
  });
});

describe("FlexReel 交互", () => {
  it("方向键: 卡带走一张, 途中两侧转向, 停下舒展回平", () => {
    const frames = manualFrames();
    const onActiveChange = vi.fn();
    render(<FlexReel items={items} cardWidth={100} gap={0} onActiveChange={onActiveChange} />);
    fireEvent.keyDown(screen.getByRole("region"), { key: "ArrowRight" });
    act(() => frames.flush(12));
    expect(Math.abs(degOf(2))).toBeGreaterThan(1);
    act(() => frames.flush(240));
    expect(xOf(1)).toBeCloseTo(0, 1);
    expect(Math.abs(degOf(2))).toBeLessThan(0.1);
    expect(onActiveChange).toHaveBeenLastCalledWith(1);
  });

  it("点卡片走最短路; 滚轮停下吸附", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const frames = manualFrames();
    const onItemClick = vi.fn();
    render(<FlexReel items={items} cardWidth={100} gap={0} onItemClick={onItemClick} />);
    fireEvent.click(screen.getByRole("button", { name: "E" }));
    act(() => frames.flush(240));
    expect(xOf(4)).toBeCloseTo(0, 1);
    expect(onItemClick).toHaveBeenCalledWith(4);
    fireEvent.wheel(screen.getByRole("region"), { deltaY: 100 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => frames.flush(240));
    expect(xOf(0)).toBeCloseTo(0, 1);
  });

  it("减弱动效: 直接到位, 不转", () => {
    mockReducedMotion(true);
    manualFrames();
    render(<FlexReel items={items} cardWidth={100} gap={0} />);
    fireEvent.keyDown(screen.getByRole("region"), { key: "ArrowRight" });
    expect(xOf(1)).toBe(0);
    expect(degOf(2)).toBe(0);
  });
});
