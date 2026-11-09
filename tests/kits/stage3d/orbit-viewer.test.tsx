/**
 * kits/stage3d: OrbitViewer (规格 ModelViewer). 透视, 拖转与惯性, 自转, 转台俯仰, 缩放钳位, 复位, 键盘, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrbitViewer, createOrbit, orbitDrag, orbitPerspective, orbitTransform, stepOrbit, type OrbitOptions } from "@src/kits/stage3d/OrbitViewer";
import { manualFrames, mockReducedMotion } from "./support";

const base: OrbitOptions = { autoRotate: false, autoRotateSpeed: 0.35, turntable: false, tiltDeg: 10, initialYaw: 0, initialPitch: 0, reduced: false };
const stage = (): HTMLElement => document.querySelector<HTMLElement>("[data-slot='orbit-viewer-stage']") as HTMLElement;
const viewer = (): HTMLElement => screen.getByRole("group", { name: "Box" });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("OrbitViewer 转台", () => {
  it("视场 30 度的透视", () => {
    expect(orbitPerspective(400)).toBeCloseTo(200 / Math.tan(Math.PI / 12), 6);
  });

  it("拖 100px 转 0.65 rad; 松手惯性按 4.5/s 衰减", () => {
    const s = createOrbit(base, false);
    orbitDrag(s, 100, 0, 0.1);
    expect(s.yaw).toBeCloseTo(0.65, 9);
    expect(s.vyaw).toBeCloseTo(6.5, 9);
    stepOrbit(s, base, 0.05);
    expect(s.vyaw).toBeCloseTo(6.5 * Math.exp(-0.225), 9);
    for (let i = 0; i < 200; i += 1) stepOrbit(s, base, 0.05);
    expect(s.vyaw).toBe(0);
  });

  it("自转趋近 autoRotateSpeed; 转台俯仰回到 tilt", () => {
    const o = { ...base, autoRotate: true, turntable: true };
    const s = createOrbit(o, false);
    for (let i = 0; i < 200; i += 1) stepOrbit(s, o, 0.05);
    expect(s.spin).toBeCloseTo(0.35, 4);
    expect(s.pitch).toBeCloseTo(Math.PI / 18, 4);
  });

  it("复位回初始角", () => {
    const s = createOrbit(base, false);
    orbitDrag(s, 300, 50, 0.1);
    s.resetting = true;
    for (let i = 0; i < 200; i += 1) stepOrbit(s, base, 0.05);
    expect(s.yaw).toBe(0);
    expect(s.pitch).toBe(0);
    expect(orbitTransform(s)).toBe("scale(1.0000) rotateX(0.00deg) rotateY(0.00deg)");
  });
});

describe("OrbitViewer 交互", () => {
  it("拖动转, 滚轮缩放钳到 maxZoom, 双击复位", () => {
    const frames = manualFrames();
    render(
      <OrbitViewer alt="Box" autoRotate={false} enableParallax={false} initialPitch={0}>
        <div>cube</div>
      </OrbitViewer>,
    );
    fireEvent.pointerDown(viewer(), { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(viewer(), { clientX: 100, clientY: 0, pointerId: 1 });
    fireEvent.pointerUp(viewer(), { pointerId: 1 });
    act(() => frames.flush(1));
    const yaw = Number(/rotateY\(([-\d.]+)deg\)/.exec(stage().style.transform)?.[1]);
    expect(yaw).toBeGreaterThanOrEqual(37.2);
    fireEvent.wheel(viewer(), { deltaY: -5000 });
    act(() => frames.flush(200));
    expect(stage().style.transform).toMatch(/^scale\(2\.0000\)/);
    fireEvent.doubleClick(viewer());
    act(() => frames.flush(300));
    expect(stage().style.transform).toBe("scale(1.0000) rotateX(0.00deg) rotateY(0.00deg)");
  });

  it("键盘: 方向键转, Home 复位", () => {
    const frames = manualFrames();
    render(<OrbitViewer alt="Box" autoRotate={false} enableParallax={false} initialPitch={0} />);
    fireEvent.keyDown(viewer(), { key: "ArrowRight" });
    expect(stage().style.transform).toContain("rotateY(11.46deg)");
    fireEvent.keyDown(viewer(), { key: "Home" });
    act(() => frames.flush(300));
    expect(stage().style.transform).toContain("rotateY(0.00deg)");
  });

  it("减弱动效: 不自转, 无惯性", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    render(<OrbitViewer alt="Box" initialPitch={0} />);
    act(() => frames.flush(100));
    expect(stage().style.transform).toBe("scale(1.0000) rotateX(0.00deg) rotateY(0.00deg)");
    expect(viewer().style.opacity).toBe("1");
  });
});
