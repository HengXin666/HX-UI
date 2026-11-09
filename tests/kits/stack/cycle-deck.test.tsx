/**
 * kits/stack: CycleDeck (规格 CardSwap). 槽位, 错峰, 甩出判定, 视差归一, 自动轮换, 键盘, 点击, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CycleDeck, swapPointer, swapShouldCycle, swapSlot, swapStagger } from "@src/kits/stack/CycleDeck";
import { manualFrames, mockReducedMotion } from "./support";

const cards = ["A", "B", "C"].map((label) => ({ label, content: <span>{label}</span> }));
const card = (i: number): HTMLElement => document.querySelectorAll<HTMLElement>("[data-slot='cycle-deck-card']")[i] as HTMLElement;

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] }));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("CycleDeck 纯函数", () => {
  it("槽位向右上与向后错开, 乘张开度", () => {
    expect(swapSlot(2, 60, 70, 1)).toEqual({ x: 120, y: -140, z: -180 });
    expect(swapSlot(1, 60, 70, 1.15).x).toBeCloseTo(69, 9);
  });

  it("错峰 0.05 / speed; 甩出看短边 0.3 或 700px/s", () => {
    expect(swapStagger(2)).toBeCloseTo(0.025, 9);
    expect(swapShouldCycle(0, 79, 0, 360, 260)).toBe(true);
    expect(swapShouldCycle(0, 77, 0, 360, 260)).toBe(false);
    expect(swapShouldCycle(0, 10, 701, 360, 260)).toBe(true);
  });

  it("指针归一到 [-1, 1]", () => {
    expect(swapPointer(0, 130, 360, 260)).toEqual([-1, 0]);
    expect(swapPointer(10, 10, 0, 0)).toEqual([0, 0]);
  });
});

describe("CycleDeck 交互", () => {
  it("自动轮换: 前牌落出, 450ms 后排到最后并回调", () => {
    const frames = manualFrames();
    const change = vi.fn();
    render(<CycleDeck cards={cards} delay={1000} onChange={change} />);
    act(() => frames.flush(60));
    expect(card(1).style.transform).toContain("translate3d(60px, -70px, -90px)");
    act(() => vi.advanceTimersByTime(1000));
    act(() => frames.flush(10));
    expect(card(0).style.transform).toMatch(/translate3d\(0px, [1-9]/);
    act(() => vi.advanceTimersByTime(450));
    expect(change).toHaveBeenCalledWith(1);
    expect(card(0).style.zIndex).toBe("1");
    act(() => frames.flush(400));
    expect(card(1).style.transform).toContain("translate3d(0px, 0px, 0px)");
  });

  it("悬停暂停自动轮换; Enter 手动换牌; 点击回调序号", () => {
    manualFrames();
    const change = vi.fn();
    const click = vi.fn();
    render(<CycleDeck cards={cards} delay={1000} onChange={change} onCardClick={click} />);
    const group = screen.getByRole("group");
    fireEvent.mouseEnter(group);
    act(() => vi.advanceTimersByTime(3000));
    expect(change).not.toHaveBeenCalled();
    fireEvent.keyDown(group, { key: "Enter" });
    act(() => vi.advanceTimersByTime(450));
    expect(change).toHaveBeenCalledWith(1);
    fireEvent.click(card(2));
    expect(click).toHaveBeenCalledWith(2);
  });

  it("减弱动效: 不自动轮换, 换牌直接到位", () => {
    mockReducedMotion(true);
    manualFrames();
    const change = vi.fn();
    render(<CycleDeck cards={cards} delay={1000} onChange={change} />);
    act(() => vi.advanceTimersByTime(3000));
    expect(change).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("group"), { key: "ArrowRight" });
    expect(change).toHaveBeenCalledWith(1);
    expect(card(1).style.transform).toContain("translate3d(0px, 0px, 0px)");
  });
});
