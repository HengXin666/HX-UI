/**
 * 背景内核的运行时: WebGL 不可用时退到 CSS 渐变, 减弱动效只画静态帧, 离屏停帧, 回到视口续帧.
 */
import { act, render } from "@testing-library/react";
import type { JSX } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BACKDROP_STILL_TIME, BackdropShell, useCanvasBackdrop, useShaderBackdrop, type BackdropFrame } from "@src/surface/backdrop/kernel";
import { mockCanvas2d, mockIntersection, mockReducedMotion, mockWebgl2, useFakeClock } from "./helpers";

function ShaderProbe(): JSX.Element {
  const handle = useShaderBackdrop({ fragment: "void main() {}" }, {});
  return <BackdropShell handle={handle} fallback="var(--primary)" data-testid="host" />;
}

function CanvasProbe({ frames, reducedMotion, paused }: { frames: BackdropFrame[]; reducedMotion?: boolean; paused?: boolean }): JSX.Element {
  const handle = useCanvasBackdrop({ draw: (_ctx, frame) => frames.push(frame) }, { reducedMotion, paused });
  return <BackdropShell handle={handle} fallback="var(--primary)" data-testid="host" />;
}

function PassProbe({ rounds }: { rounds: number[] }): JSX.Element {
  const handle = useShaderBackdrop(
    {
      fragment: "main",
      passes: [
        { name: "u_a", fragment: "a", iterations: 2, uniforms: (_f, i) => (rounds.push(i), { u_i: i }) },
        { name: "u_b", fragment: "b" },
      ],
    },
    { reducedMotion: true },
  );
  return <BackdropShell handle={handle} fallback="var(--primary)" data-testid="host" />;
}

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

describe("退化路径", () => {
  it("拿不到 webgl2 时显示 CSS 兜底层, 画布隐藏", () => {
    restore.push(mockCanvas2d());
    const { getByTestId } = render(<ShaderProbe />);
    const host = getByTestId("host");
    expect(host.dataset.backdropStatus).toBe("fallback");
    const layer = host.querySelector<HTMLElement>("[data-backdrop-fallback]");
    expect(layer?.style.background).toContain("var(--primary)");
    expect(host.querySelector("canvas")?.style.visibility).toBe("hidden");
  });
});

describe("多通道乒乓", () => {
  it("每帧按顺序跑完各通道的迭代再上屏", () => {
    const calls: string[] = [];
    restore.push(mockWebgl2(calls));
    const rounds: number[] = [];
    const { getByTestId } = render(<PassProbe rounds={rounds} />);
    expect(getByTestId("host").dataset.backdropStatus).toBe("live");
    const draws = calls.filter((c) => c === "drawArrays").length;
    const frames = rounds.length / 2;
    expect(frames).toBeGreaterThan(0);
    expect(rounds.slice(0, 2)).toEqual([0, 1]);
    expect(draws).toBe(frames * 4);
    expect(calls.filter((c) => c === "createFramebuffer").length).toBeGreaterThanOrEqual(4);
  });
});

describe("减弱动效与暂停", () => {
  it("减弱动效时只画静态帧, 时钟固定, 不起帧循环", () => {
    restore.push(mockCanvas2d(), mockReducedMotion(true));
    const frames: BackdropFrame[] = [];
    render(<CanvasProbe frames={frames} />);
    const before = frames.length;
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(before).toBeGreaterThan(0);
    expect(frames.length).toBe(before);
    expect(frames.every((f) => f.still && f.time === BACKDROP_STILL_TIME && f.reduced)).toBe(true);
  });
  it("prop 覆写系统偏好; 暂停时 plan 为 still", () => {
    restore.push(mockCanvas2d(), mockReducedMotion(false));
    const frames: BackdropFrame[] = [];
    const { getByTestId } = render(<CanvasProbe frames={frames} paused />);
    expect(getByTestId("host").dataset.backdropPlan).toBe("still");
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(frames.every((f) => f.still)).toBe(true);
  });
});

describe("离屏停帧", () => {
  it("在视口里持续出帧, 离屏后停, 回来续上", () => {
    restore.push(mockCanvas2d(), mockReducedMotion(false));
    const setVisible = mockIntersection();
    const frames: BackdropFrame[] = [];
    const { getByTestId } = render(<CanvasProbe frames={frames} />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const running = frames.filter((f) => !f.still).length;
    expect(running).toBeGreaterThan(3);
    act(() => setVisible(false));
    expect(getByTestId("host").dataset.backdropPlan).toBe("idle");
    const paused = frames.length;
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(frames.length).toBe(paused);
    act(() => setVisible(true));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(frames.length).toBeGreaterThan(paused);
  });
});
