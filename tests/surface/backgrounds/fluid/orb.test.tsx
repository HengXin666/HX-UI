/**
 * fluid 路 Orb: 悬停, 伸向指针的弹簧, 点击脉冲与回声, 入场的状态推进, 着色器接线, 内核状态, 减弱动效只画一帧, 无 WebGL 时兜底.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Orb } from "@src/surface/backgrounds/fluid/Orb";
import { ORB_FOCAL, ORB_FRAGMENT, ORB_INTRO_SECONDS, createOrbState, stepOrb, wrapAngle, type OrbInput, type OrbSettings } from "@src/surface/backgrounds/fluid/orb-shader";
import { mockIntersection, mockReducedMotion, mockWebgl2, useFakeClock } from "../../backdrop/helpers";
import { recordCanvas2d } from "../../helpers";

let restore: Array<() => void> = [];
beforeEach(() => {
  useFakeClock();
  restore = [];
});
afterEach(() => {
  restore.forEach((fn) => fn());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const draws = (calls: string[]): number => calls.filter((c) => c === "drawArrays").length;
const SETTINGS: OrbSettings = { hoverIntensity: 1, rotateOnHover: true, forceHoverState: false, followCursor: true, clickPulse: true };
const IDLE: OrbInput = { aimX: 0, aimY: 0, inside: false, aimed: false, tapped: false };
const run = (seconds: number, input: OrbInput, settings: OrbSettings = SETTINGS, state = createOrbState(false)) => {
  for (let t = 0; t < seconds; t += 1 / 60) stepOrb(state, input, settings, 1 / 60);
  return state;
};

describe("Orb 状态推进与常数", () => {
  it("规格常数", () => {
    expect([ORB_INTRO_SECONDS, ORB_FOCAL]).toEqual([1.1, 3.2]);
    expect(ORB_FRAGMENT).toContain("const float FOCAL = 3.2;");
  });
  it("入场 1.1 秒涨满, 关掉 intro 时一开始就满", () => {
    expect(run(0.55, IDLE).reveal).toBeCloseTo(0.5, 1);
    expect(run(1.2, IDLE).reveal).toBe(1);
    expect(createOrbState(true).reveal).toBe(1);
  });
  it("瞄着球时悬停与贴近涨到 hoverIntensity, 并缓慢自转", () => {
    const s = run(1, { aimX: 0.2, aimY: 0.1, inside: true, aimed: true, tapped: false }, { ...SETTINGS, hoverIntensity: 2 });
    expect(s.hover).toBeGreaterThan(0.99);
    expect(s.near).toBeCloseTo(2, 2);
    expect(s.rotation).toBeGreaterThan(0);
    expect(run(1, IDLE, { ...SETTINGS, forceHoverState: true }).hover).toBeGreaterThan(0.99);
  });
  it("伸向指针的弹簧收敛到目标, 关掉 followCursor 时停在原位", () => {
    const aim: OrbInput = { aimX: 0.6, aimY: -0.3, inside: true, aimed: true, tapped: false };
    const s = run(3, aim);
    expect(s.reachX).toBeCloseTo(0.6, 2);
    expect(s.reachY).toBeCloseTo(-0.3, 2);
    expect(run(3, aim, { ...SETTINGS, followCursor: false }).reachX).toBe(0);
  });
  it("点击给脉冲初速并重放回声, 之后脉冲衰减回 0", () => {
    const s = createOrbState(true);
    stepOrb(s, { ...IDLE, tapped: true }, SETTINGS, 1 / 60);
    expect(s.pulse).toBeGreaterThan(0);
    expect(s.echo).toBeLessThan(0.1);
    run(3, IDLE, SETTINGS, s);
    expect(Math.abs(s.pulse)).toBeLessThan(1e-3);
    expect(s.echo).toBe(1);
  });
  it("角度差折到 (-pi, pi]", () => {
    expect(wrapAngle(Math.PI * 1.5)).toBeCloseTo(-Math.PI / 2, 9);
    expect(wrapAngle(0.3)).toBeCloseTo(0.3, 9);
  });
});

describe("Orb 渲染", () => {
  it("有 WebGL2 时 live, 持续出帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls), mockReducedMotion(false));
    mockIntersection();
    const { container } = render(<Orb tiltX={20} colors={["primary", "accent", "accent-2"]} />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropStatus).toBe("live");
    const before = draws(calls);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(draws(calls)).toBeGreaterThan(before);
  });
  it("减弱动效: 只画静态帧", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const { container } = render(<Orb reducedMotion />);
    expect((container.firstElementChild as HTMLElement).dataset.backdropPlan).toBe("still");
    const before = draws(calls);
    expect(before).toBeGreaterThan(0);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(draws(calls)).toBe(before);
  });
  it("拿不到 WebGL2 时铺兜底层", () => {
    restore.push(recordCanvas2d([]));
    const { container } = render(<Orb />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.dataset.backdropStatus).toBe("fallback");
    expect(host.querySelector("[data-backdrop-fallback]")).not.toBeNull();
  });
});
