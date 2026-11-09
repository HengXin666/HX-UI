/**
 * nav/tile: GlassTiles (规格 GlassIcons). 背板与玻璃姿态, 网格方向键, 入场错峰, 悬停, 选中, 减弱动效.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GLASS_DEFAULTS, GlassTiles, glassTransform, gridMove, plateTransform } from "@src/controls/nav/tile/GlassTiles";
import { manualFrames, mockReducedMotion } from "./support";

const items = ["mail", "maps", "notes", "music"].map((id) => ({ id, label: id.toUpperCase(), icon: <span>{id}</span> }));

afterEach(() => vi.restoreAllMocks());

const glassOf = (name: string): HTMLElement => screen.getByRole("button", { name }).querySelector("[data-slot='glass-tiles-glass']") as HTMLElement;
const plateOf = (name: string): HTMLElement => screen.getByRole("button", { name }).querySelector("[data-slot='glass-tiles-plate']") as HTMLElement;

describe("GlassTiles 纯函数", () => {
  it("背板: tilt 按 spread 放大角度, 悬停再放大 1.5 倍; none 无变换", () => {
    expect(plateTransform("tilt", 82, 30, 0.5, 0)).toBe("rotate(30deg)");
    expect(plateTransform("tilt", 82, 30, 0.5, 1)).toBe("rotate(45deg)");
    expect(plateTransform("offset", 100, 30, 0, 0)).toBe("translate(9px, -9px)");
    expect(plateTransform("none", 82, 30, 0.5, 1)).toBe("none");
  });

  it("玻璃: 入场前下沉 0.1 倍尺寸, press 缩到 0.94, lift 抬 0.08 倍", () => {
    expect(glassTransform("none", 100, 0, 0)).toBe("translateY(10px) scale(1)");
    expect(glassTransform("press", 100, 1, 1)).toBe("translateY(0px) scale(0.94)");
    expect(glassTransform("lift", 100, 1, 1)).toBe("translateY(-8px) scale(1)");
  });

  it("网格方向键: 行列移动, 越界不动", () => {
    expect(gridMove("ArrowRight", 0, 7, 3)).toBe(1);
    expect(gridMove("ArrowDown", 1, 7, 3)).toBe(4);
    expect(gridMove("ArrowDown", 5, 7, 3)).toBeNull();
    expect(gridMove("ArrowUp", 1, 7, 3)).toBeNull();
    expect(gridMove("End", 0, 7, 3)).toBe(6);
    expect(gridMove("Enter", 0, 7, 3)).toBeNull();
  });
});

describe("GlassTiles 交互", () => {
  it("入场按错峰浮起: 首格先于末格完成", () => {
    const frames = manualFrames();
    render(<GlassTiles items={items} />);
    frames.flush(1);
    expect(Number(glassOf("MAIL").style.opacity)).toBeLessThan(1);
    frames.flush(12);
    expect(Number(glassOf("MAIL").style.opacity)).toBeGreaterThan(Number(glassOf("MUSIC").style.opacity));
    frames.flush(120);
    expect(glassOf("MUSIC").style.opacity).toBe("1");
  });

  it("悬停背板摆开, 点选回调; 方向键按网格移焦点", () => {
    const frames = manualFrames();
    const onSelect = vi.fn();
    render(<GlassTiles items={items} intro={false} onSelect={onSelect} columns={2} />);
    fireEvent.pointerEnter(screen.getByRole("button", { name: "MAPS" }));
    frames.flush(90);
    expect(plateOf("MAPS").style.transform).toBe(`rotate(${GLASS_DEFAULTS.tilt * 1.5}deg)`);
    fireEvent.click(screen.getByRole("button", { name: "MAPS" }));
    expect(onSelect).toHaveBeenCalledWith("maps");
    const mail = screen.getByRole("button", { name: "MAIL" });
    mail.focus();
    fireEvent.keyDown(mail, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "NOTES" }));
  });

  it("减弱动效: 不入场, 悬停直接落定", () => {
    mockReducedMotion(true);
    manualFrames();
    render(<GlassTiles items={items} />);
    expect(glassOf("MUSIC").style.opacity).toBe("1");
    fireEvent.pointerEnter(screen.getByRole("button", { name: "MAIL" }));
    expect(glassOf("MAIL").style.transform).toBe("translateY(0px) scale(0.94)");
  });
});
