import { describe, expect, it } from "vitest";
import { digitEase, stepSpring } from "../../src/craft/spring";
import { PRESS_SCALE, SPRING_PRESS } from "../../src/craft/tokens";

describe("stepSpring", () => {
  it("moves toward the target and keeps velocity when the target flips", () => {
    let current = 1;
    let velocity = 0;
    for (let i = 0; i < 4; i += 1) {
      const step = stepSpring(current, velocity, PRESS_SCALE, SPRING_PRESS, 16);
      current = step.current;
      velocity = step.velocity;
    }
    expect(current).toBeLessThan(1);
    expect(velocity).toBeLessThan(0);
    // 换目标后速度沿用而不是清零: 同一位置从静止起步的那一步作对照, 带着向下速度的一步回得更慢.
    const flipped = stepSpring(current, velocity, 1, SPRING_PRESS, 16);
    const fromRest = stepSpring(current, 0, 1, SPRING_PRESS, 16);
    expect(flipped.velocity).toBeLessThan(fromRest.velocity);
    expect(flipped.current).toBeLessThan(fromRest.current);
    expect(flipped.current).not.toBe(PRESS_SCALE);
  });

  it("clamps a huge frame so the value does not jump past the target in one step", () => {
    const step = stepSpring(0, 0, 1, SPRING_PRESS, 500);
    expect(step.current).toBeLessThan(1);
    expect(step.current).toBeGreaterThan(0);
  });
});

describe("digitEase", () => {
  it("starts at 0, ends at 1, and overshoots by less than a tenth", () => {
    expect(digitEase(0)).toBe(0);
    expect(digitEase(1)).toBe(1);
    let peak = 0;
    for (let i = 0; i <= 20; i += 1) peak = Math.max(peak, digitEase(i / 20));
    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThan(1.1);
  });
});
