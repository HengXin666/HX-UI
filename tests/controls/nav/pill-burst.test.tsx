/**
 * nav/menu: PillBurst (规格 BubbleMenu). 错峰抖动, 胶囊姿态, 开合阶段, Escape 与点外部, 选中关闭, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BURST_EXIT_MS, PillBurst, burstDelay, burstTransform } from "@src/controls/nav/menu/PillBurst";
import { mockReducedMotion } from "./support";

const items = [
  { label: "Home", href: "#home", rotation: -8 },
  { label: "About", rotation: 8 },
  { label: "Blog" },
];

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const panel = (): HTMLElement | null => document.querySelector("[data-slot='pill-burst-panel']");

describe("PillBurst 纯函数", () => {
  it("延迟 = i * stagger 加 ±0.05 内的确定抖动, 不小于 0", () => {
    for (let i = 0; i < 20; i += 1) {
      const d = burstDelay(i, 0.12);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(Math.abs(d - i * 0.12)).toBeLessThanOrEqual(0.05 + 1e-12);
      expect(burstDelay(i, 0.12)).toBe(d);
    }
    expect(burstDelay(3, -1)).toBeLessThanOrEqual(0.05);
  });

  it("胶囊姿态: 收起缩到 0, 展开按摆角, 悬停转正放大", () => {
    expect(burstTransform(false, 8, false)).toBe("rotate(8deg) scale(0)");
    expect(burstTransform(true, 8, false)).toBe("rotate(8deg) scale(1)");
    expect(burstTransform(true, 8, true)).toBe("rotate(0deg) scale(1.06)");
  });
});

describe("PillBurst 交互", () => {
  it("开关: aria-expanded, 面板挂上并进入终态; 收起后等离场再卸载", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(<PillBurst items={items} onOpenChange={onOpenChange} />);
    const toggle = screen.getByRole("button", { name: "Toggle menu" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(panel()).toBeNull();
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(panel()?.dataset.phase).toBe("open");
    expect(screen.getByRole("link", { name: "Home" }).style.transform).toBe("rotate(-8deg) scale(1)");
    fireEvent.click(toggle);
    expect(panel()?.dataset.phase).toBe("closing");
    act(() => {
      vi.advanceTimersByTime(BURST_EXIT_MS);
    });
    expect(panel()).toBeNull();
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it("Escape 关闭并把焦点还给开关; 点外部关闭; 点选条目关闭", () => {
    const onItemClick = vi.fn();
    render(<PillBurst items={items} defaultOpen onItemClick={onItemClick} />);
    const toggle = screen.getByRole("button", { name: "Toggle menu" });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
    fireEvent.click(toggle);
    fireEvent.pointerDown(document.body);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: "About" }));
    expect(onItemClick).toHaveBeenCalledWith(1);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("条目按钮都带 type=button, 焦点环用 FOCUS_RING", () => {
    render(<PillBurst items={items} defaultOpen />);
    const blog = screen.getByRole("button", { name: "Blog" });
    expect(blog.getAttribute("type")).toBe("button");
    expect(blog.className).toContain("focus-visible:outline-1");
  });

  it("减弱动效: 过渡为 none, 收起立即卸载", () => {
    mockReducedMotion(true);
    render(<PillBurst items={items} defaultOpen />);
    expect(screen.getByRole("link", { name: "Home" }).style.transition).toBe("none");
    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    expect(panel()).toBeNull();
  });
});
