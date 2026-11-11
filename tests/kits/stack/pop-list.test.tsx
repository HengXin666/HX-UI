/**
 * kits/stack: PopList (规格 AnimatedList). 姿态, 错峰, 渐隐, 步进, 选中与键盘, 入场, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PopList, edgeFades, listPose, listStep, revealDelay } from "@src/kits/stack/PopList";
import { fakeIntersection, manualFrames, mockReducedMotion } from "../support";

const items = ["One", "Two", "Three", "Four"];
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("PopList 纯函数", () => {
  it("错峰按序乘 stagger, 负值按 0", () => {
    expect(revealDelay(3, 0.05)).toBeCloseTo(0.15, 9);
    expect(revealDelay(3, -1)).toBe(0);
  });

  it("渐隐层按距边缘比例, 钳到 [0, 1]", () => {
    expect(edgeFades(0, 1000, 400, 56)).toEqual([0, 1]);
    expect(edgeFades(28, 1000, 400, 56)).toEqual([0.5, 1]);
    expect(edgeFades(600, 1000, 400, 56)).toEqual([1, 0]);
  });

  it("步进: loop 首尾相接, 否则停在两端; 未选时上下各从一端起", () => {
    expect(listStep(3, 1, 4, true)).toBe(0);
    expect(listStep(3, 1, 4, false)).toBe(3);
    expect(listStep(-1, 1, 4, false)).toBe(0);
    expect(listStep(-1, -1, 4, false)).toBe(3);
  });

  it("姿态: 入场后归位, pop 未入场缩小模糊", () => {
    expect(listPose("pop", false).opacity).toBe(0);
    expect(listPose("pop", true).transform).toBe("translateY(0px) scale(1)");
  });
});

describe("PopList 交互", () => {
  it("进视口的一批按序错峰入场, 位移带延迟而模糊不带", () => {
    manualFrames();
    const io = fakeIntersection();
    render(<PopList items={items} />);
    const nodes = screen.getAllByRole("option");
    expect(nodes[0]?.style.opacity).toBe("0");
    act(() => io.fire([nodes[2] as Element, nodes[1] as Element], true));
    expect(nodes[1]?.style.opacity).toBe("1");
    expect(nodes[1]?.style.transitionDelay).toBe("");
    expect(nodes[2]?.style.transitionDelay).toBe("0.05s, 0.05s, 0s");
    expect(nodes[1]?.style.transition).toContain("transform 620ms cubic-bezier(0.34, 1.4, 0.64, 1)");
    act(() => io.fire([nodes[1] as Element], false));
    expect(nodes[1]?.style.opacity).toBe("0");
  });

  it("悬停选中, 点击回调, 方向键与 Enter", () => {
    manualFrames();
    const pick = vi.fn();
    render(<PopList items={items} onItemSelect={pick} />);
    const list = screen.getByRole("listbox");
    fireEvent.mouseEnter(screen.getByRole("option", { name: "Two" }));
    expect(screen.getByRole("option", { name: "Two" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(list, { key: "ArrowDown" });
    expect(list.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "Three" }).id);
    fireEvent.keyDown(list, { key: "Enter" });
    expect(pick).toHaveBeenLastCalledWith(2);
    fireEvent.click(screen.getByRole("option", { name: "Four" }));
    expect(pick).toHaveBeenLastCalledWith(3);
  });

  it("减弱动效: 不看视口直接在位, 无过渡", () => {
    mockReducedMotion(true);
    manualFrames();
    fakeIntersection();
    render(<PopList items={items} />);
    const node = screen.getAllByRole("option")[3] as HTMLElement;
    expect(node.style.opacity).toBe("1");
    expect(node.style.transition).toBe("none");
  });
});
