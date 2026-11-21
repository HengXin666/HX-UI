/**
 * Bar: barFill 与旧 BarChart 一致, 堆叠段总和, 分组 / 横向几何, 读屏摘要.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Bar, barFill, stackSegments } from "@src/viz/charts/Bar";
import { linearScale } from "@src/viz/scale";

const DOMAIN = [0, 100] as const;

describe("barFill", () => {
  it("equals the old BarChart formula", () => {
    for (const v of [-5, 0, 12.5, 40, 100, 130]) {
      expect(barFill(v, DOMAIN)).toBe(Math.max(0, linearScale(DOMAIN, [0, 100])(v)) / 100);
    }
  });

  it("clamps negatives but lets overshoot through", () => {
    expect(barFill(-1, DOMAIN)).toBe(0);
    expect(barFill(120, DOMAIN)).toBeCloseTo(1.2);
  });
});

describe("stackSegments", () => {
  it("chains segments and ends at the total", () => {
    const segs = stackSegments([10, 20, 30], DOMAIN);
    expect(segs[0].start).toBe(0);
    expect(segs[1].start).toBe(segs[0].end);
    expect(segs[2].start).toBe(segs[1].end);
    expect(segs[2].end).toBeCloseTo(barFill(60, DOMAIN));
  });

  it("treats negatives as empty segments", () => {
    const segs = stackSegments([10, -5, 10], DOMAIN);
    expect(segs[1].end).toBe(segs[1].start);
    expect(segs[2].end).toBeCloseTo(0.2);
  });
});

function heights(container: HTMLElement, row: string): number[] {
  return [...container.querySelectorAll(`[data-row='${row}'] rect`)].map((r) => Number(r.getAttribute("height")));
}

describe("Bar", () => {
  const data = [
    { id: "q1", label: "一季度", values: [10, 20] },
    { id: "q2", label: "二季度", values: [25, 5] },
  ];
  const series = [
    { id: "web", label: "网页" },
    { id: "app", label: "应用" },
  ];

  it("stack heights add up to the row total", () => {
    const { container } = render(<Bar data={data} series={series} mode="stack" label="渠道" width={400} height={240} />);
    const q1 = heights(container, "q1");
    const q2 = heights(container, "q2");
    expect(q1).toHaveLength(2);
    expect(q1[0] + q1[1]).toBeCloseTo(q2[0] + q2[1]);
  });

  it("group bars sit side by side with proportional heights", () => {
    const { container } = render(<Bar data={data} series={series} label="渠道" width={400} height={240} />);
    const rects = [...container.querySelectorAll("[data-row='q1'] rect")];
    const xs = rects.map((r) => Number(r.getAttribute("x")));
    expect(xs[1]).toBeGreaterThan(xs[0]);
    const [a, b] = heights(container, "q1");
    expect(b / a).toBeCloseTo(2);
  });

  it("horizontal bars grow along x", () => {
    const { container } = render(<Bar data={[{ id: "a", label: "A", value: 10 }, { id: "b", label: "B", value: 20 }]} orientation="horizontal" label="h" width={400} />);
    const w = (id: string) => Number(container.querySelector(`[data-row='${id}'] rect`)?.getAttribute("width"));
    expect(w("b") / w("a")).toBeCloseTo(2);
  });

  it("describes every row for screen readers", () => {
    const { getByRole } = render(<Bar data={data} series={series} label="渠道" width={400} />);
    const img = getByRole("img", { name: "渠道" });
    const summary = document.getElementById(img.getAttribute("aria-describedby") ?? "");
    expect(summary?.textContent).toContain("一季度 网页 10, 应用 20");
  });
});
