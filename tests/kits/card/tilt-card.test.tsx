/**
 * kits/card: TiltCard (规格 TiltedCard). 倾斜目标, 平滑度弹簧, 反光, 甩动角, 点击判定, 倾斜托起, 翻面, 受控, 键盘, 提示框, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TiltCard, glarePose, isTap, tiltSpring, tiltTarget, tipAngle } from "@src/kits/card/TiltCard";
import { boxOf, manualFrames, mockReducedMotion } from "./support";

const face = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='tilt-card-face']") as HTMLElement;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("TiltCard 纯函数", () => {
  it("倾斜目标与平滑度弹簧", () => {
    expect(tiltTarget(1, 0.5, 12)).toEqual({ rx: -6, ry: 12 });
    expect(tiltTarget(3, -3, 10)).toEqual({ rx: 10, ry: 10 });
    const sp = tiltSpring(0.5);
    expect(sp.stiffness).toBeCloseTo(256, 9);
    expect(sp.damping).toBeCloseTo(25.6, 9);
  });

  it("反光位置, 甩动角钳到 ±14, 6px 内算点击", () => {
    expect(glarePose(1, 0)).toEqual({ x: 100, y: 50, angle: 90 });
    expect(tipAngle(500)).toBe(-6);
    expect(tipAngle(-5000)).toBe(14);
    expect(isTap(3, 4)).toBe(true);
    expect(isTap(5, 5)).toBe(false);
  });
});

describe("TiltCard 交互", () => {
  it("指针在右下: 卡面朝右下倾并托起; 离开归位", () => {
    const frames = manualFrames();
    render(<TiltCard captionText="hi" />);
    boxOf(face(), 0, 0, 300, 300);
    act(() => {
      fireEvent.pointerMove(face(), { clientX: 300, clientY: 300 });
      frames.flush(300);
    });
    expect(face().style.transform).toBe("rotateX(-12.00deg) rotateY(12.00deg) scale(1.0500)");
    const tip = screen.getByText("hi");
    expect(tip.style.opacity).toBe("1.000");
    expect(tip.style.transform).toMatch(/^translate\(300\.0px, 300\.0px\)/);
    act(() => {
      fireEvent.pointerLeave(face());
      frames.flush(400);
    });
    expect(face().style.transform).toBe("rotateX(0.00deg) rotateY(0.00deg) scale(1.0000)");
    expect(tip.style.opacity).toBe("0.000");
  });

  it("有背面: 点击翻面, 拖动不翻; 键盘也能翻", () => {
    const frames = manualFrames();
    const flip = vi.fn();
    render(<TiltCard altText="card" backContent={<p>back</p>} onFlip={flip} />);
    const btn = screen.getByRole("button", { name: "card" });
    boxOf(btn, 0, 0, 300, 300);
    fireEvent.pointerDown(btn, { clientX: 10, clientY: 10 });
    fireEvent.pointerUp(btn, { clientX: 40, clientY: 10 });
    expect(flip).not.toHaveBeenCalled();
    fireEvent.pointerDown(btn, { clientX: 10, clientY: 10 });
    fireEvent.pointerUp(btn, { clientX: 12, clientY: 12 });
    expect(flip).toHaveBeenCalledWith(true);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    act(() => frames.flush(400));
    expect(btn.style.transform).toContain("rotateY(180.00deg)");
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("受控 flipped 不自改", () => {
    manualFrames();
    const flip = vi.fn();
    render(<TiltCard altText="card" backContent="b" flipped={false} onFlip={flip} />);
    fireEvent.keyDown(screen.getByRole("button"), { key: " " });
    expect(flip).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("false");
  });

  it("无背面不是按钮", () => {
    manualFrames();
    render(<TiltCard imageSrc="a.png" altText="x" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("img", { name: "x" })).toBeTruthy();
  });

  it("减弱动效: 不倾斜不托起, 翻面直接到位", () => {
    mockReducedMotion(true);
    manualFrames();
    render(<TiltCard altText="card" backContent="b" />);
    boxOf(face(), 0, 0, 300, 300);
    fireEvent.pointerMove(face(), { clientX: 300, clientY: 0 });
    expect(face().style.transform).toBe("rotateX(0.00deg) rotateY(0.00deg) scale(1.0000)");
    fireEvent.keyDown(face(), { key: "Enter" });
    expect(face().style.transform).toContain("rotateY(180.00deg)");
  });
});
