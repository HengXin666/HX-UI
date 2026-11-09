/**
 * kits/gallery: SphereWall (规格 DomeGallery). 格位, 半径, 惯性, 方向键, 放大对话框, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DOME_DEFAULTS, SphereWall, domeCells, domeDecay, domeFling, domeRadius } from "@src/kits/gallery/SphereWall";
import { manualFrames, mockReducedMotion } from "../support";

const images = ["a", "b", "c"].map((n) => ({ src: `/img/${n}.jpg`, alt: `Photo ${n}` }));
const rot = (): string => (document.querySelector("[data-slot='sphere-wall-sphere']") as HTMLElement).style.transform;

afterEach(() => vi.restoreAllMocks());

describe("SphereWall 纯函数", () => {
  it("格位: segments × 5 带, 相邻带错开半格, 图片循环", () => {
    const cells = domeCells(4, 3);
    expect(cells).toHaveLength(20);
    expect(cells[0]).toEqual({ lon: 0, lat: -60, image: 0 });
    expect(domeCells(20, 3)[0]?.lat).toBe(-36);
    expect(cells[4]?.lon).toBe(45);
    expect(cells[8]).toMatchObject({ lon: 0, lat: 0 });
    expect(cells[3]?.image).toBe(0);
  });

  it("半径夹在 min / max; 惯性按 dampening 指数衰减; 松手速度夹到 1.4", () => {
    expect(domeRadius(800, 600, 0.5, 600, Infinity)).toBe(600);
    expect(domeRadius(4000, 3000, 0.5, 600, 1000)).toBe(1000);
    expect(domeDecay(1, 2, 500)).toBeCloseTo(Math.exp(-1), 9);
    expect(domeFling(-3)).toBe(-1.4);
  });
});

describe("SphereWall 交互", () => {
  it("方向键转动, 竖向限幅", () => {
    manualFrames();
    render(<SphereWall images={images} />);
    const region = screen.getByRole("region");
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(rot()).toContain("rotateY(10deg)");
    fireEvent.keyDown(region, { key: "ArrowUp" });
    expect(rot()).toContain(`rotateX(${DOME_DEFAULTS.maxVerticalRotationDeg}deg)`);
  });

  it("点图放大成对话框, Escape 关闭并还焦点", () => {
    const frames = manualFrames();
    render(<SphereWall images={images} />);
    const tile = screen.getAllByRole("button", { name: "Photo b" })[0] as HTMLElement;
    tile.focus();
    fireEvent.click(tile);
    act(() => frames.flush(1));
    const dialog = screen.getByRole("dialog", { name: "Photo b" });
    expect(dialog.style.opacity).toBe("1");
    expect(dialog.style.transition).toContain(`opacity ${DOME_DEFAULTS.enlargeTransitionMs}ms ease`);
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(tile);
  });

  it("减弱动效: 对话框无过渡", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    render(<SphereWall images={images} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Photo a" })[0] as HTMLElement);
    act(() => frames.flush(1));
    expect(screen.getByRole("dialog").style.transition).toBe("none");
  });
});
