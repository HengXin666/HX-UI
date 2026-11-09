/**
 * kits/stack: SpreadCards (规格 BounceCards). 摆位, 推开, 延迟, 弹簧换算, 入场, 悬停, 键盘, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SpreadCards, hoverPose, popDelay, restPose } from "@src/kits/stack/SpreadCards";
import { bounceSpring } from "@src/kits/stack/tokens";
import { manualFrames, mockReducedMotion } from "./support";

const images = ["a", "b", "c", "d", "e"].map((k) => ({ src: `/${k}.jpg`, alt: k.toUpperCase() }));
const t = (name: string): string => screen.getByRole("button", { name }).style.transform;

afterEach(() => vi.restoreAllMocks());

describe("SpreadCards 纯函数", () => {
  it("以中间为轴错开 spread, 转角按 PATTERN, arc 两侧下沉", () => {
    expect(restPose(0, 5, 85, 10, 0)).toEqual({ x: -170, y: 0, rotate: 10, scale: 1 });
    expect(restPose(4, 5, 85, 10, 3).y).toBe(12);
  });

  it("悬停: 本张摆正放大, 两侧推开 pushDistance", () => {
    const rest = restPose(1, 5, 85, 10, 0);
    expect(hoverPose(1, 1, rest, 160, 1.06)).toMatchObject({ rotate: 0, scale: 1.06 });
    expect(hoverPose(0, 1, restPose(0, 5, 85, 10, 0), 160, 1.06).x).toBe(-330);
    expect(hoverPose(3, 1, restPose(3, 5, 85, 10, 0), 160, 1.06).x).toBe(245);
  });

  it("延迟 0.5s 起每张 0.06s; 阻尼 2 (1 - 0.85 b) sqrt(k)", () => {
    expect(popDelay(2, 0.5, 0.06)).toBeCloseTo(620, 9);
    expect(bounceSpring(170, 0.6).damping).toBeCloseTo(2 * 0.49 * Math.sqrt(170), 9);
  });
});

describe("SpreadCards 交互", () => {
  it("入场: 延迟到点前为 0, 之后弹到 1", () => {
    const frames = manualFrames();
    render(<SpreadCards images={images} />);
    act(() => frames.flush(20));
    expect(t("A")).toContain("scale(0)");
    act(() => frames.flush(200));
    expect(t("A")).toContain("scale(1)");
  });

  it("悬停一张: 它摆正放大, 邻张被推开; 方向键移焦", () => {
    const frames = manualFrames();
    render(<SpreadCards images={images} />);
    act(() => frames.flush(200));
    fireEvent.mouseEnter(screen.getByRole("button", { name: "C" }));
    act(() => frames.flush(200));
    expect(t("C")).toContain("rotate(0deg) scale(1.06)");
    expect(t("D")).toContain("translate(245px, 0px)");
    screen.getByRole("button", { name: "C" }).focus();
    fireEvent.keyDown(screen.getByRole("button", { name: "C" }), { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "D" }));
  });

  it("减弱动效: 不弹出, 悬停直接到位", () => {
    mockReducedMotion(true);
    manualFrames();
    render(<SpreadCards images={images} />);
    expect(t("A")).toContain("scale(1)");
    fireEvent.mouseEnter(screen.getByRole("button", { name: "B" }));
    expect(t("A")).toContain("translate(-330px, 0px)");
  });
});
