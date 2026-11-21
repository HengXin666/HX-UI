/**
 * 内容模型: SKU 矩阵下的可选态, 选择解析, 默认选择, 价格区间.
 */
import { describe, expect, it } from "vitest";
import { axisAvailability, candidates, defaultSelection, describeSelection, findVariant, priceRange, sampleProduct, selectValue, VALUE_STATE } from "@src/commerce/model";

const product = sampleProduct();
const [color, size] = product.options;

describe("axisAvailability", () => {
  it("尺码的库存随所选颜色变化", () => {
    const sand = axisAvailability(product, size, { 颜色: "sand" });
    const moss = axisAvailability(product, size, { 颜色: "moss" });
    expect(sand.find((a) => a.value === "43")?.state).toBe(VALUE_STATE.soldOut);
    expect(sand.find((a) => a.value === "40")?.stock).toBe(24);
    expect(moss.find((a) => a.value === "38")?.state).toBe(VALUE_STATE.missing);
    expect(moss.find((a) => a.value === "42")?.state).toBe(VALUE_STATE.soldOut);
  });

  it("本轴自己的已选值不参与判断", () => {
    const states = axisAvailability(product, color, { 颜色: "sand", 尺码: "38" });
    expect(states.map((s) => s.state)).toEqual([VALUE_STATE.available, VALUE_STATE.soldOut, VALUE_STATE.missing]);
  });

  it("什么都没选时按全部 SKU 合计", () => {
    const total = axisAvailability(product, color, {}).reduce((s, a) => s + a.stock, 0);
    expect(total).toBe(product.variants.reduce((s, v) => s + v.stock, 0));
  });
});

describe("选择", () => {
  it("默认只预选颜色, 取有货里最便宜的", () => {
    expect(defaultSelection(product)).toEqual({ 颜色: "moss" });
  });

  it("findVariant 只在选完时返回", () => {
    expect(findVariant(product, { 颜色: "ink" })).toBeUndefined();
    expect(findVariant(product, { 颜色: "ink", 尺码: "41" })?.stock).toBe(21);
  });

  it("换颜色后组合不出的尺码被清掉, 组合得出的保留", () => {
    expect(selectValue(product, { 颜色: "sand", 尺码: "38" }, "颜色", "moss")).toEqual({ 颜色: "moss" });
    expect(selectValue(product, { 颜色: "sand", 尺码: "41" }, "颜色", "moss")).toEqual({ 颜色: "moss", 尺码: "41" });
  });

  it("价格区间与划线价跟候选走", () => {
    expect(priceRange(candidates(product, {}))).toEqual({ min: 1189, max: 1349, compareAt: 1349 });
    expect(priceRange(candidates(product, { 颜色: "sand" }))).toEqual({ min: 1349, max: 1349, compareAt: undefined });
    expect(priceRange([])).toBeUndefined();
  });

  it("describeSelection 用标签, 按轴顺序", () => {
    expect(describeSelection(product, { 尺码: "42", 颜色: "ink" })).toBe("颜色: 墨蓝 / 尺码: 42");
  });
});
