import { describe, expect, it } from "vitest";
import { dealDelays, extent, linePath, linearScale, niceStep, niceTicks, punchDomain, zeroDomain } from "../../src/viz/scale";
import { edgeLength, layoutFlow, walkOrder } from "../../src/viz/flow/flow-layout";

describe("scale", () => {
  it("extent and linear scale handle empty and flat input", () => {
    expect(extent([])).toEqual([0, 1]);
    expect(extent([3, -2, 9])).toEqual([-2, 9]);
    expect(linearScale([0, 10], [0, 100])(5)).toBe(50);
    expect(linearScale([4, 4], [0, 100])(4)).toBe(50);
  });

  it("nice steps snap to 1, 2, 5 times a power of ten", () => {
    expect(niceStep(100, 4)).toBe(50);
    expect(niceStep(7, 4)).toBe(2);
    expect(niceStep(0.3, 4)).toBeCloseTo(0.1);
    expect(niceTicks([0, 0.3], 3)).toEqual([0, 0.1, 0.2, 0.3]);
  });

  it("punchDomain only grows, and keeps the reference when nothing crosses", () => {
    const base = zeroDomain([10, 40, 80], 4);
    expect(base).toEqual([0, 80]);
    expect(punchDomain(base, [20, 70], 4)).toBe(base);
    const grown = punchDomain(base, [20, 130], 4);
    expect(grown[1]).toBeGreaterThanOrEqual(130);
    expect(grown[0]).toBe(0);
  });

  it("dealDelays shrink their gaps and stay bounded", () => {
    const delays = dealDelays(6, 0.12, 0.04);
    expect(delays[0]).toBe(0);
    const gaps = delays.slice(1).map((value, index) => value - delays[index]);
    for (let index = 1; index < gaps.length; index += 1) expect(gaps[index]).toBeLessThanOrEqual(gaps[index - 1] + 1e-9);
    expect(delays[delays.length - 1]).toBeLessThan(0.12 * 6);
  });

  it("linePath needs two points", () => {
    expect(linePath([[0, 0]])).toBe("");
    expect(linePath([[0, 0], [10, 5]])).toBe("M0.00 0.00 L10.00 5.00");
  });
});

describe("flow layout", () => {
  const nodes = [
    { id: "order", label: "下单" },
    { id: "pay", label: "支付" },
    { id: "risk", label: "风控" },
    { id: "ship", label: "发货" },
  ];
  const edges = [
    { from: "order", to: "pay" },
    { from: "order", to: "risk" },
    { from: "pay", to: "ship" },
    { from: "risk", to: "ship" },
    { from: "ship", to: "ghost" },
  ];

  it("places nodes by longest path depth and drops dangling edges", () => {
    const layout = layoutFlow(nodes, edges);
    expect(layout.columns).toBe(3);
    const ship = layout.nodes.find((node) => node.id === "ship");
    expect(ship?.column).toBe(2);
    expect(layout.edges).toHaveLength(4);
    expect(walkOrder(layout)).toEqual(["order", "pay", "risk", "ship"]);
  });

  it("survives cycles by appending the leftovers", () => {
    const layout = layoutFlow(nodes.slice(0, 2), [
      { from: "order", to: "pay" },
      { from: "pay", to: "order" },
    ]);
    expect(layout.nodes).toHaveLength(2);
    expect(new Set(layout.nodes.map((node) => node.column)).size).toBe(2);
  });

  it("edge length is at least the straight distance", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 100, y: 50 };
    expect(edgeLength(a, b)).toBeGreaterThanOrEqual(Math.hypot(100, 50) - 1e-6);
  });
});
