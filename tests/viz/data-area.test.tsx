/**
 * Area: 堆叠上下沿, expand 归一, 闭合路径, 读数.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Area, bandPath, stackSeries } from "@src/viz/charts/Area";

describe("stackSeries", () => {
  it("stacks layers bottom-up", () => {
    const bands = stackSeries([
      [1, 2],
      [3, 4],
    ]);
    expect(bands[0]).toEqual([
      { lower: 0, upper: 1 },
      { lower: 0, upper: 2 },
    ]);
    expect(bands[1]).toEqual([
      { lower: 1, upper: 4 },
      { lower: 2, upper: 6 },
    ]);
  });

  it("treats negatives and gaps as 0", () => {
    const bands = stackSeries([[1, -5], [2]]);
    expect(bands[0][1]).toEqual({ lower: 0, upper: 0 });
    expect(bands[1][1]).toEqual({ lower: 0, upper: 0 });
  });

  it("expand normalizes each column to 1", () => {
    const bands = stackSeries(
      [
        [1, 0],
        [3, 0],
      ],
      "expand",
    );
    expect(bands[1][0].upper).toBeCloseTo(1);
    expect(bands[0][0].upper).toBeCloseTo(0.25);
    expect(bands[1][1].upper).toBe(0);
  });
});

describe("bandPath", () => {
  it("closes the band and needs two columns", () => {
    const d = bandPath([0, 10], [{ lower: 0, upper: 1 }, { lower: 0, upper: 2 }], (v) => 100 - v * 10);
    expect(d.startsWith("M")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(bandPath([0], [{ lower: 0, upper: 1 }], (v) => v)).toBe("");
  });
});

describe("Area", () => {
  const series = [
    { id: "web", label: "网页", values: [1, 2, 3] },
    { id: "app", label: "应用", values: [2, 2, 2] },
  ];

  it("draws one band per series", () => {
    const { container } = render(<Area series={series} label="流量" width={400} />);
    expect(container.querySelectorAll("path[data-series]")).toHaveLength(2);
  });

  it("reads the last value of each layer", () => {
    const { container } = render(<Area series={series} label="流量" width={400} />);
    const text = container.querySelector("[data-slot='hx-area'] > p:last-child")?.textContent ?? "";
    expect(text).toContain("网页: 3");
    expect(text).toContain("应用: 2");
  });

  it("expand reads percentages", () => {
    const { container } = render(<Area series={series} label="占比" offset="expand" width={400} />);
    const text = container.querySelector("[data-slot='hx-area'] > p:last-child")?.textContent ?? "";
    expect(text).toContain("网页: 60%");
  });
});
