/**
 * kits/stack: GlowBento (规格 MagicBento). 列数, 跨格收窄, 趋近, 光强, 姿态, 入场, 光斑, 悬停热度, 波纹, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GlowBento, bentoColumns, bentoEase, bentoPose, bentoProximity, bentoSpan } from "@src/kits/stack/GlowBento";
import { fakeIntersection, manualFrames, mockReducedMotion } from "./support";

const items = [{ title: "A", span: { col: 2 } }, { title: "B" }, { title: "C", description: "long text" }];
const item = (i: number): HTMLElement => document.querySelectorAll<HTMLElement>("[data-slot='glow-bento-item']")[i] as HTMLElement;
const cell = (name: string): HTMLElement => screen.getByRole("button", { name: new RegExp(name) });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("GlowBento 纯函数", () => {
  it("每列至少 150px 减列; 跨格合宽不到 200px 收成一列", () => {
    expect(bentoColumns(1000, 4, 12)).toBe(4);
    expect(bentoColumns(400, 4, 12)).toBe(2);
    expect(bentoColumns(100, 4, 12)).toBe(1);
    expect(bentoSpan(2, 4, 90, 12)).toBe(1);
    expect(bentoSpan(2, 4, 150, 12)).toBe(2);
    expect(bentoSpan(3, 2, 150, 12)).toBe(2);
  });

  it("趋近升降各用 tau; 帧间隔上限 0.05s", () => {
    expect(bentoEase(0, 1, 0.12, { rise: 0.12, fall: 0.4 })).toBeCloseTo(1 - Math.exp(-0.05 / 0.12), 9);
    expect(bentoEase(1, 0, 0.04, { rise: 0.12, fall: 0.4 })).toBeCloseTo(Math.exp(-0.1), 9);
  });

  it("格内光强为 1, 离开 spotlightRadius 为 0; 姿态乘热度", () => {
    const rect = { x: 0, y: 0, w: 100, h: 100 };
    expect(bentoProximity(50, 50, rect, 300)).toBe(1);
    expect(bentoProximity(250, 50, rect, 300)).toBeCloseTo(0.5, 9);
    expect(bentoProximity(500, 50, rect, 300)).toBe(0);
    expect(bentoPose(1, -1, 0.5, true, true)).toEqual({ rx: 3, ry: 3, tx: 3, ty: -3 });
    expect(bentoPose(1, 1, 1, false, false)).toEqual({ rx: 0, ry: 0, tx: 0, ty: 0 });
  });
});

describe("GlowBento 交互", () => {
  it("进视口才入场, 每格错峰 80ms", () => {
    manualFrames();
    const io = fakeIntersection();
    render(<GlowBento items={items} />);
    expect(item(1).style.opacity).toBe("0");
    act(() => io.fire([screen.getByRole("list")], true));
    expect(item(1).style.opacity).toBe("1");
    expect(item(2).style.transitionDelay).toBe("160ms");
  });

  it("指针进入光斑亮起, 悬停格热度升到 1, 离开后回落", () => {
    const frames = manualFrames();
    render(<GlowBento items={items} intro={false} />);
    const light = document.querySelector<HTMLElement>("[data-slot='glow-bento-light']") as HTMLElement;
    fireEvent.pointerMove(screen.getByRole("list"), { clientX: 30, clientY: 40 });
    fireEvent.pointerEnter(cell("B"));
    act(() => frames.flush(120));
    expect(light.style.opacity).toBe("1");
    expect(light.style.getPropertyValue("--lx")).toBe("30.0px");
    expect(light.style.getPropertyValue("--ly")).toBe("40.0px");
    expect(cell("B").style.getPropertyValue("--hot")).toBe("1.000");
    fireEvent.pointerLeave(screen.getByRole("list"));
    act(() => frames.flush(240));
    expect(light.style.opacity).toBe("0");
    expect(cell("B").style.getPropertyValue("--hot")).toBe("0.000");
  });

  it("点击放波纹并回调序号", () => {
    manualFrames();
    const animate = vi.fn(() => ({ onfinish: null }));
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    const click = vi.fn();
    render(<GlowBento items={items} intro={false} onItemClick={click} />);
    fireEvent.click(cell("C"));
    expect(click).toHaveBeenCalledWith(2);
    expect(cell("C").querySelector("[data-slot='glow-bento-wave']")).not.toBeNull();
    expect(animate).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ duration: 1100 }));
    delete (HTMLElement.prototype as { animate?: unknown }).animate;
  });

  it("减弱动效: 直接在位, 无波纹", () => {
    mockReducedMotion(true);
    manualFrames();
    render(<GlowBento items={items} />);
    expect(item(0).style.opacity).toBe("1");
    fireEvent.click(cell("A"));
    expect(cell("A").querySelector("[data-slot='glow-bento-wave']")).toBeNull();
  });
});
