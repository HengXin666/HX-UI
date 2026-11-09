/**
 * kits/card: MirrorCard (规格 ReflectiveCard). 金属面, 反射滤镜, 扫光, 入场, 倾斜, 视频就绪淡入, 摄像头失败回调, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MirrorCard, mirrorFilter, mirrorMetal, mirrorSheen } from "@src/kits/card/MirrorCard";
import { boxOf, manualFrames, mockReducedMotion } from "./support";

const card = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='mirror-card']") as HTMLElement;
const v = (name: string): string => card().style.getPropertyValue(name);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("MirrorCard 纯函数", () => {
  it("金属面只用 token 混色; 反射滤镜随粗糙度", () => {
    const g = mirrorMetal("var(--foreground)", 1);
    expect(g).toContain("color-mix(in oklab, var(--foreground) 26%, var(--card))");
    expect(g).not.toMatch(/#|rgb|hsl/);
    expect(mirrorFilter(6, 0.3, 1)).toBe("blur(4.2px) grayscale(1) contrast(1.1)");
  });

  it("扫光: 入场从 -30% 到 130%, 之后随倾斜摆", () => {
    expect(mirrorSheen(0, 0, 12, 0.6)).toBe(-30);
    expect(mirrorSheen(0.5, 0, 12, 0.6)).toBe(50);
    expect(mirrorSheen(1, 12, 12, 0.6)).toBeCloseTo(94, 9);
  });
});

describe("MirrorCard 交互", () => {
  it("入场扫光 1.4s 后停在中位; 证件字段", () => {
    const frames = manualFrames();
    render(<MirrorCard name="Ada" role="Dev" badge="Verified" idValue="1234" />);
    expect(screen.getByRole("article", { name: "Ada" })).toBeTruthy();
    expect(screen.getByText("1234")).toBeTruthy();
    act(() => frames.flush(10));
    expect(Number.parseFloat(v("--sheen"))).toBeLessThan(50);
    act(() => frames.flush(120));
    expect(v("--sheen")).toBe("50.0%");
  });

  it("倾斜与归位", () => {
    const frames = manualFrames();
    render(<MirrorCard name="Ada" />);
    boxOf(card(), 0, 0, 320, 200);
    act(() => {
      fireEvent.pointerMove(card(), { clientX: 320, clientY: 100 });
      frames.flush(300);
    });
    expect(v("--ry")).toBe("12.00deg");
    expect(v("--light")).toBe("1.000");
    act(() => {
      fireEvent.pointerLeave(card());
      frames.flush(400);
    });
    expect(v("--ry")).toBe("0.00deg");
  });

  it("视频可播放后反射层淡入", () => {
    const frames = manualFrames();
    render(<MirrorCard name="Ada" videoSrc="v.mp4" />);
    const vid = document.querySelector("video") as HTMLVideoElement;
    expect(vid.style.transform).toBe("scaleX(-1) scale(1.2)");
    fireEvent.canPlay(vid);
    act(() => frames.flush(200));
    expect(v("--reflect")).toBe("1.000");
  });

  it("摄像头不可用时回调", () => {
    manualFrames();
    vi.stubGlobal("navigator", { ...navigator, mediaDevices: undefined });
    const err = vi.fn();
    render(<MirrorCard name="Ada" webcam onWebcamError={err} />);
    expect(err).toHaveBeenCalledOnce();
  });

  it("减弱动效: 无入场扫光, 不倾斜", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    render(<MirrorCard name="Ada" />);
    boxOf(card(), 0, 0, 320, 200);
    act(() => {
      fireEvent.pointerMove(card(), { clientX: 320, clientY: 100 });
      frames.flush(3);
    });
    expect(v("--sheen")).toBe("50.0%");
    expect(v("--ry")).toBe("0.00deg");
  });
});
