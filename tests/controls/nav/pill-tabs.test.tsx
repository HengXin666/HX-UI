/**
 * nav/bar: PillTabs (规格 PillNav). 纯函数, 选中与受控, 链接条目, 方向键, 减弱动效.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PILL_DEFAULTS, PillTabs, pillBox, pillSpring } from "@src/controls/nav/bar/PillTabs";
import { manualFrames, mockReducedMotion } from "./support";

const items = [
  { value: "home", label: "Home" },
  { value: "work", label: "Work" },
  { value: "about", label: "About", href: "#about" },
  { value: "off", label: "Off", disabled: true },
];

afterEach(() => vi.restoreAllMocks());

describe("PillTabs 纯函数", () => {
  it("bounce 0 为临界阻尼, bounce 越大阻尼越小", () => {
    const crit = pillSpring(0);
    expect(crit.damping).toBeCloseTo(2 * Math.sqrt(crit.stiffness * crit.mass), 6);
    expect(pillSpring(PILL_DEFAULTS.bounce).damping).toBeLessThan(crit.damping);
    expect(pillSpring(2).damping).toBe(0);
  });

  it("速度拉伸对称铺开, 上限为宽度乘 stretch", () => {
    expect(pillBox(100, 60, 0, 0.5)).toEqual({ left: 100, width: 60 });
    const fast = pillBox(100, 60, 1e6, 0.5);
    expect(fast.width).toBe(90);
    expect(fast.left).toBe(85);
    expect(pillBox(100, 60, 1e6, 0)).toEqual({ left: 100, width: 60 });
  });
});

describe("PillTabs 交互", () => {
  it("非受控: 点选改 aria-current 并回调; 禁用项不可选", () => {
    manualFrames();
    const onChange = vi.fn();
    render(<PillTabs items={items} onChange={onChange} />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Home" }).getAttribute("aria-current")).toBe("page");
    fireEvent.click(screen.getByRole("button", { name: "Work" }));
    expect(onChange).toHaveBeenCalledWith("work");
    expect(screen.getByRole("button", { name: "Work" }).getAttribute("aria-current")).toBe("page");
    expect((screen.getByRole("button", { name: "Off" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("受控: 只回调不自改; href 渲染为链接", () => {
    manualFrames();
    const onChange = vi.fn();
    render(<PillTabs items={items} value="home" onChange={onChange} />);
    fireEvent.click(screen.getByRole("link", { name: "About" }));
    expect(onChange).toHaveBeenCalledWith("about");
    expect(screen.getByRole("button", { name: "Home" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "About" }).getAttribute("href")).toBe("#about");
  });

  it("左右方向键移焦点并跳过禁用项, End 到最后一个可用项", () => {
    manualFrames();
    render(<PillTabs items={items} />);
    const home = screen.getByRole("button", { name: "Home" });
    home.focus();
    fireEvent.keyDown(home, { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Work" }));
    fireEvent.keyDown(document.activeElement as Element, { key: "End" });
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "About" }));
    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowRight" });
    expect(document.activeElement).toBe(home);
  });

  it("焦点环用 FOCUS_RING, 不再用 ring", () => {
    manualFrames();
    render(<PillTabs items={items} />);
    const cls = screen.getByRole("button", { name: "Home" }).className;
    expect(cls).toContain("focus-visible:outline-1");
    expect(cls).not.toContain("ring-1");
  });

  it("减弱动效: 过渡为 none", () => {
    mockReducedMotion(true);
    manualFrames();
    const { container } = render(<PillTabs items={items} />);
    expect((container.querySelector("[data-slot='pill-tabs']") as HTMLElement).style.transition).toBe("none");
  });
});
