/**
 * Heatmap: 透明度映射, 缺格不画, 最大格摘要.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HEAT_CELL } from "@src/constants/data-stage";
import { Heatmap, heatOpacity, heatPeak } from "@src/viz/charts/Heatmap";

describe("heatOpacity", () => {
  it("maps the domain onto the opacity range", () => {
    expect(heatOpacity(0, [0, 10])).toBeCloseTo(HEAT_CELL.minOpacity);
    expect(heatOpacity(10, [0, 10])).toBeCloseTo(HEAT_CELL.maxOpacity);
    expect(heatOpacity(20, [0, 10])).toBeCloseTo(HEAT_CELL.maxOpacity);
  });

  it("returns 0 for missing values and max for a flat domain", () => {
    expect(heatOpacity(undefined, [0, 10])).toBe(0);
    expect(heatOpacity(Number.NaN, [0, 10])).toBe(0);
    expect(heatOpacity(5, [5, 5])).toBe(HEAT_CELL.maxOpacity);
  });
});

describe("heatPeak", () => {
  it("finds the largest cell and skips gaps", () => {
    expect(
      heatPeak([
        { row: "a", col: "x", value: 1 },
        { row: "a", col: "y", value: undefined },
        { row: "b", col: "x", value: 9 },
      ]),
    ).toEqual({ row: "b", col: "x", value: 9 });
    expect(heatPeak([])).toBeUndefined();
  });
});

describe("Heatmap", () => {
  const rows = [
    { id: "mon", label: "周一" },
    { id: "tue", label: "周二" },
  ];
  const cols = [
    { id: "am", label: "上午" },
    { id: "pm", label: "下午" },
  ];

  it("draws present cells only", () => {
    const { container } = render(
      <Heatmap
        rows={rows}
        cols={cols}
        values={[
          [1, 2],
          [undefined, 8],
        ]}
        label="访问热度"
        width={400}
      />,
    );
    expect(container.querySelectorAll("rect[data-cell]")).toHaveLength(3);
    expect(container.querySelector("[data-cell='tue:am']")).toBeNull();
  });

  it("names the peak cell for screen readers", () => {
    const { getByRole } = render(
      <Heatmap
        rows={rows}
        cols={cols}
        values={[
          [1, 2],
          [3, 8],
        ]}
        label="访问热度"
        width={400}
      />,
    );
    const img = getByRole("img", { name: "访问热度" });
    expect(document.getElementById(img.getAttribute("aria-describedby") ?? "")?.textContent).toBe("周二 × 下午 8");
  });
});
