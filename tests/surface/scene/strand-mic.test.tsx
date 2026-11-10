/**
 * scene 族: FiberStrands 的麦克风电平 (listening). 默认不申请, 被拒或不支持退回 level, 拿到时读均方根并平滑, 卸载时关轨道.
 */
import { act, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FiberStrands, STRAND } from "@src/surface/scene";
import { micLevelOf, smoothMic, useMicLevel } from "@src/surface/scene/parts/strand-mic";

function setMedia(value: unknown): void {
  Object.defineProperty(navigator, "mediaDevices", { value, configurable: true });
}

afterEach(() => {
  setMedia(undefined);
  vi.unstubAllGlobals();
});

describe("麦克风电平", () => {
  it("均方根 x 4 钳到 1; 起快落慢", () => {
    expect(micLevelOf(new Float32Array([0.1, -0.1, 0.1, -0.1]))).toBeCloseTo(0.4, 6);
    expect(micLevelOf(new Float32Array([0.9, -0.9]))).toBe(1);
    expect(micLevelOf(new Float32Array(0))).toBe(0);
    const up = smoothMic(0, 1, 0.06);
    const down = 1 - smoothMic(1, 0, 0.06);
    expect(up).toBeCloseTo(1 - Math.exp(-1), 6);
    expect(down).toBeLessThan(up);
    expect(STRAND.roles).toBe(7);
  });
  it("默认不申请, 宿主不带 data-listening", () => {
    const getUserMedia = vi.fn();
    setMedia({ getUserMedia });
    const { container } = render(<FiberStrands />);
    expect(getUserMedia).not.toHaveBeenCalled();
    expect((container.firstElementChild as HTMLElement).hasAttribute("data-listening")).toBe(false);
  });
  it("被拒时 denied, 不支持时 unavailable, 读数为 null (退回 level)", async () => {
    setMedia({ getUserMedia: vi.fn(() => Promise.reject(new Error("NotAllowedError"))) });
    vi.stubGlobal("AudioContext", class {});
    const { container } = render(<FiberStrands listening level={0.4} />);
    const host = container.firstElementChild as HTMLElement;
    await act(async () => {});
    expect(host.dataset.listening).toBe("denied");
    setMedia(undefined);
    const { result } = renderHook(() => useMicLevel(true));
    expect(result.current.status).toBe("unavailable");
    expect(result.current.meter.read(0.016)).toBeNull();
  });
  it("拿到麦克风: live, 读均方根并平滑; 卸载停轨道并关 AudioContext", async () => {
    const stop = vi.fn();
    const close = vi.fn(() => Promise.resolve());
    setMedia({ getUserMedia: vi.fn(() => Promise.resolve({ getTracks: () => [{ stop }] })) });
    vi.stubGlobal(
      "AudioContext",
      class {
        createAnalyser() {
          return { fftSize: 0, getFloatTimeDomainData: (b: Float32Array) => b.fill(0.1) };
        }
        createMediaStreamSource() {
          return { connect: vi.fn() };
        }
        close = close;
      },
    );
    const { result, unmount } = renderHook(() => useMicLevel(true));
    expect(result.current.status).toBe("pending");
    await act(async () => {});
    expect(result.current.status).toBe("live");
    expect(result.current.meter.read(0.06)).toBeCloseTo(0.4 * (1 - Math.exp(-1)), 6);
    unmount();
    expect(stop).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
