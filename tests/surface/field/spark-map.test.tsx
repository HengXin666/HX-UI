/**
 * field 族: SparkMark 的轮廓弧长参数图. 轮廓串联与弧长, 格网取最近边界点, 凹形上沿边, 画布编码与不可用时的退路, 着色器接线.
 */
import { describe, expect, it, vi } from "vitest";
import { SPARK_MARK } from "@src/surface/field";
import { contourParams, sparkMapCanvas, traceContours } from "@src/surface/field/parts/spark-map";
import { SPARK_FRAGMENT } from "@src/surface/field/parts/spark-shader";

/** w x h 的格里按 fill(x, y) 填内部. */
function grid(w: number, h: number, fill: (x: number, y: number) => boolean): Uint8Array {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) out[y * w + x] = fill(x, y) ? 1 : 0;
  return out;
}

describe("SparkMark 轮廓参数图", () => {
  it("方块的边界串成一圈, 总弧长约等于周长", () => {
    const inside = grid(40, 40, (x, y) => x >= 10 && x < 30 && y >= 10 && y < 30);
    const { points, perimeter } = traceContours(inside, 40, 40);
    expect(points.length / 3).toBe(76);
    expect(perimeter).toBeGreaterThan(74);
    expect(perimeter).toBeLessThan(82);
    for (let i = 5; i < points.length; i += 3) expect(points[i]).toBeGreaterThan(points[i - 3] ?? 0);
  });
  it("格网取最近边界点的参数; 空形状全 0", () => {
    const inside = grid(40, 40, (x, y) => x >= 10 && x < 30 && y >= 10 && y < 30);
    const map = contourParams(inside, 40, 40, 4);
    expect(map.cols).toBe(10);
    expect(map.rows).toBe(10);
    const top = [3, 4, 5, 6].map((c) => map.param[2 * map.cols + c] ?? 0);
    for (let i = 1; i < top.length; i += 1) expect(top[i]).toBeGreaterThan(top[i - 1] ?? 0);
    const empty = contourParams(new Uint8Array(64), 8, 8, 4);
    expect(empty.perimeter).toBe(0);
    expect(Array.from(empty.param)).toEqual([0, 0, 0, 0]);
  });
  it("凹形 (U 字) 的内沿与外沿取到不同的参数段: 沿边走, 不按极角", () => {
    const inside = grid(60, 60, (x, y) => x >= 10 && x < 50 && y >= 10 && y < 50 && !(x >= 22 && x < 38 && y < 38));
    const map = contourParams(inside, 60, 60, 2);
    const at = (x: number, y: number) => map.param[Math.floor(y / 2) * map.cols + Math.floor(x / 2)] ?? 0;
    const inner = at(30, 39);
    const outer = at(30, 51);
    const gap = Math.abs(inner - outer);
    expect(Math.min(gap, 1 - gap)).toBeGreaterThan(0.2);
  });
  it("拿不到 2d 上下文时为 null; 片元按参数图取弧长, 没有图时退回极角", () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(sparkMapCanvas({ canvas: document.createElement("canvas"), aspect: 1 })).toBeNull();
    spy.mockRestore();
    expect(SPARK_MARK.cell).toBe(4);
    expect(SPARK_FRAGMENT).toContain("uniform sampler2D u_map_to;");
    expect(SPARK_FRAGMENT).toContain("u_map_to_param(muv)");
    expect(SPARK_FRAGMENT).toContain("atan(p.y, p.x) / HX_TAU + 0.5");
    expect(SPARK_FRAGMENT).toContain("wrap(ang - ca) * perim");
  });
});
