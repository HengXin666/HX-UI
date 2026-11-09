/**
 * nav/bar: GooTabs (规格 GooeyNav). 随机数可复现, 液滴规划与轨迹, 滤镜参数, 换选放液滴, 减弱动效.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GOO_MAX_DROPS, GooTabs, dropPoint, dropSize, gooFilter, gooRandom, planDrops } from "@src/controls/nav/bar/GooTabs";
import { manualFrames, mockReducedMotion } from "./support";

const items = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma", disabled: true },
];

afterEach(() => vi.restoreAllMocks());

const flying = (root: HTMLElement): number => Array.from(root.querySelectorAll<HTMLElement>("[data-slot='goo-tabs-drop']")).filter((d) => d.style.opacity === "1").length;

describe("GooTabs 纯函数", () => {
  it("同种子同序列, 值落在 [0, 1)", () => {
    const a = gooRandom(7);
    const b = gooRandom(7);
    const xs = Array.from({ length: 50 }, () => a());
    expect(xs).toEqual(Array.from({ length: 50 }, () => b()));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it("液滴数量钳到上限, 时长不短于 0.15s 且不超过公式上界", () => {
    expect(planDrops(100, 0.6, 0.3, 56, gooRandom(1))).toHaveLength(GOO_MAX_DROPS);
    expect(planDrops(-3, 0.6, 0.3, 56, gooRandom(1))).toHaveLength(0);
    const drops = planDrops(15, 0.6, 0.3, 56, gooRandom(2));
    for (const d of drops) {
      expect(d.duration).toBeGreaterThanOrEqual(0.15);
      expect(d.duration).toBeLessThanOrEqual(0.6 * 0.94 + 0.3 * 0.6);
      expect(Math.abs(d.lift)).toBeLessThanOrEqual(56);
    }
    expect(planDrops(5, 0, 0, 0, gooRandom(3)).every((d) => d.duration === 0.15)).toBe(true);
  });

  it("轨迹首尾落在两端, 中途鼓出; 直径中点最细", () => {
    expect(dropPoint(0, 10, 110, 20, 30)).toEqual({ x: 10, y: 20 });
    expect(dropPoint(1, 10, 110, 20, 30)).toEqual({ x: 110, y: 20 });
    const mid = dropPoint(0.5, 10, 110, 20, 30);
    expect(mid.x).toBeCloseTo(60, 9);
    expect(mid.y).toBeCloseTo(20 - 30 * 0.75, 9);
    expect(dropSize(0, 10)).toBe(10);
    expect(dropSize(0.5, 10)).toBeCloseTo(5.5, 9);
  });

  it("滤镜模糊随 gooeyness 增大并钳制", () => {
    expect(gooFilter(0).blur).toBe(2);
    expect(gooFilter(1).blur).toBe(10);
    expect(gooFilter(5).blur).toBe(10);
    expect(gooFilter(0.5).matrix).toContain("18 -7");
  });
});

describe("GooTabs 交互", () => {
  it("点选改 aria-current 并放出液滴, 飞完回收", () => {
    const frames = manualFrames();
    const onChange = vi.fn();
    const { container } = render(<GooTabs items={items} onChange={onChange} particleCount={12} />);
    expect(screen.getByRole("button", { name: "Alpha" }).getAttribute("aria-current")).toBe("page");
    fireEvent.click(screen.getByRole("button", { name: "Beta" }));
    expect(onChange).toHaveBeenCalledWith("b");
    expect(screen.getByRole("button", { name: "Beta" }).getAttribute("aria-current")).toBe("page");
    frames.flush(2);
    expect(flying(container)).toBe(12);
    frames.flush(120);
    expect(flying(container)).toBe(0);
  });

  it("黏液层引用自己的滤镜", () => {
    manualFrames();
    const { container } = render(<GooTabs items={items} />);
    const goo = container.querySelector("[data-slot='goo-tabs-goo']") as HTMLElement;
    const id = container.querySelector("filter")?.id;
    expect(id).toBeTruthy();
    expect(goo.style.filter).toBe(`url(#${id})`);
  });

  it("方向键移焦点跳过禁用项; 禁用项不可选", () => {
    manualFrames();
    render(<GooTabs items={items} />);
    const beta = screen.getByRole("button", { name: "Beta" });
    beta.focus();
    fireEvent.keyDown(beta, { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Alpha" }));
    expect((screen.getByRole("button", { name: "Gamma" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("减弱动效: 不放液滴, 文字过渡为 none", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    const { container } = render(<GooTabs items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "Beta" }));
    frames.flush(2);
    expect(flying(container)).toBe(0);
    expect(screen.getByRole("button", { name: "Beta" }).style.transition).toBe("none");
  });
});
