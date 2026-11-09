/**
 * kits/stage3d: SwingLanyard (规格 Lanyard). 绳的静止长度, 钉住末端, 卡朝向, 路径, 落下与摆停, 拖拽, 点击与键盘翻面, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SwingLanyard, cardAngle, createRope, ropePath, stepRope } from "@src/kits/stage3d/SwingLanyard";
import { boxOf, manualFrames, mockReducedMotion } from "./support";

const calm = { gravity: 1, damping: 0.5, elasticity: 0, breeze: 0 };
const cardEl = (): HTMLElement => screen.getByRole("button", { name: "Badge" });
const pos = (): number[] => (/translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(cardEl().style.transform) ?? []).slice(1).map(Number);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("SwingLanyard 绳", () => {
  it("落下后静止在挂点正下方, 总长约等于绳长", () => {
    const r = createRope(100, 0, 200, 150);
    for (let i = 0; i < 400; i += 1) stepRope(r, 0.016, calm, null);
    expect(r.x[4]).toBeCloseTo(100, 0);
    expect(r.y[4]).toBeGreaterThan(195);
    expect(r.y[4]).toBeLessThan(215);
    expect(Math.abs(cardAngle(r))).toBeLessThan(1);
  });

  it("钉住末端: 卡停在钉点, 朝向随末段", () => {
    const r = createRope(100, 0, 200);
    for (let i = 0; i < 60; i += 1) stepRope(r, 0.016, calm, { x: 260, y: 120 });
    expect(r.x[4]).toBe(260);
    expect(r.y[4]).toBe(120);
    expect(cardAngle(r)).toBeLessThan(-20);
  });

  it("路径从挂点起", () => {
    expect(ropePath(createRope(10, 0, 40)).startsWith("M10.0 0.0 L10.0 10.0")).toBe(true);
  });
});

describe("SwingLanyard 交互", () => {
  it("intro 从上方落下, 摆到挂点下方", () => {
    const frames = manualFrames();
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
    render(<SwingLanyard breeze={0} height={400} />);
    act(() => frames.flush(1));
    expect(pos()[1]).toBeLessThan(60);
    act(() => frames.flush(400));
    const [x, y] = pos();
    expect(Math.abs(x - 200)).toBeLessThan(10);
    expect(y).toBeGreaterThan(190);
    expect(document.querySelector("[data-slot='swing-lanyard-strap']")?.getAttribute("d")).toMatch(/^M200\.0 0\.0/);
  });

  it("拖动卡跟手; 点一下翻面, 键盘也能翻", () => {
    const frames = manualFrames();
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
    render(<SwingLanyard breeze={0} intro={false} height={400} />);
    const root = document.querySelector("[data-slot='swing-lanyard']") as HTMLElement;
    boxOf(root, 0, 0, 400, 400);
    fireEvent.pointerDown(cardEl(), { clientX: 200, clientY: 210, pointerId: 1 });
    fireEvent.pointerMove(cardEl(), { clientX: 320, clientY: 150, pointerId: 1 });
    act(() => frames.flush(30));
    expect(pos()).toEqual([320, 150]);
    fireEvent.pointerUp(cardEl(), { pointerId: 1 });
    expect(cardEl().getAttribute("aria-pressed")).toBe("false");
    fireEvent.pointerDown(cardEl(), { clientX: 200, clientY: 210, pointerId: 1 });
    fireEvent.pointerUp(cardEl(), { pointerId: 1 });
    expect(cardEl().getAttribute("aria-pressed")).toBe("true");
    fireEvent.keyDown(cardEl(), { key: "Enter" });
    expect(cardEl().getAttribute("aria-pressed")).toBe("false");
  });

  it("减弱动效: 不落下, 直接下垂, 翻面到位", () => {
    mockReducedMotion(true);
    manualFrames();
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
    render(<SwingLanyard height={400} />);
    const [x, y] = pos();
    expect(x).toBeCloseTo(200, 0);
    expect(y).toBeGreaterThan(150);
    fireEvent.keyDown(cardEl(), { key: " " });
    expect(cardEl().style.transform).toContain("rotateY(180.0deg)");
  });
});
