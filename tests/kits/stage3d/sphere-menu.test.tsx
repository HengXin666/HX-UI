/**
 * kits/stage3d: SphereMenu (规格 InfiniteMenu). 球面布点, 朝前程度, 吸附目标, 外观, 吸附与当前项, 键盘切换与打开, 自动播放, 拖拽, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SphereMenu, fibonacciSphere, frontmost, frontness, nearestOfItem, snapTarget, tileLook, wrapAngle } from "@src/kits/stage3d/SphereMenu";
import { manualFrames, mockReducedMotion } from "./support";

const items = ["A", "B", "C", "D"].map((t) => ({ image: `${t}.png`, title: t }));
const box = (): HTMLElement => screen.getByRole("listbox", { name: "Menu" });
const selected = (): string | undefined => screen.getAllByRole("option", { hidden: true }).find((o) => o.getAttribute("aria-selected") === "true")?.textContent ?? undefined;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("SphereMenu 球面", () => {
  it("斐波那契布点在单位球上, 纬度单调", () => {
    const pts = fibonacciSphere(20);
    expect(pts).toHaveLength(20);
    expect(pts[0]?.lat).toBeCloseTo(Math.PI / 2, 9);
    expect(pts[19]?.lat).toBeCloseTo(-Math.PI / 2, 9);
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(0 - Math.PI, 9);
    expect(wrapAngle(1 + Math.PI * 4)).toBeCloseTo(1, 9);
  });

  it("吸附目标把格子转到正前方", () => {
    const pts = fibonacciSphere(40);
    const p = pts[13];
    if (!p) throw new Error("no point");
    const t = snapTarget(p, 10);
    expect(frontness(p, t.yaw, t.pitch)).toBeCloseTo(1, 9);
    expect(Math.abs(t.yaw - 10)).toBeLessThanOrEqual(Math.PI);
    expect(frontmost(pts, t.yaw, t.pitch)).toBe(13);
    expect(nearestOfItem(pts, 1, 4, t.yaw, t.pitch) % 4).toBe(1);
  });

  it("外观: 背面透明, 聚焦格不压暗", () => {
    expect(tileLook(-0.5, 0.5).alpha).toBe(0);
    expect(tileLook(1, 0.5)).toEqual({ alpha: 1, focus: 1, shade: 1 });
    expect(tileLook(0.5, 0.5).shade).toBe(0.5);
  });
});

describe("SphereMenu 交互", () => {
  it("挂上后吸附到最朝前的格, 键盘切到下一项并回调", () => {
    const frames = manualFrames();
    const change = vi.fn();
    render(<SphereMenu items={items} count={24} autoplay={0} onActiveChange={change} />);
    act(() => frames.flush(400));
    const first = selected();
    expect(first).toBeTruthy();
    fireEvent.keyDown(box(), { key: "ArrowRight" });
    act(() => frames.flush(400));
    const order = items.map((i) => i.title);
    expect(selected()).toBe(order[(order.indexOf(first as string) + 1) % 4]);
    expect(change).toHaveBeenLastCalledWith(order.indexOf(selected() as string));
  });

  it("Enter 打开当前项", () => {
    const frames = manualFrames();
    const click = vi.fn();
    render(<SphereMenu items={items} count={24} autoplay={0} onItemClick={click} />);
    act(() => frames.flush(400));
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(click).toHaveBeenCalledWith(expect.objectContaining({ title: selected() }), expect.any(Number));
  });

  it("autoplay: 空闲时自己转到下一项", () => {
    const frames = manualFrames();
    render(<SphereMenu items={items} count={24} autoplay={1} />);
    act(() => frames.flush(300));
    const first = selected();
    act(() => frames.flush(400));
    expect(selected()).not.toBe(first);
  });

  it("拖拽转球", () => {
    const frames = manualFrames();
    render(<SphereMenu items={items} count={24} autoplay={0} />);
    act(() => frames.flush(300));
    const ball = document.querySelector<HTMLElement>("[data-slot='sphere-menu-ball']") as HTMLElement;
    const before = ball.style.transform;
    fireEvent.pointerDown(box(), { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(box(), { clientX: 200, clientY: 0, pointerId: 1 });
    act(() => frames.flush(2));
    expect(ball.style.transform).not.toBe(before);
    fireEvent.pointerUp(box(), { pointerId: 1 });
  });

  it("减弱动效: 不自动播放, 格子直接显现", () => {
    mockReducedMotion(true);
    const frames = manualFrames();
    render(<SphereMenu items={items} count={24} autoplay={1} />);
    act(() => frames.flush(5));
    const first = selected();
    act(() => frames.flush(300));
    expect(selected()).toBe(first);
    const visible = [...document.querySelectorAll<HTMLElement>("[data-slot='sphere-menu-tile']")].filter((t) => t.style.visibility === "visible");
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.some((t) => t.style.opacity === "1.000")).toBe(true);
  });
});
