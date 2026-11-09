/**
 * kits/stack: TintGrid (规格 ChromaGrid). 跟随系数, 显色趋近, 遮罩, 指针聚光, 离开退色, 卡片辉光, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TintGrid, chromaFollow, chromaMask, chromaPower } from "@src/kits/stack/TintGrid";
import { manualFrames, mockReducedMotion } from "./support";

const items = ["A", "B", "C"].map((title) => ({ image: `/${title}.jpg`, title }));
const shade = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='tint-grid-shade']") as HTMLElement;

afterEach(() => vi.restoreAllMocks());

describe("TintGrid 纯函数", () => {
  it("跟随时间常数 damping × 0.32 s; 减弱动效为 1", () => {
    expect(chromaFollow(144, 0.45, false)).toBeCloseTo(1 - Math.exp(-1), 9);
    expect(chromaFollow(16, 0.45, true)).toBe(1);
  });

  it("显色: 升起 0.2s, 回落 fadeOut", () => {
    expect(chromaPower(0, 1, 200, 0.6, false)).toBeCloseTo(1 - Math.exp(-1), 9);
    expect(chromaPower(1, 0, 600, 0.6, false)).toBeCloseTo(Math.exp(-1), 9);
  });

  it("遮罩: 内圈 (1 - softness) 全透, 半径处全遮; power 0 全遮", () => {
    expect(chromaMask(10, 20, 260, 0.6, 1)).toBe("radial-gradient(circle at 10.0px 20.0px, transparent 0px, transparent 104.0px, black 260.0px)");
    expect(chromaMask(10, 20, 260, 0.6, 0)).toBe("linear-gradient(black, black)");
  });
});

describe("TintGrid 交互", () => {
  it("指针进入后聚光张开, 离开后按 fadeOut 收回全遮", () => {
    const frames = manualFrames();
    render(<TintGrid items={items} />);
    const grid = screen.getByRole("list");
    fireEvent.pointerMove(grid, { clientX: 100, clientY: 50 });
    act(() => frames.flush(120));
    expect(shade().style.maskImage).toContain("circle at 100.0px 50.0px");
    expect(shade().style.maskImage).toContain("black 260.0px");
    fireEvent.pointerLeave(grid);
    act(() => frames.flush(10));
    expect(shade().style.maskImage).toMatch(/radial-gradient/);
    act(() => frames.flush(400));
    expect(shade().style.maskImage).toBe("linear-gradient(black, black)");
  });

  it("悬停与聚焦的卡亮起辉光, 点击回调", () => {
    manualFrames();
    const click = vi.fn();
    render(<TintGrid items={items} onItemClick={click} />);
    const b = screen.getByRole("button", { name: "B" });
    fireEvent.focus(b);
    expect((b.querySelector("[data-slot='tint-grid-glow']") as HTMLElement).style.opacity).toBe("0.5");
    fireEvent.click(b);
    expect(click).toHaveBeenCalledWith(1);
  });

  it("减弱动效: 聚光直接贴指针并全开", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    render(<TintGrid items={items} />);
    fireEvent.pointerMove(screen.getByRole("list"), { clientX: 40, clientY: 30 });
    act(() => frames.flush(1));
    expect(shade().style.maskImage).toContain("circle at 40.0px 30.0px");
    expect(shade().style.maskImage).toContain("black 260.0px");
  });
});
