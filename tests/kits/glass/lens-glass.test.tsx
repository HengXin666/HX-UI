/**
 * kits/glass: LensGlass (规格 FluidGlass). 形状, 滤镜, 跟随, 拉伸, 倾斜, 漂移, 弹出, 跟指针, 拖拽, 减弱动效.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LensGlass, lensBox, lensFilter, lensFollow, lensIdle, lensStretch, lensTilt } from "@src/kits/glass/LensGlass";
import { manualFrames, mockReducedMotion } from "../support";

const lens = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='lens-glass-lens']") as HTMLElement;
const stage = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='lens-glass']") as HTMLElement;
const at = (): [number, number] => {
  const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(lens().style.transform);
  return [Number(m?.[1]), Number(m?.[2])];
};

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(300);
});
afterEach(() => vi.restoreAllMocks());

describe("LensGlass 纯函数", () => {
  it("形状按 EXTENT 外延; torus 挖空, diamond 转 45 度", () => {
    expect(lensBox("cube", 100).width).toBeCloseTo(132 * 0.72, 9);
    expect(lensBox("torus", 260).mask).toContain("transparent 30%");
    expect(lensBox("diamond", 100).rotate).toBe(45);
  });

  it("跟随 tau 0.02 + smoothness × 0.2; 帧上限 0.05s", () => {
    expect(lensFollow(120, 0.5)).toBeCloseTo(1 - Math.exp(-0.05 / 0.12), 9);
    expect(lensFollow(16, 0)).toBeCloseTo(1 - Math.exp(-0.016 / 0.02), 9);
  });

  it("拉伸沿速度方向, 2000px/s 满 0.22; 倾斜 1500px/s 满 14 度", () => {
    expect(lensStretch(0, 1000)).toEqual({ angle: 90, amount: 0.11 });
    expect(lensStretch(5000, 0).amount).toBe(0.22);
    expect(lensTilt(1500, -750)).toEqual({ x: 7, y: 14 });
  });

  it("闲置漂移绕中心; 滤镜随参数", () => {
    expect(lensIdle(0, 400, 300)).toEqual([200, 150]);
    expect(lensFilter(1, 1, 0)).toBe("blur(0.0px) saturate(1.45) contrast(1.12) brightness(1.08)");
  });
});

describe("LensGlass 交互", () => {
  it("挂上从 0 弹出到 1, 起点在台面中心", () => {
    const frames = manualFrames();
    render(<LensGlass size={100} shape="lens" idle={false} />);
    act(() => frames.flush(1));
    expect(lens().style.transform).toMatch(/scale\(0\.\d+\)$/);
    act(() => frames.flush(120));
    expect(lens().style.transform).toMatch(/scale\(1\.0000\)$/);
    expect(at()).toEqual([200 - 51, 150 - 51]);
  });

  it("follow: 追到指针并在移动中拉伸", () => {
    const frames = manualFrames();
    render(<LensGlass size={100} shape="lens" idle={false} />);
    fireEvent.pointerMove(stage(), { clientX: 300, clientY: 150 });
    act(() => frames.flush(4));
    expect(lens().style.transform).toMatch(/scale\(1\.0[1-9]\d*, 0\.9/);
    act(() => frames.flush(200));
    const [x, y] = at();
    expect(x).toBeCloseTo(300 - 51, 1);
    expect(y).toBeCloseTo(150 - 51, 1);
  });

  it("drag: 只在按住时跟手", () => {
    const frames = manualFrames();
    render(<LensGlass size={100} shape="lens" interaction="drag" idle={false} />);
    fireEvent.pointerMove(stage(), { clientX: 50, clientY: 50 });
    act(() => frames.flush(60));
    expect(at()).toEqual([149, 99]);
    fireEvent.pointerDown(stage(), { clientX: 100, clientY: 60, pointerId: 1 });
    act(() => frames.flush(2));
    expect(at()).toEqual([49, 9]);
  });

  it("减弱动效: 直接贴指针, 无形变", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    render(<LensGlass size={100} shape="lens" />);
    fireEvent.pointerMove(stage(), { clientX: 120, clientY: 80 });
    act(() => frames.flush(2));
    expect(at()).toEqual([69, 29]);
    expect(lens().style.transform).toContain("scale(1.0000, 1.0000)");
  });
});
