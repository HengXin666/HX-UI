/**
 * kits/gallery: DepthDeck (规格 DepthCarousel). 序位, 姿态, 翻页, 循环, 滚轮节流, 自动播放, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEPTH_DEFAULTS, DepthDeck, depthPose, depthRank, type DepthLook } from "@src/kits/gallery/DepthDeck";
import { mockReducedMotion } from "../support";

const cards = ["A", "B", "C", "D", "E", "F"].map((label) => ({ label, content: <span>{label}</span> }));
const look: DepthLook = { spread: 90, depth: 220, tilt: 22, tiltSign: -1, visible: 4, falloff: 0.2, blur: 6 };
const card = (i: number): HTMLElement => document.querySelectorAll<HTMLElement>("[data-slot='depth-deck-card']")[i] as HTMLElement;

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("DepthDeck 纯函数", () => {
  it("序位: 循环时翻过的牌排到最后", () => {
    expect(depthRank(0, 1, 6, true)).toBe(5);
    expect(depthRank(0, 1, 6, false)).toBe(-1);
  });

  it("姿态: 最前不转不糊, 第 3 张右移后退转向, 透明度按 falloff 递减, 最后一张模糊 6px", () => {
    expect(depthPose(0, look)).toMatchObject({ opacity: 1, blur: 0, transform: "translateX(0px) translateZ(0px) rotateY(0deg)" });
    const p = depthPose(2, look);
    expect(p.transform).toBe("translateX(180px) translateZ(-440px) rotateY(-22deg)");
    expect(p.opacity).toBeCloseTo(0.6, 9);
    expect(depthPose(3, look).blur).toBe(6);
    expect(depthPose(5, look)).toMatchObject({ opacity: 0, shown: false });
    expect(depthPose(-1, look).opacity).toBe(0);
  });
});

describe("DepthDeck 交互", () => {
  it("下一张: 原当前牌退场, 新当前牌到最前; 过渡 700ms power3.out", () => {
    const onChange = vi.fn();
    render(<DepthDeck cards={cards} loop={false} onChange={onChange} />);
    expect(card(0).style.transition).toContain(`transform ${DEPTH_DEFAULTS.duration}ms cubic-bezier(0.25, 1, 0.5, 1)`);
    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    expect(onChange).toHaveBeenCalledWith(1);
    expect(card(0).style.opacity).toBe("0");
    expect(card(1).style.transform).toBe("translateX(0px) translateZ(0px) rotateY(0deg)");
  });

  it("循环: 第一张往前到最后一张; 方向键翻页", () => {
    const onChange = vi.fn();
    render(<DepthDeck cards={cards} onChange={onChange} />);
    fireEvent.keyDown(document.querySelector("[tabindex='0']") as HTMLElement, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it("滚轮按半个过渡时长节流", () => {
    const onChange = vi.fn();
    render(<DepthDeck cards={cards} onChange={onChange} />);
    const box = document.querySelector("[tabindex='0']") as HTMLElement;
    fireEvent.wheel(box, { deltaY: 30, timeStamp: 1000 });
    fireEvent.wheel(box, { deltaY: 30, timeStamp: 1100 });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("自动播放按间隔翻页, 悬停暂停", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const onChange = vi.fn();
    const { container } = render(<DepthDeck cards={cards} autoplay onChange={onChange} />);
    act(() => {
      vi.advanceTimersByTime(DEPTH_DEFAULTS.autoplayDelay);
    });
    expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent.mouseEnter(container.firstElementChild as HTMLElement);
    act(() => {
      vi.advanceTimersByTime(DEPTH_DEFAULTS.autoplayDelay * 3);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("减弱动效: 过渡为 none", () => {
    mockReducedMotion(true);
    render(<DepthDeck cards={cards} />);
    expect(card(0).style.transition).toBe("none");
  });
});
