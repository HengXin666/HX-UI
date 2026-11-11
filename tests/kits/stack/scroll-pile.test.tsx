/**
 * kits/stack: ScrollPile (规格 ScrollStack). 钉住线, 姿态, 平滑, 叠完回调, 滚轮平滑, 减弱动效.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PILE_DEFAULTS, ScrollPile, pileComplete, pilePose, pileSmooth, stackOffset } from "@src/kits/stack/ScrollPile";
import { manualFrames, mockReducedMotion } from "../support";

const o = { ...PILE_DEFAULTS, stack: 100 };
const tops = [0, 500, 1000];

afterEach(() => vi.restoreAllMocks());

describe("ScrollPile 纯函数", () => {
  it("钉住线: 百分比按视口, 数字为 px", () => {
    expect(stackOffset("15%", 600)).toBe(90);
    expect(stackOffset(40, 600)).toBe(40);
  });

  it("第 0 张钉住后停在线上, 被盖满时缩到 baseScale 并压暗 0.2", () => {
    expect(pilePose(0, tops, 0, o).y).toBe(100);
    const full = pilePose(0, tops, 852, o);
    expect(full.y).toBe(952);
    expect(full.scale).toBeCloseTo(0.8, 9);
    expect(full.brightness).toBeCloseTo(0.8, 9);
  });

  it("第 1 张目标缩放 baseScale + itemScale, 末张不缩; hold 之后一起离开", () => {
    expect(pilePose(1, tops, 852, o).scale).toBeCloseTo(0.85, 9);
    expect(pilePose(2, tops, 852, o).scale).toBe(1);
    expect(pilePose(0, tops, 2000, o).y).toBe(852 + 200 + 100);
  });

  it("平滑: 一帧 1/60 秒剩 0.9 的差, 两帧剩 0.81", () => {
    expect(pileSmooth(0, 100, 1000 / 60)).toBeCloseTo(10, 6);
    expect(pileSmooth(0, 100, 2000 / 60)).toBeCloseTo(19, 6);
  });

  it("末张钉住即叠完", () => {
    expect(pileComplete(tops, 851, o)).toBe(false);
    expect(pileComplete(tops, 852, o)).toBe(true);
  });
});

function mount(reduce = false): { el: HTMLElement; done: ReturnType<typeof vi.fn>; frames: ReturnType<typeof manualFrames> } {
  if (reduce) mockReducedMotion(true);
  const frames = manualFrames();
  vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
    return this.dataset.slot === "scroll-pile-card" ? [...(this.parentElement?.children ?? [])].indexOf(this) * 500 : 0;
  });
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(600);
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(3000);
  const done = vi.fn();
  render(
    <ScrollPile stackPosition={100} onStackComplete={done}>
      <div>A</div>
      <div>B</div>
      <div>C</div>
    </ScrollPile>,
  );
  const el = screen.getByRole("region");
  let top = 0;
  Object.defineProperty(el, "scrollTop", { configurable: true, get: () => top, set: (v: number) => (top = v) });
  return { el, done, frames };
}
const card = (i: number): HTMLElement => document.querySelectorAll<HTMLElement>("[data-slot='scroll-pile-card']")[i] as HTMLElement;

describe("ScrollPile 交互", () => {
  it("滚动后卡片钉住并缩放, 叠完回调一次", () => {
    const { el, done } = mount();
    el.scrollTop = 900;
    fireEvent.scroll(el);
    expect(card(0).style.transform).toContain("translate3d(0, 1000px, 0)");
    expect(card(0).style.transform).toContain("scale(0.8)");
    expect(card(0).style.filter).toBe("brightness(0.8)");
    fireEvent.scroll(el);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("滚轮按平滑推进, 不一步到位", () => {
    const { el, frames } = mount();
    fireEvent.wheel(el, { deltaY: 300 });
    act(() => frames.flush(1));
    expect(el.scrollTop).toBeGreaterThan(0);
    expect(el.scrollTop).toBeLessThan(300);
    act(() => frames.flush(120));
    expect(el.scrollTop).toBe(300);
  });

  it("减弱动效: 滚轮交给原生滚动", () => {
    const { el, frames } = mount(true);
    fireEvent.wheel(el, { deltaY: 300 });
    act(() => frames.flush(5));
    expect(el.scrollTop).toBe(0);
  });
});
