/**
 * nav/rail: ProximityRail (规格 LineSidebar). 衰减曲线, 刻度线长度, 选中, 方向键, 指针推近, 减弱动效.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProximityRail, RAIL_DEFAULTS, RAIL_FALLOFF, railMarker, railTarget } from "@src/controls/nav/rail/ProximityRail";
import { manualFrames, mockReducedMotion } from "./support";

const items = [
  { value: "intro", label: "Intro" },
  { value: "api", label: "API" },
  { value: "faq", label: "FAQ", disabled: true },
  { value: "news", label: "News", href: "#news" },
];

afterEach(() => vi.restoreAllMocks());

describe("ProximityRail 纯函数", () => {
  it("衰减曲线两端为 0 与 1, smooth 中点 0.5, sharp 低于 linear", () => {
    for (const curve of Object.values(RAIL_FALLOFF)) {
      expect(curve(0)).toBe(0);
      expect(curve(1)).toBe(1);
    }
    expect(RAIL_FALLOFF.smooth(0.5)).toBe(0.5);
    expect(RAIL_FALLOFF.sharp(0.5)).toBeLessThan(RAIL_FALLOFF.linear(0.5));
  });

  it("距离到强度: 正对为 1, 半径外为 0, 对称", () => {
    expect(railTarget(0, 100, "linear")).toBe(1);
    expect(railTarget(150, 100, "smooth")).toBe(0);
    expect(railTarget(-40, 100, "linear")).toBeCloseTo(0.6, 9);
    expect(railTarget(10, 0, "linear")).toBe(0);
  });

  it("刻度线: 0 时 tickScale 倍, 1 时全长, 不缩放时恒全长", () => {
    expect(railMarker(0, 60, 0.5, true)).toBe(30);
    expect(railMarker(1, 60, 0.5, true)).toBe(60);
    expect(railMarker(0, 60, 0.5, false)).toBe(60);
    expect(RAIL_DEFAULTS.smoothing).toBe(100);
  });
});

describe("ProximityRail 交互", () => {
  it("点选: aria-current, 回调, 活动刻度线全长", () => {
    manualFrames();
    const onChange = vi.fn();
    const { container } = render(<ProximityRail items={items} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /API/ }));
    expect(onChange).toHaveBeenCalledWith("api");
    expect(screen.getByRole("button", { name: /API/ }).getAttribute("aria-current")).toBe("page");
    const ticks = container.querySelectorAll<HTMLElement>("[data-slot='proximity-rail-tick']");
    expect(ticks[1]?.style.width).toBe("60px");
    expect(ticks[0]?.style.width).toBe("30px");
  });

  it("上下方向键移焦点并跳过禁用项", () => {
    manualFrames();
    render(<ProximityRail items={items} />);
    const api = screen.getByRole("button", { name: /API/ });
    api.focus();
    fireEvent.keyDown(api, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("link", { name: /News/ }));
    fireEvent.keyDown(document.activeElement as Element, { key: "Home" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Intro/ }));
  });

  it("指针靠近: 强度逐帧趋近, 文字右移", () => {
    const frames = manualFrames();
    render(<ProximityRail items={items} showIndex={false} />);
    const label = screen.getByText("Intro").parentElement as HTMLElement;
    fireEvent.pointerMove(label.closest("ul") as HTMLElement, { clientY: 0 });
    frames.flush(1);
    const early = Number.parseFloat(label.style.transform.replace("translateX(", ""));
    frames.flush(60);
    const late = Number.parseFloat(label.style.transform.replace("translateX(", ""));
    expect(early).toBeGreaterThan(0);
    expect(late).toBeGreaterThan(early);
    expect(late).toBeCloseTo(RAIL_DEFAULTS.maxShift, 1);
  });

  it("减弱动效: 强度直接落定", () => {
    mockReducedMotion(true);
    manualFrames();
    render(<ProximityRail items={items} showIndex={false} />);
    const label = screen.getByText("Intro").parentElement as HTMLElement;
    fireEvent.pointerMove(label.closest("ul") as HTMLElement, { clientY: 0 });
    expect(label.style.transform).toBe(`translateX(${RAIL_DEFAULTS.maxShift}px)`);
  });
});
