/**
 * DataStage: 绘图区尺寸, auto 渲染阈值, 读屏名称与摘要.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CANVAS_THRESHOLD, STAGE_PADDING } from "@src/constants/data-stage";
import { DataStage, stageInner, stageRenderer, type StageSize } from "@src/viz/kernel-stage";

describe("stageInner", () => {
  it("subtracts default padding", () => {
    expect(stageInner(400, 200)).toEqual({
      x: STAGE_PADDING.left,
      y: STAGE_PADDING.top,
      w: 400 - STAGE_PADDING.left - STAGE_PADDING.right,
      h: 200 - STAGE_PADDING.top - STAGE_PADDING.bottom,
    });
  });

  it("never goes negative", () => {
    const inner = stageInner(10, 10);
    expect(inner.w).toBe(0);
    expect(inner.h).toBe(0);
  });

  it("merges partial padding", () => {
    expect(stageInner(100, 100, { left: 0, right: 0 }).w).toBe(100);
  });
});

describe("stageRenderer", () => {
  it("auto switches to canvas above the threshold", () => {
    expect(stageRenderer("auto", CANVAS_THRESHOLD)).toBe("svg");
    expect(stageRenderer("auto", CANVAS_THRESHOLD + 1)).toBe("canvas");
  });

  it("explicit modes win", () => {
    expect(stageRenderer("svg", CANVAS_THRESHOLD * 10)).toBe("svg");
    expect(stageRenderer("canvas", 1)).toBe("canvas");
  });
});

describe("DataStage", () => {
  it("passes the measured size to children", () => {
    let seen: StageSize | null = null;
    render(
      <DataStage label="营收" width={400} height={200}>
        {(size) => {
          seen = size;
          return null;
        }}
      </DataStage>,
    );
    expect(seen).not.toBeNull();
    const size = seen as unknown as StageSize;
    expect(size.width).toBe(400);
    expect(size.height).toBe(200);
    expect(size.inner).toEqual(stageInner(400, 200));
    expect(size.renderer).toBe("svg");
  });

  it("skips children until a width is known", () => {
    let calls = 0;
    render(
      <DataStage label="营收">
        {() => {
          calls += 1;
          return null;
        }}
      </DataStage>,
    );
    expect(calls).toBe(0);
  });

  it("names the plot and links the summary", () => {
    const { getByRole, container } = render(
      <DataStage label="营收" summary="三月最高" width={300}>
        {() => null}
      </DataStage>,
    );
    const img = getByRole("img", { name: "营收" });
    const id = img.getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    expect(container.querySelector(`[id="${id}"]`)?.textContent).toBe("三月最高");
  });

  it("marks renderer and shock on the root", () => {
    const { container } = render(
      <DataStage label="x" width={300} renderer="auto" points={CANVAS_THRESHOLD + 1} shocked>
        {() => null}
      </DataStage>,
    );
    const root = container.querySelector("figure");
    expect(root?.getAttribute("data-renderer")).toBe("canvas");
    expect(root?.hasAttribute("data-shock")).toBe(true);
  });
});
