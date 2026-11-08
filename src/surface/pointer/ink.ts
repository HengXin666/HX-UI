// 行为规格参照 docs/research/catalog/animations.md 的 ClickSpark, Crosshair, StarBorder 等 Canvas2D 条目 (取色与坐标), 实现为 HX 自有.
/**
 * Canvas2D 件的小工具: 内核解析出的 sRGB 换成画布颜色串 (CSS Color 4 的 color(srgb ...)), 归一化指针换成设备像素.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-pointer.md
 */
import type { Rgb } from "../backdrop/kernel/color";
import type { CanvasFit } from "../backdrop/kernel/math";

const GREY: Rgb = [0.5, 0.5, 0.5];

/** sRGB 0..1 加透明度换成画布可用的颜色串. */
export function inkOf(rgb: Rgb | undefined, alpha = 1): string {
  const [r, g, b] = rgb ?? GREY;
  return `color(srgb ${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} / ${Math.max(0, Math.min(1, alpha)).toFixed(4)})`;
}

/** 内核的归一化坐标 (y 朝上) 换成画布设备像素 (y 朝下). */
export function toPixels(x: number, y: number, fit: CanvasFit): readonly [number, number] {
  return [x * fit.width, (1 - y) * fit.height];
}
