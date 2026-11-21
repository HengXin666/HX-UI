/**
 * Line: 几何与 Trend 一致, 受控进度, 减弱动效终态, 越界标记, canvas 切换.
 */
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CANVAS_THRESHOLD } from "@src/constants/data-stage";
import { Line, seriesGeometry } from "@src/viz/charts/Line";
import { areaPath, linePath, project, revealSeries } from "@src/viz/scale";
import { VIZ_BOX } from "@src/viz/tokens";

const motionPref = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", async (load) => ({ ...(await load<typeof import("motion/react")>()), useReducedMotion: () => motionPref.reduced }));

afterEach(() => {
  motionPref.reduced = false;
});

const VALUES = [0, 10, 30];
const DOMAIN = [0, 40] as const;

function lineD(container: HTMLElement, id = "a"): string | null {
  return container.querySelector(`[data-series='${id}'] path[stroke='currentColor']`)?.getAttribute("d") ?? null;
}

describe("seriesGeometry", () => {
  it("matches the old Trend computation", () => {
    const all = project(VALUES, DOMAIN, VIZ_BOX);
    const geo = seriesGeometry(VALUES, DOMAIN, VIZ_BOX);
    expect(geo.line).toBe(linePath(all));
    expect(geo.area).toBe(areaPath(all, VIZ_BOX.height - VIZ_BOX.pad));
    expect(geo.value).toBe(30);
  });

  it("cuts by progress with the interpolated reading", () => {
    const all = project(VALUES, DOMAIN, VIZ_BOX);
    const geo = seriesGeometry(VALUES, DOMAIN, VIZ_BOX, 0.75);
    const reveal = revealSeries(all, VALUES, 0.75);
    expect(geo.points).toEqual(reveal.points);
    expect(geo.value).toBe(20);
  });
});

describe("Line", () => {
  const series = [
    { id: "a", label: "访问", values: VALUES },
    { id: "b", label: "下单", values: [1, 2, 3] },
  ];

  it("draws one path per series", () => {
    const { container } = render(<Line series={series} label="漏斗" width={400} />);
    expect(lineD(container, "a")).toMatch(/^M/);
    expect(lineD(container, "b")).toMatch(/^M/);
  });

  it("progress 1 equals the full line and progress 0.5 is shorter", () => {
    const full = render(<Line series={series} label="x" width={400} progress={1} />);
    const free = render(<Line series={series} label="x" width={400} />);
    expect(lineD(full.container)).toBe(lineD(free.container));
    const half = render(<Line series={series} label="x" width={400} progress={0.5} />);
    expect((lineD(half.container) ?? "").split("L").length).toBeLessThan((lineD(full.container) ?? "").split("L").length + 1);
    expect(lineD(half.container)).not.toBe(lineD(full.container));
  });

  it("reads interpolated values without aria-live when controlled", () => {
    const { container } = render(<Line series={[series[0]]} label="x" width={400} progress={0.75} />);
    const readout = container.querySelector("[data-slot='hx-line'] > p:last-child");
    expect(readout?.textContent).toBe((20).toLocaleString());
    expect(readout?.getAttribute("aria-live")).toBeNull();
  });

  it("reduced motion shows the end state even with progress", () => {
    motionPref.reduced = true;
    const reduced = render(<Line series={series} label="x" width={400} progress={0.2} />);
    motionPref.reduced = false;
    const full = render(<Line series={series} label="x" width={400} progress={1} />);
    expect(lineD(reduced.container)).toBe(lineD(full.container));
  });

  it("marks data-shock when a new value leaves the domain", () => {
    const { container, rerender } = render(<Line series={[{ id: "a", label: "a", values: [1, 2, 3] }]} label="x" width={400} />);
    const root = () => container.querySelector("[data-slot='hx-line']");
    expect(root()?.hasAttribute("data-shock")).toBe(false);
    rerender(<Line series={[{ id: "a", label: "a", values: [1, 2, 300] }]} label="x" width={400} />);
    expect(root()?.hasAttribute("data-shock")).toBe(true);
  });

  it("switches to canvas above the threshold", () => {
    const big = Array.from({ length: CANVAS_THRESHOLD + 1 }, (_, i) => i % 7);
    const { container } = render(<Line series={[{ id: "a", label: "a", values: big }]} label="x" width={400} />);
    expect(container.querySelector("canvas")).not.toBeNull();
    expect(lineD(container)).toBeNull();
  });
});
