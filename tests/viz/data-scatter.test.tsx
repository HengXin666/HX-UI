/**
 * Scatter: 半径按面积映射, 落点与比例尺一致, 分组色阶, canvas 切换, 读屏摘要.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CANVAS_THRESHOLD, SCATTER_RADIUS } from "@src/constants/data-stage";
import { Scatter, placePoints, radiusScale } from "@src/viz/charts/Scatter";
import { scaleLinear } from "@src/viz/kernel-scale";

describe("radiusScale", () => {
  it("uses the base radius without sizes", () => {
    expect(radiusScale([])(undefined)).toBe(SCATTER_RADIUS.base);
  });

  it("maps area, not radius", () => {
    const r = radiusScale([0, 100]);
    expect(r(0)).toBeCloseTo(SCATTER_RADIUS.min);
    expect(r(100)).toBeCloseTo(SCATTER_RADIUS.max);
    const quarter = r(25) - SCATTER_RADIUS.min;
    expect(quarter / (SCATTER_RADIUS.max - SCATTER_RADIUS.min)).toBeCloseTo(0.5);
  });
});

describe("placePoints", () => {
  it("places points through the scales and picks group tones", () => {
    const x = scaleLinear([0, 10], [0, 100]);
    const y = scaleLinear([0, 10], [100, 0]);
    const placed = placePoints(
      [
        { id: "a", x: 5, y: 5, group: "g2" },
        { id: "b", x: 10, y: 0 },
      ],
      x,
      y,
      ["g1", "g2"],
    );
    expect(placed[0]).toMatchObject({ cx: 50, cy: 50, tone: 1, r: SCATTER_RADIUS.base });
    expect(placed[1]).toMatchObject({ cx: 100, cy: 100, tone: 0 });
  });
});

describe("Scatter", () => {
  const data = [
    { id: "a", x: 1, y: 2 },
    { id: "b", x: 3, y: 9 },
    { id: "c", x: 7, y: 4 },
  ];

  it("draws one circle per point", () => {
    const { container } = render(<Scatter data={data} label="价格与销量" width={400} />);
    expect(container.querySelectorAll("circle[data-point]")).toHaveLength(3);
  });

  it("higher y sits higher on screen", () => {
    const { container } = render(<Scatter data={data} label="x" width={400} />);
    const cy = (id: string) => Number(container.querySelector(`[data-point='${id}']`)?.getAttribute("cy"));
    expect(cy("b")).toBeLessThan(cy("a"));
  });

  it("switches to canvas above the threshold", () => {
    const many = Array.from({ length: CANVAS_THRESHOLD + 1 }, (_, i) => ({ id: String(i), x: i, y: i % 13 }));
    const { container } = render(<Scatter data={many} label="x" width={400} />);
    expect(container.querySelector("canvas")).not.toBeNull();
    expect(container.querySelector("circle[data-point]")).toBeNull();
  });

  it("summarizes count and ranges", () => {
    const { getByRole } = render(<Scatter data={data} label="价格与销量" xLabel="价格" yLabel="销量" width={400} />);
    const img = getByRole("img", { name: "价格与销量" });
    const text = document.getElementById(img.getAttribute("aria-describedby") ?? "")?.textContent ?? "";
    expect(text).toContain("3");
    expect(text).toContain("价格");
    expect(text).toContain("销量");
  });
});
