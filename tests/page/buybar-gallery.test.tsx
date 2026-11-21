/**
 * 粘性购买条与镜头化画廊: 进出由购买区可见性决定, 文案跟选择走; 画廊键盘切换, 缩略图同步, 减弱动效不过渡.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BuyBar, ShotGallery } from "@src/blocks/commerce/sections";
import { defaultSelection, sampleProduct } from "@src/commerce/model";
import { Page } from "@src/page";
import { pdpTemplate } from "@src/page/templates";

type Cb = (entries: Array<Partial<IntersectionObserverEntry>>) => void;
let fire: Cb = () => {};
class FakeIO {
  constructor(cb: Cb) { fire = cb; }
  observe(): void {}
  disconnect(): void {}
  unobserve(): void {}
}

describe("BuyBar", () => {
  beforeEach(() => { vi.stubGlobal("IntersectionObserver", FakeIO); });
  afterEach(() => { vi.unstubAllGlobals(); });

  const product = sampleProduct();
  const mount = (selection = defaultSelection(product), onBuy = vi.fn()) => {
    const utils = render(<><section id="buy-area">buy</section><BuyBar product={product} selection={selection} ctaLabel="加入购物车" watchId="buy-area" onBuy={onBuy} /></>);
    return { ...utils, onBuy, bar: utils.container.querySelector("[data-slot='buy-bar']") as HTMLElement };
  };

  it("购买区在视口内时隐藏且 inert, 滚过后出现", () => {
    const { bar } = mount();
    expect(bar.dataset.shown).toBe("false");
    expect(bar.hasAttribute("inert")).toBe(true);
    act(() => fire([{ isIntersecting: false, boundingClientRect: { top: -400 } as DOMRectReadOnly }]));
    expect(bar.dataset.shown).toBe("true");
    expect(bar.hasAttribute("inert")).toBe(false);
    act(() => fire([{ isIntersecting: false, boundingClientRect: { top: 900 } as DOMRectReadOnly }]));
    expect(bar.dataset.shown).toBe("false");
  });

  it("没选尺码时主按钮提示选择并滚回购买区, 不触发购买", () => {
    const scroll = vi.fn();
    const { onBuy } = mount();
    document.getElementById("buy-area")!.scrollIntoView = scroll;
    const cta = screen.getByRole("button", { name: "选择尺码", hidden: true });
    fireEvent.click(cta);
    expect(scroll).toHaveBeenCalled();
    expect(onBuy).not.toHaveBeenCalled();
  });

  it("选完有货组合时按钮触发购买并带上 SKU; 售罄组合禁用", () => {
    const { onBuy, unmount } = mount({ 颜色: "moss", 尺码: "41" });
    fireEvent.click(screen.getByRole("button", { name: "加入购物车", hidden: true }));
    expect(onBuy.mock.calls[0][0].options).toEqual({ 颜色: "moss", 尺码: "41" });
    unmount();
    mount({ 颜色: "sand", 尺码: "43" });
    expect((screen.getByRole("button", { name: "已售罄", hidden: true }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("ShotGallery", () => {
  const media = sampleProduct().media.slice(0, 3);

  it("方向键与 Home / End 切换, 计数与缩略图同步, 只有当前张有 alt", () => {
    const { container } = render(<ShotGallery media={media} />);
    const stage = screen.getByRole("group");
    const counter = container.querySelector("[data-slot='shot-gallery-counter']")!;
    expect(counter.textContent).toBe("1 / 3");
    fireEvent.keyDown(stage, { key: "ArrowRight" });
    expect(counter.textContent).toBe("2 / 3");
    expect(screen.getAllByRole("tab")[1].getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(stage, { key: "ArrowLeft" });
    fireEvent.keyDown(stage, { key: "ArrowLeft" });
    expect(counter.textContent).toBe("3 / 3");
    fireEvent.keyDown(stage, { key: "Home" });
    expect(counter.textContent).toBe("1 / 3");
    const alts = [...stage.querySelectorAll("img")].map((i) => i.getAttribute("alt"));
    expect(alts.filter(Boolean)).toEqual([media[0].alt]);
  });

  it("换图是推镜: 在场图 scale 1 不透明, 刚离场的淡出略放大", () => {
    render(<ShotGallery media={media} />);
    fireEvent.click(screen.getAllByRole("tab")[2]);
    const imgs = [...screen.getByRole("group").querySelectorAll("img")] as HTMLImageElement[];
    expect(imgs[2].style.opacity).toBe("1");
    expect(imgs[2].style.transform).toContain("scale(1)");
    expect(imgs[0].style.opacity).toBe("0");
    expect(imgs[0].style.transform).toContain("scale(1.02)");
  });

  it("受控 index 与空列表", () => {
    const onIndexChange = vi.fn();
    const { container, rerender } = render(<ShotGallery media={media} index={1} onIndexChange={onIndexChange} />);
    fireEvent.keyDown(screen.getByRole("group"), { key: "End" });
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(container.querySelector("[data-slot='shot-gallery-counter']")!.textContent).toBe("2 / 3");
    rerender(<ShotGallery media={[]} />);
    expect(container.querySelector("[data-slot='shot-gallery']")).toBeNull();
  });
});

describe("pdpTemplate 受控选择", () => {
  it("页面外持有选择, 购买区改颜色时回调带上新选择", () => {
    const onSelectionChange = vi.fn();
    const product = sampleProduct();
    const { container } = render(<Page spec={pdpTemplate({ product, selection: defaultSelection(product), onSelectionChange }).spec} />);
    fireEvent.click(screen.getByRole("radio", { name: /沙色/ }));
    expect(onSelectionChange.mock.calls[0][0]["颜色"]).toBe("sand");
    expect(container.querySelector("#buy")).not.toBeNull();
  });
});
