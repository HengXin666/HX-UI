import { describe, expect, it } from "vitest";
import { needleSpring, VIZ_NEEDLE } from "../../src/viz/tokens";

/** 欠阻尼二阶系统的超调比. */
function overshootRatio(spring: { stiffness: number; damping: number; mass: number }): number {
  const zeta = spring.damping / (2 * Math.sqrt(spring.stiffness * spring.mass));
  return Math.exp((-zeta * Math.PI) / Math.sqrt(1 - zeta * zeta));
}

describe("needleSpring", () => {
  it("keeps the card's stiffness and mass", () => {
    const spring = needleSpring(80);
    expect(spring.stiffness).toBe(VIZ_NEEDLE.stiffness);
    expect(spring.mass).toBe(VIZ_NEEDLE.mass);
  });

  it("solves damping so the return overshoots by about 8 degrees", () => {
    for (const travel of [35, 80, 150]) {
      const degrees = overshootRatio(needleSpring(travel)) * travel;
      expect(degrees).toBeCloseTo(VIZ_NEEDLE.overshoot, 6);
    }
  });

  it("caps the overshoot ratio for short travels", () => {
    const short = needleSpring(4);
    expect(overshootRatio(short)).toBeCloseTo(VIZ_NEEDLE.maxRatio, 6);
  });
});
