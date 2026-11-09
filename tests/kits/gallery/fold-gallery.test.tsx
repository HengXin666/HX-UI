/**
 * kits/gallery: FoldGallery (规格 AccordionGallery). 展开比例, 悬停与点击, 方向键, 标签错峰, 受控, 减弱动效.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FOLD_DEFAULTS, FoldGallery, foldGrow } from "@src/kits/gallery/FoldGallery";
import { mockReducedMotion } from "../support";

const items = ["A", "B", "C", "D"].map((t) => ({ image: `/img/${t}.jpg`, title: t }));
const panels = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='fold-gallery-panel']"));

afterEach(() => vi.restoreAllMocks());

describe("foldGrow", () => {
  it("展开项占总长 ratio", () => {
    const g = foldGrow(4, 0.52);
    expect(g / (g + 3)).toBeCloseTo(0.52, 9);
    expect(foldGrow(1, 0.52)).toBe(1);
  });
});

describe("FoldGallery", () => {
  it("默认展开第 3 项; 悬停切换, 过渡用 power3.out 时长 600ms", () => {
    render(<FoldGallery items={items} />);
    expect(panels()[FOLD_DEFAULTS.defaultIndex]?.dataset.active).toBe("true");
    fireEvent.pointerEnter(screen.getByRole("button", { name: "A" }));
    expect(panels()[0]?.dataset.active).toBe("true");
    expect(Number(panels()[0]?.style.flexGrow)).toBeCloseTo(foldGrow(4, 0.52), 6);
    expect(panels()[1]?.style.flexGrow).toBe("1");
    expect(panels()[0]?.style.transition).toContain("flex-grow 600ms cubic-bezier(0.25, 1, 0.5, 1)");
  });

  it("点击触发时悬停不切; 方向键循环并移焦", () => {
    const onIndexChange = vi.fn();
    render(<FoldGallery items={items} trigger="click" defaultIndex={0} onIndexChange={onIndexChange} />);
    fireEvent.pointerEnter(screen.getByRole("button", { name: "C" }));
    expect(onIndexChange).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("button", { name: "A" }), { key: "ArrowLeft" });
    expect(onIndexChange).toHaveBeenLastCalledWith(3);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "D" }));
  });

  it("标签: 展开项第二行延迟一个 stagger, 收起项左移 14px 用 0.6 倍时长", () => {
    render(<FoldGallery items={items} defaultIndex={1} />);
    const texts = document.querySelectorAll<HTMLElement>("[data-slot='fold-gallery-text']");
    expect(texts[1]?.style.transition).toContain("600ms cubic-bezier(0.25, 1, 0.5, 1) 60ms");
    expect(texts[0]?.style.transform).toBe("translateX(-14px)");
    expect(texts[0]?.style.transition).toContain("360ms");
  });

  it("受控 index 不自己切", () => {
    render(<FoldGallery items={items} index={0} />);
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    expect(panels()[0]?.dataset.active).toBe("true");
  });

  it("减弱动效: 过渡为 none", () => {
    mockReducedMotion(true);
    render(<FoldGallery items={items} />);
    expect(panels()[0]?.style.transition).toBe("none");
  });
});
