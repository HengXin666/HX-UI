/**
 * kits/gallery: BlendSlider (规格 MorphSlider). 转场关键帧, 翻页与动画参数, 打断落定, 循环, 自动播放, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BLEND_DEFAULTS, BlendSlider, blendFrames } from "@src/kits/gallery/BlendSlider";
import { mockReducedMotion, spyAnimate } from "../support";

const items = ["A", "B", "C"].map((label) => ({ label, image: `/img/${label}.jpg`, title: label }));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("blendFrames", () => {
  it("四种转场各有进场关键帧, 横切与漩涡随方向", () => {
    expect(blendFrames("melt", 1)[0]).toMatchObject({ opacity: 0 });
    expect(blendFrames("ripple", 1)[1]).toEqual({ clipPath: "circle(75% at 50% 50%)" });
    expect(blendFrames("shear", 1)[0]).toEqual({ clipPath: "inset(0 0 0 100%)" });
    expect(blendFrames("shear", -1)[0]).toEqual({ clipPath: "inset(0 100% 0 0)" });
    expect(blendFrames("swirl", -1)[0]?.transform).toContain("rotate(10deg)");
  });
});

describe("BlendSlider", () => {
  it("下一幅: 新幅按转场 1.1s power2.inOut 进场, 标题用 0.66 倍 outExpo", () => {
    const animate = spyAnimate();
    const onChange = vi.fn();
    render(<BlendSlider items={items} transition="ripple" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(onChange).toHaveBeenCalledWith(1);
    expect(animate).toHaveBeenCalledWith(blendFrames("ripple", 1), expect.objectContaining({ duration: BLEND_DEFAULTS.duration, easing: "cubic-bezier(0.65, 0, 0.35, 1)" }));
    expect(animate.mock.calls[1]?.[1]).toMatchObject({ duration: BLEND_DEFAULTS.duration * 0.66, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
    expect(screen.getByRole("group", { name: "B" })).toBeTruthy();
  });

  it("转场中再翻页: 上一组动画 finish() 落定, 再从新位置进场", () => {
    const animate = spyAnimate();
    const onChange = vi.fn();
    render(<BlendSlider items={items} transition="melt" onChange={onChange} />);
    const next = screen.getByRole("button", { name: "Next slide" });
    fireEvent.click(next);
    const first = animate.mock.results.map((r) => r.value as Animation & { finish: ReturnType<typeof vi.fn> });
    fireEvent.click(next);
    expect(first.length).toBeGreaterThan(0);
    for (const a of first) expect(a.finish).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls).toEqual([[1], [2]]);
    expect(screen.getByRole("group", { name: "C" })).toBeTruthy();
  });

  it("没有 Element.animate 时直接落定, 不留下层", () => {
    Object.defineProperty(Element.prototype, "animate", { configurable: true, writable: true, value: undefined });
    render(<BlendSlider items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(document.querySelector("[data-slot='blend-slider-under']")).toBeNull();
  });

  it("循环与方向键: 从第一幅往前到最后一幅, 横切从左来", () => {
    const animate = spyAnimate();
    const onChange = vi.fn();
    render(<BlendSlider items={items} transition="shear" onChange={onChange} />);
    fireEvent.keyDown(document.querySelector("[tabindex='0']") as HTMLElement, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith(2);
    expect(animate.mock.calls[0]?.[0]).toEqual(blendFrames("shear", -1));
  });

  it("自动播放按间隔翻页, 悬停暂停", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    spyAnimate();
    const onChange = vi.fn();
    const { container } = render(<BlendSlider items={items} autoplay autoplayDelay={1000} onChange={onChange} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onChange).toHaveBeenCalledWith(1);
    fireEvent.mouseEnter(container.firstElementChild as HTMLElement);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("减弱动效: 只淡入, 不超过 400ms, 标题不动", () => {
    mockReducedMotion(true);
    const animate = spyAnimate();
    render(<BlendSlider items={items} transition="swirl" />);
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0]?.[0]).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(animate.mock.calls[0]?.[1]).toMatchObject({ duration: 400 });
  });
});
