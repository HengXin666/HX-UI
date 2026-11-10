// 行为规格参照 docs/research/catalog/animations.md 的 DitherVeil 条目, 实现为 HX 自有.
/**
 * BayerVeil 的主线程部分: 误差扩散 (逐格串行, 片元里做不了), 按格网大小算一次, 结果画进一张小画布当纹理.
 * 有序图样 (bayer / noise / lines) 不走这里, 在片元里按格算阈值.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
import { VEIL } from "../tokens";

export type VeilKernel = keyof typeof VEIL.kernels;
export type VeilOrdered = keyof typeof VEIL.ordered;
export type VeilPattern = VeilKernel | VeilOrdered;
export type VeilFit = "contain" | "cover";
export type VeilPalette = "duotone" | "color";

export function isOrdered(pattern: VeilPattern): pattern is VeilOrdered {
  return pattern in VEIL.ordered;
}

/** 亮度按 contrast / brightness 调过并钳到 0..1 (与片元同一公式). */
export function veilTone(v: number, contrast: number, brightness: number): number {
  return Math.min(1, Math.max(0, (v - 0.5) * contrast + 0.5 + brightness));
}

/** 量化到 levels 档 (至少 2 档). */
export function quantize(v: number, levels: number): number {
  const steps = Math.max(2, Math.round(levels)) - 1;
  return Math.round(Math.min(1, Math.max(0, v)) * steps) / steps;
}

/** 原地误差扩散一张单通道图 (0..1), 返回同一数组; 每格量化后把误差按核推给右下方未处理的格子. */
export function diffuse(values: Float32Array, width: number, height: number, kernel: VeilKernel, levels: number): Float32Array {
  const taps = VEIL.kernels[kernel];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const old = values[i] ?? 0;
      const next = quantize(old, levels);
      values[i] = next;
      const err = old - next;
      if (err === 0) continue;
      for (const [dx, dy, w] of taps) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny >= height) continue;
        const j = ny * width + nx;
        values[j] = (values[j] ?? 0) + err * w;
      }
    }
  }
  return values;
}

/** 格网大小: CSS 尺寸除以 pixelSize, 超过 maxCells 就等比缩小. */
export function veilGrid(cssWidth: number, cssHeight: number, pixelSize: number): { cols: number; rows: number } {
  let cols = Math.max(1, Math.ceil(cssWidth / Math.max(1, pixelSize)));
  let rows = Math.max(1, Math.ceil(cssHeight / Math.max(1, pixelSize)));
  const over = (cols * rows) / VEIL.maxCells;
  if (over > 1) {
    const k = Math.sqrt(over);
    cols = Math.max(1, Math.floor(cols / k));
    rows = Math.max(1, Math.floor(rows / k));
  }
  return { cols, rows };
}

/** 图片放进 cols x rows 格子的矩形 (contain 留边, cover 裁切). */
export function fitRect(imageWidth: number, imageHeight: number, cols: number, rows: number, fit: VeilFit): { x: number; y: number; w: number; h: number } {
  const k = fit === "cover" ? Math.max(cols / imageWidth, rows / imageHeight) : Math.min(cols / imageWidth, rows / imageHeight);
  const w = imageWidth * k;
  const h = imageHeight * k;
  return { x: (cols - w) / 2, y: (rows - h) / 2, w, h };
}

export interface VeilBuild {
  readonly kernel: VeilKernel;
  readonly levels: number;
  readonly contrast: number;
  readonly brightness: number;
  readonly fit: VeilFit;
  readonly palette: VeilPalette;
}

/**
 * 把图片按格网栅格化并误差扩散, 画进一张 cols x rows 的画布. duotone 只写 R (档位), color 三通道各扩散一次;
 * 图片外的留边 alpha 为 0, 片元里当纸色. 没有 2d 上下文时返回 null.
 */
export function buildDither(image: CanvasImageSource & { width: number; height: number }, cols: number, rows: number, opts: VeilBuild): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const r = fitRect(image.width || 1, image.height || 1, cols, rows, opts.fit);
  ctx.drawImage(image, r.x, r.y, r.w, r.h);
  const data = ctx.getImageData(0, 0, cols, rows);
  const px = data.data;
  const n = cols * rows;
  const channels = opts.palette === "color" ? [0, 1, 2] : [-1];
  const out = channels.map((c) => {
    const v = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      const R = (px[i * 4] ?? 0) / 255;
      const G = (px[i * 4 + 1] ?? 0) / 255;
      const B = (px[i * 4 + 2] ?? 0) / 255;
      const raw = c < 0 ? 0.2126 * R + 0.7152 * G + 0.0722 * B : [R, G, B][c] ?? 0;
      v[i] = veilTone(raw, opts.contrast, opts.brightness);
    }
    return diffuse(v, cols, rows, opts.kernel, opts.levels);
  });
  for (let i = 0; i < n; i += 1) {
    const covered = (px[i * 4 + 3] ?? 0) > 127;
    const first = out[0]?.[i] ?? 1;
    px[i * 4] = Math.round(first * 255);
    px[i * 4 + 1] = Math.round((out[1]?.[i] ?? first) * 255);
    px[i * 4 + 2] = Math.round((out[2]?.[i] ?? first) * 255);
    px[i * 4 + 3] = covered ? 255 : 0;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}
