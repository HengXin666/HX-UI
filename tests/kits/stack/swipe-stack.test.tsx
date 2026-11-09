/**
 * kits/stack: SwipeStack (规格 Stack). 槽位, 甩出判定, 离场方向, 倾斜, 换序, 键盘送牌, 拖拽, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SwipeStack, exitVector, leanDeg, rotateOrder, shouldSend, slotPose } from "@src/kits/stack/SwipeStack";
import { manualFrames, mockReducedMotion } from "./support";

const cards = ["A", "B", "C"].map((label) => ({ label, content: <span>{label}</span> }));
const card = (i: number): HTMLElement => document.querySelectorAll<HTMLElement>("[data-slot='swipe-stack-card']")[i] as HTMLElement;

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] }));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("SwipeStack 纯函数", () => {
  it("fan: 顶层不转, 末层转到 -tilt × spread; 超出 visible 隐去", () => {
    expect(slotPose("fan", 0, 4, 0.5, 0.5, 30, 0).rotate).toBe(0);
    expect(slotPose("fan", 3, 4, 0.5, 0.5, 30, 0).rotate).toBeCloseTo(-15, 9);
    expect(slotPose("fan", 4, 4, 0.5, 0.5, 30, 0).opacity).toBe(0);
    expect(slotPose("deck", 2, 4, 0.5, 0.5, 30, 0).y).toBeCloseTo(-28, 9);
  });

  it("送牌: 过 90px 或超过 650px/s, 只剩一张不送", () => {
    expect(shouldSend(91, 0, 0, 90, 3)).toBe(true);
    expect(shouldSend(10, 0, 651, 90, 3)).toBe(true);
    expect(shouldSend(50, 0, 100, 90, 3)).toBe(false);
    expect(shouldSend(200, 0, 0, 90, 1)).toBe(false);
  });

  it("离场方向: 有拖拽按拖拽, 否则按布局; 倾斜在 260px 满幅", () => {
    expect(exitVector("deck")).toEqual([0, 1]);
    const [x, y] = exitVector("fan", -30, 40);
    expect([x, y]).toEqual([-0.6, 0.8]);
    expect(leanDeg(520)).toBe(12);
    expect(leanDeg(-130)).toBe(-6);
  });

  it("换序: 顶牌送底, 底牌抽回", () => {
    expect(rotateOrder([0, 1, 2], 1)).toEqual([1, 2, 0]);
    expect(rotateOrder([0, 1, 2], -1)).toEqual([2, 0, 1]);
  });
});

describe("SwipeStack 交互", () => {
  it("方向键送牌: 先飞出, 350ms 后回到底部并回调新顶牌", () => {
    const frames = manualFrames();
    const change = vi.fn();
    render(<SwipeStack cards={cards} layout="deck" onChange={change} />);
    act(() => frames.flush(60));
    fireEvent.keyDown(screen.getByRole("group"), { key: "ArrowRight" });
    act(() => frames.flush(10));
    expect(card(0).style.transform).toMatch(/translate\(0px, [1-9]\d*/);
    act(() => vi.advanceTimersByTime(350));
    expect(change).toHaveBeenCalledWith(1);
    expect(card(1).style.zIndex).toBe("3");
    expect(card(0).style.zIndex).toBe("1");
  });

  it("拖过阈值松手送牌, 未过阈值弹回", () => {
    const frames = manualFrames();
    const change = vi.fn();
    render(<SwipeStack cards={cards} onChange={change} />);
    act(() => frames.flush(60));
    // jsdom 的事件 timeStamp 恒为 0, 换成手动帧时钟, 让拖拽速度可控
    vi.spyOn(Event.prototype, "timeStamp", "get").mockImplementation(() => performance.now());
    const top = card(0);
    fireEvent.pointerDown(top, { pointerId: 1, button: 0, clientX: 0, clientY: 0 });
    act(() => frames.flush(30));
    fireEvent.pointerMove(top, { pointerId: 1, clientX: 40, clientY: 0 });
    act(() => frames.flush(30));
    fireEvent.pointerUp(top, { pointerId: 1, clientX: 40, clientY: 0 });
    act(() => frames.flush(120));
    act(() => vi.advanceTimersByTime(400));
    expect(change).not.toHaveBeenCalled();
    expect(top.style.transform).toContain("translate(0px, 0px)");
    fireEvent.pointerDown(top, { pointerId: 2, button: 0, clientX: 0, clientY: 0 });
    act(() => frames.flush(30));
    fireEvent.pointerMove(top, { pointerId: 2, clientX: 140, clientY: 0 });
    act(() => frames.flush(30));
    fireEvent.pointerUp(top, { pointerId: 2, clientX: 140, clientY: 0 });
    act(() => vi.advanceTimersByTime(400));
    expect(change).toHaveBeenCalledWith(1);
  });

  it("减弱动效: 送牌立即换序", () => {
    mockReducedMotion(true);
    manualFrames();
    const change = vi.fn();
    render(<SwipeStack cards={cards} onChange={change} />);
    fireEvent.keyDown(screen.getByRole("group"), { key: "Enter" });
    expect(change).toHaveBeenCalledWith(1);
    expect(card(1).style.zIndex).toBe("3");
  });
});
