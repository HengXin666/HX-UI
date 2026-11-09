/**
 * kits/gallery: PosterFlight (规格 FlyingPosters). 循环位置, 姿态与轴, 平滑, 斜切, 滚轮跟随, 多列反向, 倾斜, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PosterFlight, posterPose, posterSkew, posterY, smoothRate } from "@src/kits/gallery/PosterFlight";
import { manualFrames, mockReducedMotion } from "../support";

const items = Array.from({ length: 6 }, (_, i) => ({ image: `/img/${i}.jpg`, alt: `Poster ${i}` }));
const tf = (i: number): string => (document.querySelectorAll<HTMLElement>("[data-slot='poster-flight-poster']")[i] as HTMLElement).style.transform;
const yOf = (i: number): number => Number.parseFloat((tf(i).split("translate(")[2] ?? "").split(",")[1] ?? "0");

afterEach(() => vi.restoreAllMocks());

describe("PosterFlight 纯函数", () => {
  it("循环位置落在 (-total/2, total/2]", () => {
    expect(posterY(0, 0, 1000)).toBe(0);
    expect(posterY(800, 0, 1000)).toBe(-200);
    expect(posterY(0, 300, 1000)).toBe(-300);
  });

  it("姿态: 进度从 -1 到 1 转过 rotation, 轴可选; fade 只淡外侧", () => {
    expect(posterPose(320, 320, 180, "vertical", 0)).toEqual({ rotate: "rotateY(90deg)", opacity: 1 });
    expect(posterPose(-160, 320, 180, "horizontal", 0).rotate).toBe("rotateX(-45deg)");
    expect(posterPose(160, 320, 180, "diagonal", 0).rotate).toBe("rotateX(45deg) rotateY(45deg)");
    expect(posterPose(320, 320, 180, "vertical", 0.3).opacity).toBe(0);
    expect(posterPose(100, 320, 180, "vertical", 0.3).opacity).toBe(1);
  });

  it("平滑按速率指数靠近; 斜切随速度并限幅", () => {
    expect(smoothRate(0, 1, 8, 125)).toBeCloseTo(1 - Math.exp(-1), 9);
    expect(posterSkew(400, 3)).toBe(3);
    expect(posterSkew(1e6, 3)).toBe(20);
  });
});

describe("PosterFlight 交互", () => {
  it("滚轮推目标, 位置按 scrollEase 慢慢追上并带斜切", () => {
    const frames = manualFrames();
    render(<PosterFlight items={items} planeHeight={100} gap={0} scrollEase={0.1} />);
    fireEvent.wheel(screen.getByRole("region"), { deltaY: 100 });
    act(() => frames.flush(5));
    expect(yOf(1)).toBeLessThan(100);
    expect(yOf(1)).toBeGreaterThan(0);
    expect(tf(1)).not.toContain("skewY(0deg)");
    act(() => frames.flush(400));
    expect(yOf(1)).toBeCloseTo(0, 0);
  });

  it("两列且 alternate 时第二列反向", () => {
    const frames = manualFrames();
    render(<PosterFlight items={items} columns={2} planeHeight={100} gap={0} scrollEase={1} />);
    fireEvent.wheel(screen.getByRole("region"), { deltaY: 50 });
    act(() => frames.flush(2));
    expect(yOf(0)).toBe(-50);
    expect(yOf(1)).toBe(50);
  });

  it("点选回调; 自动滚动前进", () => {
    const frames = manualFrames();
    const onItemClick = vi.fn();
    render(<PosterFlight items={items} planeHeight={100} gap={0} speed={100} onItemClick={onItemClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Poster 2" }));
    expect(onItemClick).toHaveBeenCalledWith(2);
    act(() => frames.flush(60));
    expect(yOf(0)).toBeLessThan(0);
  });

  it("减弱动效: 直接跳到目标, 无斜切, 不自动滚", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    render(<PosterFlight items={items} planeHeight={100} gap={0} speed={100} />);
    act(() => frames.flush(30));
    expect(yOf(0)).toBe(0);
    fireEvent.wheel(screen.getByRole("region"), { deltaY: 100 });
    expect(yOf(1)).toBe(0);
    expect(tf(1)).toContain("skewY(0deg)");
  });
});
