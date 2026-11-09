import { describe, expect, it } from "vitest";
import { CURVE, cssCurve } from "@src/motion/curves";

describe("公共曲线表", () => {
  it("CSS 写法与点值一致", () => {
    expect(cssCurve("outQuint")).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
    expect(cssCurve("popOut")).toBe("cubic-bezier(0.2, 1.25, 0.4, 1)");
  });

  it("x 坐标都在 0 到 1 之内, 是合法的 cubic-bezier", () => {
    for (const [x1, , x2] of Object.values(CURVE)) {
      expect(x1).toBeGreaterThanOrEqual(0);
      expect(x1).toBeLessThanOrEqual(1);
      expect(x2).toBeGreaterThanOrEqual(0);
      expect(x2).toBeLessThanOrEqual(1);
    }
  });
});
