/**
 * nav/menu: MarqueeRows (规格 FlowingMenu). 进出边, 弹簧, 跑马取模, 指针进入滑入, 离开滑出, 入场, 减弱动效.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarqueeRows, marqueeAdvance, marqueeEdge, marqueeHidden, marqueeSpring } from "@src/controls/nav/menu/MarqueeRows";
import { manualFrames, mockReducedMotion } from "./support";

const items = [{ label: "Mojave", href: "#mojave" }, { label: "Sonoma" }, { label: "Ventura", image: "/img/ventura.jpg" }];

afterEach(() => vi.restoreAllMocks());

const bandOf = (i: number): HTMLElement => document.querySelectorAll<HTMLElement>("[data-slot='marquee-rows-band']")[i] as HTMLElement;
const ty = (node: HTMLElement): number => Number.parseFloat(node.style.transform.replace("translateY(", ""));

describe("MarqueeRows 纯函数", () => {
  it("上半走上边, 下半走下边; 藏在边外 ±101%", () => {
    expect(marqueeEdge(10, 80)).toBe("top");
    expect(marqueeEdge(50, 80)).toBe("bottom");
    expect(marqueeHidden("top")).toBe(-101);
    expect(marqueeHidden("bottom")).toBe(101);
  });

  it("弹簧 omega = 2pi / duration, duration 下限 0.1s", () => {
    const s = marqueeSpring(0.5);
    expect(Math.sqrt(s.stiffness)).toBeCloseTo((2 * Math.PI) / 0.5, 9);
    expect(marqueeSpring(0).stiffness).toBe(marqueeSpring(0.1).stiffness);
  });

  it("跑马位移取模到 (-段宽, 0], 方向反号; 段宽 0 恒为 0", () => {
    expect(marqueeAdvance(0, 1000, 60, 200, 1)).toBe(-60);
    expect(marqueeAdvance(-180, 1000, 60, 200, 1)).toBe(-40);
    expect(marqueeAdvance(0, 1000, 60, 200, -1)).toBe(-140);
    expect(marqueeAdvance(-10, 1000, 60, 0, 1)).toBe(0);
  });
});

describe("MarqueeRows 交互", () => {
  it("指针从下半进入: 带从下边滑到 0; 离开时滑出; 点选回调", () => {
    const frames = manualFrames();
    const onItemClick = vi.fn();
    render(<MarqueeRows items={items} intro={false} onItemClick={onItemClick} />);
    const row = screen.getByRole("button", { name: /Sonoma/ });
    fireEvent.pointerEnter(row, { clientY: 30 });
    expect(ty(bandOf(1))).toBe(0 + 101);
    frames.flush(90);
    expect(Math.abs(ty(bandOf(1)))).toBeLessThan(1);
    fireEvent.pointerLeave(row, { clientY: 30 });
    frames.flush(90);
    expect(ty(bandOf(1))).toBeCloseTo(101, 0);
    fireEvent.click(row);
    expect(onItemClick).toHaveBeenCalledWith(1);
  });

  it("键盘聚焦按上边进入", () => {
    const frames = manualFrames();
    render(<MarqueeRows items={items} intro={false} />);
    screen.getByRole("link", { name: /Mojave/ }).focus();
    expect(ty(bandOf(0))).toBe(-101);
    frames.flush(90);
    expect(Math.abs(ty(bandOf(0)))).toBeLessThan(1);
  });

  it("入场: 行处于终态, 延迟按行错峰", () => {
    manualFrames();
    const { container } = render(<MarqueeRows items={items} />);
    const rows = container.querySelectorAll<HTMLElement>("li");
    expect(rows[0]?.style.opacity).toBe("1");
    expect(rows[2]?.style.transition).toContain("140ms");
  });

  it("减弱动效: 带直接落定, 行过渡为 none", () => {
    mockReducedMotion(true);
    manualFrames();
    const { container } = render(<MarqueeRows items={items} />);
    expect(container.querySelector("li")?.style.transition).toBe("none");
    fireEvent.pointerEnter(screen.getByRole("button", { name: /Sonoma/ }), { clientY: 0 });
    expect(ty(bandOf(1))).toBe(0);
  });
});
