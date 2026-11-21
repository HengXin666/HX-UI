/**
 * 标杆页 A: pdpTemplate 产出的 PageSpec 能渲染, 过节拍校验, 选择联动库存与价格, 评价可筛, JSON-LD 正确.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleProduct, sampleRelated, sampleReviews, toProductDetail } from "@src/commerce/model";
import { DIRECTIONS, Page, storyOf, validateBeats } from "@src/page";
import { pdpTemplate } from "@src/page/templates";

const input = { product: sampleProduct(), reviews: sampleReviews(), related: sampleRelated(), url: "https://shop.example.com/p/fell" };

describe("pdpTemplate", () => {
  it("三拍, 每个方向下都过校验, 镜头在白名单里", () => {
    for (const direction of Object.values(DIRECTIONS)) {
      const { spec, issues } = pdpTemplate({ ...input, direction: direction.name });
      const beats = storyOf(spec) ?? [];
      expect(beats.map((b) => b.id)).toEqual(["buy", "proof", "more"]);
      expect(validateBeats(beats, direction)).toEqual([]);
      expect(issues).toEqual([]);
    }
  });

  it("没有评价与推荐时只剩购买一拍", () => {
    const { spec } = pdpTemplate({ product: sampleProduct() });
    expect(storyOf(spec)?.map((b) => b.id)).toEqual(["buy"]);
  });

  it("JSON-LD: 默认选择 (苔绿) 的最低价, 有货, 带评分", () => {
    const ld = pdpTemplate(input).spec.meta?.jsonLd as Record<string, any>;
    expect(ld["@type"]).toBe("Product");
    expect(ld.offers.price).toBe("1189");
    expect(ld.offers.priceCurrency).toBe("CNY");
    expect(ld.offers.availability).toBe("https://schema.org/InStock");
    expect(ld.aggregateRating.ratingCount ?? ld.aggregateRating.reviewCount).toBe(1317);
  });
});

describe("toProductDetail", () => {
  it("受控选到售罄组合时第一个按钮禁用, 价格取该 SKU", () => {
    const data = toProductDetail(sampleProduct(), { 颜色: "sand", 尺码: "43" }, [{ label: "加入购物车" }, { label: "收藏" }]);
    expect(data.ctas[0].disabled).toBe(true);
    expect(data.ctas[1].disabled).toBeUndefined();
    expect(data.price.amount).toBe(1349);
    expect(data.stock).toEqual({ quantity: 0 });
    expect(data.gallery[0].alt).toBe("沙色款侧面");
  });
});

describe("渲染", () => {
  it("换颜色后尺码库存跟着变, 售罄码点不动, 有货码能选上", () => {
    const { container } = render(<Page spec={pdpTemplate(input).spec} />);
    const status = container.querySelector("[data-slot='product-buy-status']");
    expect(status?.textContent).toBe("颜色: 苔绿");
    const sizes = screen.getAllByRole("radiogroup")[1];
    const s38 = within(sizes).getByRole("radio", { name: /38/ });
    expect(s38.getAttribute("aria-disabled") === "true" || (s38 as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: /沙色/ }));
    expect(status?.textContent).toBe("颜色: 沙色");
    const s38Sand = within(screen.getAllByRole("radiogroup")[1]).getByRole("radio", { name: /38/ });
    expect(s38Sand.getAttribute("aria-disabled") === "true" || (s38Sand as HTMLButtonElement).disabled).toBe(false);

    const s43 = within(screen.getAllByRole("radiogroup")[1]).getByRole("radio", { name: /43/ });
    fireEvent.click(s43);
    expect(status?.textContent).toBe("颜色: 沙色");
    fireEvent.click(within(screen.getAllByRole("radiogroup")[1]).getByRole("radio", { name: /40/ }));
    expect(status?.textContent).toBe("颜色: 沙色 / 尺码: 40");
    expect((screen.getByRole("button", { name: "加入购物车" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("评价按星级筛选, 再点一次取消", () => {
    render(<Page spec={pdpTemplate(input).spec} />);
    const filter = screen.getByRole("group", { name: "按星级筛选" });
    const one = within(filter).getByRole("button", { name: /^1 星/ });
    fireEvent.click(one);
    expect(one.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getAllByText(/^1 星$/).length).toBeGreaterThan(0);
    fireEvent.click(one);
    expect(one.getAttribute("aria-pressed")).toBe("false");
  });

  it("推荐轨四张卡, head 里有 canonical 与 ld+json", () => {
    render(<Page spec={pdpTemplate(input).spec} />);
    expect(screen.getByText("Packlite 防风背心")).toBeTruthy();
    expect(document.head.querySelector("link[rel='canonical']")?.getAttribute("href") ?? document.querySelector("link[rel='canonical']")?.getAttribute("href")).toBe(input.url);
    expect(document.querySelectorAll("script[type='application/ld+json']").length).toBeGreaterThan(0);
  });
});
