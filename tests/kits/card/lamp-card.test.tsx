/**
 * kits/card: LampCard (规格 SpotlightCard). 跟随 tau, 近场, 渐变, 光斑追指针, 卡外渐弱, 聚焦居中, 闪光, 减弱动效.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LampCard, lampFollowTau, lampGradient, lampReach } from "@src/kits/card/LampCard";
import { cardPoint, follow } from "@src/kits/card/tokens";
import { boxOf, manualFrames, mockReducedMotion } from "./support";

const card = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='lamp-card']") as HTMLElement;
const v = (name: string): string => card().style.getPropertyValue(name);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("LampCard 纯函数", () => {
  it("跟随 tau 与近场", () => {
    expect(lampFollowTau(0.3)).toBeCloseTo(0.081, 9);
    expect(lampFollowTau(0)).toBe(0);
    expect(lampReach(0, 80)).toBe(1);
    expect(lampReach(40, 80)).toBe(0.5);
    expect(lampReach(100, 80)).toBe(0);
  });

  it("渐变实心段 = 1 - softness, 无色值", () => {
    const g = lampGradient("circle", 240, 0.7, "var(--foreground)");
    expect(g).toBe("radial-gradient(circle 120px at var(--lx, 50%) var(--ly, 50%), var(--foreground) 30%, transparent 100%)");
    expect(lampGradient("ellipse", 200, 0, "x")).toContain("ellipse 100px 60px");
  });

  it("族工具: follow 升降分开并钳 dt; cardPoint 算卡外距离", () => {
    expect(follow(0, 1, 1, 0.1)).toBeCloseTo(1 - Math.exp(-0.5), 9);
    expect(follow(1, 0, 0.02, { rise: 0.1, fall: 0.02 })).toBeCloseTo(Math.exp(-1), 9);
    const p = cardPoint({ left: 10, top: 10, width: 100, height: 50 }, 140, 35);
    expect(p).toEqual({ x: 130, y: 25, nx: 1.6, ny: 0, out: 30 });
  });
});

describe("LampCard 交互", () => {
  it("指针在卡内: 光斑贴过去并亮到 1; 卡外近场渐弱; 远离熄灭", () => {
    const frames = manualFrames();
    render(<LampCard>Hi</LampCard>);
    boxOf(card(), 0, 0, 200, 100);
    act(() => {
      fireEvent.pointerMove(window, { clientX: 50, clientY: 40 });
      frames.flush(200);
    });
    expect(v("--lx")).toBe("50.0px");
    expect(v("--ly")).toBe("40.0px");
    expect(v("--lamp")).toBe("1.000");
    act(() => {
      fireEvent.pointerMove(window, { clientX: 240, clientY: 50 });
      frames.flush(200);
    });
    expect(v("--lamp")).toBe("0.500");
    act(() => {
      fireEvent.pointerMove(window, { clientX: 600, clientY: 50 });
      frames.flush(300);
    });
    expect(v("--lamp")).toBe("0.000");
  });

  it("按下闪光放大, 松开回落", () => {
    const frames = manualFrames();
    render(<LampCard>Hi</LampCard>);
    boxOf(card(), 0, 0, 200, 100);
    act(() => {
      fireEvent.pointerMove(window, { clientX: 50, clientY: 40 });
      fireEvent.pointerDown(card());
      frames.flush(200);
    });
    expect(v("--lamp")).toBe("1.600");
    expect(v("--lamp-scale")).toBe("1.150");
    act(() => {
      fireEvent.pointerUp(window);
      frames.flush(300);
    });
    expect(v("--lamp")).toBe("1.000");
  });

  it("内部聚焦: 光斑停在卡心", () => {
    const frames = manualFrames();
    render(
      <LampCard>
        <button type="button">go</button>
      </LampCard>,
    );
    boxOf(card(), 0, 0, 200, 100);
    act(() => {
      fireEvent.focus(card().querySelector("button") as HTMLElement);
      frames.flush(200);
    });
    expect(v("--lamp")).toBe("1.000");
    expect(v("--lx")).toBe("100.0px");
  });

  it("ambient: 无指针也留弱光", () => {
    const frames = manualFrames();
    render(<LampCard ambient>Hi</LampCard>);
    act(() => frames.flush(200));
    expect(v("--lamp")).toBe("0.350");
  });

  it("减弱动效: 一帧到位, 无闪光", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    render(<LampCard>Hi</LampCard>);
    boxOf(card(), 0, 0, 200, 100);
    act(() => {
      fireEvent.pointerMove(window, { clientX: 30, clientY: 20 });
      fireEvent.pointerDown(card());
      frames.flush(2);
    });
    expect(v("--lx")).toBe("30.0px");
    expect(v("--lamp")).toBe("1.000");
  });
});
