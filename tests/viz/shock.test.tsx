/**
 * 坐标轴冲击三拍 (video-shotcraft chart-live-moves): 越界后先保持旧 domain 一拍, 再切到新 domain 重标.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Domain } from "@src/viz/scale";
import { VIZ_SHOT } from "@src/viz/tokens";
import { useShockDomain } from "@src/viz/use-shock";

const OLD: Domain = [0, 100];
const NEXT: Domain = [0, 400];
const MS = 1000;

afterEach(() => {
  vi.useRealTimers();
});

describe("useShockDomain", () => {
  it("holds the old domain through shock and beat, then rescales once", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ target, reduced }) => useShockDomain(target, reduced), {
      initialProps: { target: OLD, reduced: false },
    });
    rerender({ target: NEXT, reduced: false });
    expect(result.current.domain).toBe(OLD);
    expect(result.current.pending).toBe(true);
    act(() => {
      vi.advanceTimersByTime((VIZ_SHOT.shock + VIZ_SHOT.beat) * MS);
    });
    expect(result.current.domain).toBe(NEXT);
    expect(result.current.previous).toBe(OLD);
    expect(result.current.pending).toBe(false);
    expect(result.current.punch).toBe(1);
  });

  it("switches at once under reduced motion", () => {
    const { result, rerender } = renderHook(({ target, reduced }) => useShockDomain(target, reduced), {
      initialProps: { target: OLD, reduced: true },
    });
    rerender({ target: NEXT, reduced: true });
    expect(result.current.domain).toBe(NEXT);
    expect(result.current.punch).toBe(0);
  });
});
