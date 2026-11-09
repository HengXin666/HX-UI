/**
 * kits/card: FileFolder (规格 Folder). 角度表, 扇形摆位, 上限 6, 探看, 打开与合上, 受控, 文件点击, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FOLDER_FLAP, FileFolder, coverAngle, itemPose } from "@src/kits/card/FileFolder";
import { manualFrames, mockReducedMotion } from "./support";

const items = [{ label: "A" }, { label: "B" }, { label: "C" }];
const root = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='file-folder']") as HTMLElement;
const cover = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='file-folder-cover']") as HTMLElement;
const papers = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>("[data-slot='file-folder-item']")];

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("FileFolder 纯函数", () => {
  it("角度表: 插页照规格, 封面打开取 DOM 上限", () => {
    expect(FOLDER_FLAP.open).toBe(-64);
    expect(coverAngle("peek")).toBe(-13);
    expect(coverAngle("open")).toBe(-75);
  });

  it("打开时扇形: 中间不转, 两端转 fan, 悬停那份抬高放大", () => {
    expect(itemPose(1, 3, "open", 54, 120, 14, false)).toEqual({ x: 0, y: -120, r: 0, s: 1 });
    const end = itemPose(2, 3, "open", 54, 120, 14, true);
    expect(end.x).toBe(54);
    expect(end.r).toBe(14);
    expect(end.y).toBeCloseTo(-120 + 21.6 - 12, 9);
    expect(end.s).toBe(1.05);
    expect(itemPose(0, 3, "peek", 54, 120, 14, false).y).toBe(-20);
  });
});

describe("FileFolder 交互", () => {
  it("最多 6 份; 合上时文件不可聚焦", () => {
    manualFrames();
    render(<FileFolder items={Array.from({ length: 8 }, (_, i) => ({ label: `f${i}` }))} />);
    expect(papers()).toHaveLength(6);
    expect(papers()[0]?.tabIndex).toBe(-1);
  });

  it("悬停探看, 点击打开散开, Escape 合上", () => {
    const frames = manualFrames();
    const change = vi.fn();
    render(<FileFolder items={items} label="Docs" onOpenChange={change} />);
    fireEvent.pointerEnter(root());
    act(() => frames.flush(200));
    expect(root().dataset.pose).toBe("peek");
    expect(cover().style.transform).toBe("rotateX(-13.00deg)");
    fireEvent.click(screen.getByRole("button", { name: "Docs" }));
    act(() => frames.flush(300));
    expect(change).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Docs" }).getAttribute("aria-expanded")).toBe("true");
    expect(cover().style.transform).toBe("rotateX(-75.00deg)");
    expect(papers()[2]?.style.transform).toBe("translate(54.00px, -98.40px) rotate(14.00deg) scale(1.0000)");
    fireEvent.keyDown(root(), { key: "Escape" });
    expect(root().dataset.pose).toBe("peek");
  });

  it("受控 open; 文件点击回调序号", () => {
    manualFrames();
    const click = vi.fn();
    const change = vi.fn();
    render(<FileFolder items={items} open onOpenChange={change} onItemClick={click} />);
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    expect(click).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Folder" }));
    expect(change).toHaveBeenCalledWith(false);
    expect(root().dataset.pose).toBe("open");
  });

  it("减弱动效: 直接到位", () => {
    mockReducedMotion(true);
    manualFrames();
    render(<FileFolder items={items} defaultOpen />);
    expect(cover().style.transform).toBe("rotateX(-75.00deg)");
    expect(papers()[1]?.style.transform).toBe("translate(0.00px, -120.00px) rotate(0.00deg) scale(1.0000)");
  });
});
