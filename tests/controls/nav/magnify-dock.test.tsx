/**
 * nav/dock: MagnifyDock (规格 Dock). 放大曲线, 弹簧夹取, 起跳帧, 选中, 长按, 漫游焦点, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DOCK_HOLD_MS, DOCK_HOP, DOCK_SPRING, MagnifyDock, dockSpring, hopFrames, magnifySize } from "@src/controls/nav/dock/MagnifyDock";
import { cssCurve } from "@src/motion/curves";
import { manualFrames, mockReducedMotion, spyAnimate } from "./support";

const items = ["a", "b", "c"].map((id) => ({ id, label: id.toUpperCase(), icon: <span>{id}</span> }));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("MagnifyDock 纯函数", () => {
  it("余弦钟形: 中心为 magnified, 半径外为 size, 对称", () => {
    expect(magnifySize(0, 48, 72, 140)).toBe(72);
    expect(magnifySize(140, 48, 72, 140)).toBe(48);
    expect(magnifySize(70, 48, 72, 140)).toBeCloseTo(60, 6);
    expect(magnifySize(-30, 48, 72, 140)).toBe(magnifySize(30, 48, 72, 140));
    expect(magnifySize(0, 48, 72, 0)).toBe(48);
  });

  it("弹簧夹取下限, 缺项取规格默认", () => {
    expect(dockSpring()).toEqual(DOCK_SPRING);
    expect(dockSpring({ mass: 0, stiffness: 0, damping: -1 })).toEqual({ mass: 0.01, stiffness: 1, damping: 0 });
  });

  it("起跳帧: 抬到 HOP 倍尺寸, 曲线引用公共表", () => {
    const frames = hopFrames(50);
    expect(frames[1]?.transform).toBe(`translateY(${-DOCK_HOP * 50}px)`);
    expect(frames[0]?.easing).toBe(cssCurve("lift"));
    expect(frames[1]?.easing).toBe(cssCurve("popOut"));
  });
});

describe("MagnifyDock 交互", () => {
  it("工具栏语义, 点选回调并起跳", () => {
    manualFrames();
    const animate = spyAnimate();
    const onSelect = vi.fn();
    render(<MagnifyDock items={items} onSelect={onSelect} />);
    expect(screen.getByRole("toolbar", { name: "Dock" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    expect(onSelect).toHaveBeenCalledWith("b");
    expect(animate).toHaveBeenCalledTimes(1);
  });

  it("长按触发 onItemHold, 这次点击不算选中", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    manualFrames();
    const onSelect = vi.fn();
    const onItemHold = vi.fn();
    render(<MagnifyDock items={items} onSelect={onSelect} onItemHold={onItemHold} />);
    const b = screen.getByRole("button", { name: "B" });
    fireEvent.pointerDown(b, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(DOCK_HOLD_MS);
    });
    fireEvent.click(b);
    expect(onItemHold).toHaveBeenCalledWith("b");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("漫游 tabindex 与方向键环绕", () => {
    manualFrames();
    render(<MagnifyDock items={items} />);
    const [a, , c] = screen.getAllByRole("button");
    expect(a?.tabIndex).toBe(0);
    expect(c?.tabIndex).toBe(-1);
    a?.focus();
    fireEvent.keyDown(a as Element, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(c);
    expect(c?.tabIndex).toBe(0);
  });

  it("减弱动效: 不起跳", () => {
    mockReducedMotion(true);
    manualFrames();
    const animate = spyAnimate();
    render(<MagnifyDock items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    expect(animate).not.toHaveBeenCalled();
  });
});
