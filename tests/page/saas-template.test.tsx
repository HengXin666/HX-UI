/**
 * 标杆页 C: saasTemplate 的拍序与校验, 省拍后节奏仍合法, JSON-LD, 计算器报价, 导览的步进与读屏播报.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PricingCalculator, ProductTour, arcMidpoint, bestPlan, quote } from "@src/blocks/marketing";
import { DIRECTIONS, Page, storyOf, validateBeats } from "@src/page";
import { sampleSaas, saasTemplate, validateSaas } from "@src/page/templates";

const SCREEN = (
  <div>
    <button data-tour="import">导入</button>
    <button data-tour="match">配对</button>
    <button data-tour="diff">差额</button>
    <button data-tour="close">结账</button>
  </div>
);

describe("saasTemplate", () => {
  it("七拍, 每个方向下都过校验", () => {
    for (const direction of Object.values(DIRECTIONS)) {
      const { spec, issues } = saasTemplate({ product: sampleSaas(SCREEN), direction: direction.name });
      const beats = storyOf(spec) ?? [];
      expect(beats.map((b) => b.id)).toEqual(["open", "tour", "features", "metrics", "pricing", "proof", "cta"]);
      expect(validateBeats(beats, direction)).toEqual([]);
      expect(issues).toEqual([]);
    }
  });

  it("只有档位时剩开场, 定价, 收尾三拍, 仍过校验", () => {
    const base = sampleSaas();
    const product = { ...base, tour: undefined, features: undefined, metrics: undefined, matrix: undefined, testimonials: undefined, security: undefined };
    const { spec } = saasTemplate({ product });
    const beats = storyOf(spec) ?? [];
    expect(beats.map((b) => b.id)).toEqual(["open", "pricing", "cta"]);
    expect(validateBeats(beats, DIRECTIONS.industrial)).toEqual([]);
  });

  it("JSON-LD 是 SoftwareApplication, 价格取最低席位价, 带评分", () => {
    const ld = saasTemplate({ product: sampleSaas() }).spec.meta?.jsonLd as Record<string, any>;
    expect(ld["@type"]).toBe("SoftwareApplication");
    expect(ld.offers.price).toBe("39");
    expect(ld.offers.priceCurrency).toBe("CNY");
    expect(ld.aggregateRating.ratingValue ?? ld.aggregateRating.value).toBe(4.7);
  });

  it("对比矩阵引用不存在的档位时报问题", () => {
    const product = sampleSaas();
    product.matrix = [{ title: "x", rows: [{ label: "y", values: { ghost: true } }] }];
    expect(validateSaas(product).map((i) => i.code)).toEqual(["SAAS-MATRIX-PLAN"]);
  });

  it("整页能渲染出导览, 计算器与对比矩阵", () => {
    const { spec } = saasTemplate({ product: sampleSaas(SCREEN) });
    const { container } = render(<Page spec={spec} />);
    expect(container.querySelector("[data-slot='product-tour']")).not.toBeNull();
    expect(container.querySelector("[data-slot='pricing-calculator']")).not.toBeNull();
    expect(screen.getAllByText("单点登录 (SAML)").length).toBeGreaterThan(0);
  });
});

describe("quote / bestPlan", () => {
  const plans = sampleSaas().plans;
  it("不足最低人数按最低人数收, 按年打折, 超上限不适用", () => {
    const starter = plans[0];
    expect(quote(starter, 2, "month")).toEqual({ fits: true, monthly: 117, perSeat: 58.5, yearSaving: 0 });
    expect(quote(starter, 10, "year")).toMatchObject({ fits: true, monthly: 312, yearSaving: 936 });
    expect(quote(starter, 11, "month").fits).toBe(false);
  });
  it("最划算的档位随人数变", () => {
    expect(bestPlan(plans, 8, "month")?.key).toBe("starter");
    expect(bestPlan(plans, 40, "month")?.key).toBe("team");
    expect(bestPlan(plans, 180, "month")?.key).toBe("scale");
  });
});

describe("PricingCalculator", () => {
  it("拖人数后汇总播报换档, 超上限的档位标 data-fit=false", () => {
    const { container } = render(<PricingCalculator plans={sampleSaas().plans} currency="CNY" locale="zh-CN" />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "40" } });
    expect(container.querySelector("[data-slot='calc-summary']")?.textContent).toContain("团队");
    expect(container.querySelector("[data-plan='starter']")?.getAttribute("data-fit")).toBe("false");
    expect(container.querySelector("[data-plan='team']")?.getAttribute("data-best")).toBe("true");
  });
  it("切按年后金额变小", () => {
    const { container } = render(<PricingCalculator plans={sampleSaas().plans} currency="CNY" locale="zh-CN" />);
    const amount = () => container.querySelector("[data-plan='team'] [data-slot='calc-amount']")?.textContent ?? "";
    const before = Number(amount().replace(/\D/g, ""));
    fireEvent.click(screen.getByLabelText("按年"));
    expect(Number(amount().replace(/\D/g, ""))).toBeLessThan(before);
  });
});

describe("ProductTour", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  const stops = sampleSaas(SCREEN).tour!.stops;

  it("目标被标出, 读屏播报当前站, 方向键与下一步按钮推进, 末站回到首站", () => {
    const { container } = render(<ProductTour stops={stops} autoplay={false}>{SCREEN}</ProductTour>);
    const live = () => container.querySelector("[data-slot='tour-live']")?.textContent;
    expect(container.querySelector("[data-tour='import']")?.getAttribute("data-tour-active")).toBe("true");
    expect(live()).toContain("导入流水");
    fireEvent.click(screen.getByText("下一步"));
    act(() => { vi.advanceTimersByTime(1000); });
    expect(container.querySelector("[data-tour='import']")?.hasAttribute("data-tour-active")).toBe(false);
    expect(container.querySelector("[data-tour='match']")?.getAttribute("data-tour-active")).toBe("true");
    fireEvent.keyDown(screen.getAllByRole("tab")[1], { key: "End" });
    expect(live()).toContain("一键结账");
    fireEvent.click(screen.getByText("下一步"));
    expect(live()).toContain("导入流水");
  });

  it("可见时自动播放按停留时长推进, 暂停后不再动", () => {
    class VisibleIO {
      constructor(private cb: (e: Array<Partial<IntersectionObserverEntry>>) => void) {}
      observe(): void { this.cb([{ isIntersecting: true }]); }
      disconnect(): void {}
      unobserve(): void {}
    }
    vi.stubGlobal("IntersectionObserver", VisibleIO);
    const { container } = render(<ProductTour stops={stops} holdMs={500}>{SCREEN}</ProductTour>);
    const idx = () => container.querySelector("[data-slot='product-tour']")?.getAttribute("data-index");
    act(() => { vi.advanceTimersByTime(2000); });
    expect(Number(idx())).toBeGreaterThan(0);
    fireEvent.click(container.querySelector("[data-slot='tour-play']") as HTMLElement);
    const at = idx();
    act(() => { vi.advanceTimersByTime(5000); });
    expect(idx()).toBe(at);
    vi.unstubAllGlobals();
  });

  it("弧线中点在两点之上, 抬高有封顶", () => {
    expect(arcMidpoint({ x: 0, y: 100 }, { x: 100, y: 100 })).toEqual({ x: 50, y: 82 });
    expect(arcMidpoint({ x: 0, y: 0 }, { x: 1000, y: 0 }).y).toBe(-72);
  });
});
