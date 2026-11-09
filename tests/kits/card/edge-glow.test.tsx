/**
 * kits/card: EdgeGlow (规格 BorderGlow). 离边远近, 强度, 方位角, 光锥, 扫边时间轴, 指针点亮与消退, 自演示, 减弱动效.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EdgeGlow, edgeAngle, edgeCone, edgeLevel, edgeProximity, edgeSweep } from "@src/kits/card/EdgeGlow";
import { boxOf, manualFrames, mockReducedMotion } from "./support";

const card = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='edge-glow']") as HTMLElement;
const v = (name: string): string => card().style.getPropertyValue(name);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("EdgeGlow 纯函数", () => {
  it("远近与强度: 只在离边 sensitivity 以内亮", () => {
    expect(edgeProximity(0, 0)).toBe(0);
    expect(edgeProximity(-0.85, 0.2)).toBeCloseTo(85, 9);
    expect(edgeLevel(50, 30)).toBe(0);
    expect(edgeLevel(85, 30)).toBeCloseTo(0.5, 9);
    expect(edgeLevel(100, 30)).toBe(1);
  });

  it("方位角: 上 0, 右 90, 下 180, 左 270", () => {
    expect(edgeAngle(0, -1)).toBeCloseTo(0, 9);
    expect(edgeAngle(1, 0)).toBeCloseTo(90, 9);
    expect(edgeAngle(0, 1)).toBeCloseTo(180, 9);
    expect(edgeAngle(-1, 0)).toBeCloseTo(270, 9);
  });

  it("光锥以 --edge-angle 为中心, 张角 2 × spread", () => {
    expect(edgeCone(["var(--a)", "var(--b)"], 25)).toBe("conic-gradient(from calc(var(--edge-angle, 0deg) - 25deg), transparent 0deg, var(--a) 0.0deg, var(--b) 50.0deg, transparent 50.0deg)");
  });

  it("扫边时间轴", () => {
    expect(edgeSweep(0)).toEqual({ proximity: 0, angle: 0 });
    expect(edgeSweep(500).proximity).toBe(100);
    expect(edgeSweep(1500).angle).toBeCloseTo(180, 9);
    expect(edgeSweep(3750).angle).toBeCloseTo(360, 9);
    expect(edgeSweep(4000).proximity).toBe(0);
  });
});

describe("EdgeGlow 交互", () => {
  it("指针贴右边亮起并朝右; 离开消退, 角度保留", () => {
    render(<EdgeGlow>Hi</EdgeGlow>);
    boxOf(card(), 0, 0, 200, 100);
    fireEvent.pointerMove(card(), { clientX: 199, clientY: 50 });
    expect(Number(v("--edge"))).toBeGreaterThan(0.9);
    expect(v("--edge-angle")).toBe("90.0deg");
    expect(card().dataset.glow).toBe("on");
    expect(v("--edge-fade")).toBe("opacity 250ms ease-out");
    fireEvent.pointerMove(card(), { clientX: 100, clientY: 50 });
    expect(v("--edge")).toBe("0.000");
    fireEvent.pointerLeave(card());
    expect(card().dataset.glow).toBe("off");
    expect(v("--edge-fade")).toBe("opacity 750ms ease-in-out");
    expect(v("--edge-angle")).toBe("90.0deg");
  });

  it("animated: 自演示扫一圈后熄灭", () => {
    const frames = manualFrames();
    render(<EdgeGlow animated>Hi</EdgeGlow>);
    act(() => frames.flush(60));
    expect(v("--edge")).toBe("1.000");
    act(() => frames.flush(300));
    expect(v("--edge")).toBe("0.000");
    expect(card().dataset.glow).toBe("off");
  });

  it("减弱动效: 不演示, 无过渡", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    render(<EdgeGlow animated>Hi</EdgeGlow>);
    act(() => frames.flush(60));
    expect(v("--edge")).toBe("");
    expect(v("--edge-fade")).toBe("none");
  });
});
