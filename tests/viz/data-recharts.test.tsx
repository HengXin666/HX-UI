/**
 * `@hx/ui/data/recharts` 适配器: 记录转换, 与主入口同一份实现 (转发不复制).
 */
import { describe, expect, it } from "vitest";
import * as main from "@src/index";
import { HxBarChart, HxLineChart, barRowsToRecharts, seriesColor, toRechartsRows } from "@src/entry/data-recharts";

describe("toRechartsRows", () => {
  it("pivots series into one row per x position", () => {
    const out = toRechartsRows(
      [
        { id: "a", label: "收入", values: [1, 2, 3] },
        { id: "b", label: "成本", values: [4, 5] },
      ],
      ["一月", "二月", "三月"],
    );
    expect(out.data).toEqual([
      { name: "一月", a: 1, b: 4 },
      { name: "二月", a: 2, b: 5 },
      { name: "三月", a: 3, b: undefined },
    ]);
    expect(out.series).toEqual([
      { dataKey: "a", name: "收入" },
      { dataKey: "b", name: "成本" },
    ]);
  });

  it("falls back to index labels and honours xKey", () => {
    const out = toRechartsRows([{ id: "a", label: "A", values: [7, 8] }], undefined, { xKey: "t" });
    expect(out.data).toEqual([
      { t: "0", a: 7 },
      { t: "1", a: 8 },
    ]);
  });

  it("formats dates in UTC by unit", () => {
    const out = toRechartsRows([{ id: "a", label: "A", values: [1] }], [new Date(Date.UTC(2026, 0, 31, 23))], { timeUnit: "year", locale: "en-US" });
    expect(out.data[0].name).toBe("2026");
  });
});

describe("barRowsToRecharts", () => {
  it("maps single-value rows to the value key", () => {
    const out = barRowsToRecharts([
      { id: "x", label: "华东", value: 3 },
      { id: "y", label: "华南", value: 5 },
    ]);
    expect(out.data).toEqual([
      { name: "华东", value: 3 },
      { name: "华南", value: 5 },
    ]);
    expect(out.series).toEqual([{ dataKey: "value" }]);
  });

  it("expands multi-series rows by series id", () => {
    const series = [
      { id: "q1", label: "一季度" },
      { id: "q2", label: "二季度" },
    ];
    const out = barRowsToRecharts([{ id: "x", label: "华东", values: [1, 2] }], series);
    expect(out.data).toEqual([{ name: "华东", q1: 1, q2: 2 }]);
    expect(out.series.map((s) => s.dataKey)).toEqual(["q1", "q2"]);
  });

  it("refuses multi-series rows without series", () => {
    expect(() => barRowsToRecharts([{ id: "x", label: "华东", values: [1, 2] }])).toThrow(TypeError);
  });
});

describe("entry forwarding", () => {
  it("re-exports the same implementations as the main entry", () => {
    expect(HxLineChart).toBe(main.HxLineChart);
    expect(HxBarChart).toBe(main.HxBarChart);
    expect(seriesColor).toBe(main.seriesColor);
  });
});
