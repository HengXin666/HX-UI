/**
 * Trend 受控 progress: 读数与线长跟进度走, 不给 progress 时保持自播, 减弱动效时取 1.
 */
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Trend } from "@src/viz/charts/Trend";

const VALUES = [0, 10, 30];
const motionPref = vi.hoisted(() => ({ reduced: false }));

// motion 只在首次调用时读一次媒体查询, 这里直接替换 useReducedMotion 的返回值
vi.mock("motion/react", async (load) => ({ ...(await load<typeof import("motion/react")>()), useReducedMotion: () => motionPref.reduced }));

afterEach(() => {
  motionPref.reduced = false;
});

function readout(container: HTMLElement): HTMLElement {
  const node = container.querySelector<HTMLElement>("[data-slot='hx-trend'] > p");
  if (!node) throw new Error("readout missing");
  return node;
}

function linePathD(container: HTMLElement): string | null {
  return container.querySelector("path[stroke='currentColor']")?.getAttribute("d") ?? null;
}

describe("Trend progress", () => {
  it("without progress reads the latest value politely", () => {
    const { container } = render(<Trend values={VALUES} label="日活" />);
    expect(readout(container).textContent).toBe("30");
    expect(readout(container).getAttribute("aria-live")).toBe("polite");
  });

  it("draws and reads up to the given progress", () => {
    const { container, rerender } = render(<Trend values={VALUES} label="日活" progress={0} />);
    expect(readout(container).textContent).toBe("0");
    expect(linePathD(container)).toBeNull();
    expect(readout(container).hasAttribute("aria-live")).toBe(false);
    rerender(<Trend values={VALUES} label="日活" progress={0.75} />);
    expect(readout(container).textContent).toBe("20");
    expect(linePathD(container)?.split("L")).toHaveLength(3);
    rerender(<Trend values={VALUES} label="日活" progress={1} />);
    expect(readout(container).textContent).toBe("30");
  });

  it("treats progress as 1 under reduced motion", () => {
    motionPref.reduced = true;
    const { container } = render(<Trend values={VALUES} label="日活" progress={0.2} />);
    expect(readout(container).textContent).toBe("30");
  });
});
