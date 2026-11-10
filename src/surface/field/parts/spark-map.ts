// 行为规格参照 docs/research/catalog/animations.md 的 ElectricLogo 条目 (uMapFrom / uMapTo, CELL), 实现为 HX 自有.
/**
 * SparkMark 的轮廓参数图: 把形状的边界像素串成轮廓, 按累计弧长归一到 0..1 (多条轮廓首尾相接),
 * 再在 CELL 见方的格网上给每格记下最近边界点的弧长参数. 脉冲与支弧按这个参数沿边走, 凹形上也贴着轮廓.
 * 编码进 RGBA8 的 R/G 两字节 (16 位), 片元里 texelFetch 读最近格, 不交给硬件插值 (内核上传时翻转 y, 片元 uv 直接对应).
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { SOFT, SPARK_MARK } from "../tokens";
import { maskSize, type MaskCanvas } from "./mask";

export interface ContourParams {
  /** 每格的弧长参数 0..1, 行优先, 第 0 行在上. 没有边界时全 0. */
  readonly param: Float32Array;
  readonly cols: number;
  readonly rows: number;
  /** 全部轮廓的总弧长 (源像素). */
  readonly perimeter: number;
}

const STEPS = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]] as const;

/** 把边界像素 (内部且有外部 4 邻) 贪心串成轮廓: 每步优先走 4 邻, 其次 8 邻, 走不动就另起一条. 返回 [x, y, 累计弧长] 序列. */
export function traceContours(inside: Uint8Array, w: number, h: number): { points: Float32Array; perimeter: number } {
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && inside[y * w + x] === 1;
  const edge = new Uint8Array(w * h);
  let count = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (at(x, y) && (!at(x + 1, y) || !at(x - 1, y) || !at(x, y + 1) || !at(x, y - 1))) {
        edge[y * w + x] = 1;
        count += 1;
      }
    }
  }
  const points = new Float32Array(count * 3);
  let n = 0;
  let length = 0;
  for (let start = 0; start < w * h; start += 1) {
    if (edge[start] !== 1) continue;
    let x = start % w;
    let y = (start - x) / w;
    for (;;) {
      edge[y * w + x] = 2;
      points.set([x, y, length], n * 3);
      n += 1;
      const step = STEPS.find(([dx, dy]) => edge[(y + dy) * w + (x + dx)] === 1 && x + dx >= 0 && x + dx < w);
      if (!step) break;
      x += step[0];
      y += step[1];
      length += Math.hypot(step[0], step[1]);
    }
    length += 1;
  }
  return { points: points.subarray(0, n * 3), perimeter: length };
}

/** 格网上每格取最近边界点的弧长参数 (边界点先按约一格间距抽稀). */
export function contourParams(inside: Uint8Array, w: number, h: number, cell: number = SPARK_MARK.cell): ContourParams {
  const cols = Math.max(1, Math.ceil(w / cell));
  const rows = Math.max(1, Math.ceil(h / cell));
  const param = new Float32Array(cols * rows);
  const { points, perimeter } = traceContours(inside, w, h);
  if (points.length === 0 || perimeter <= 0) return { param, cols, rows, perimeter: 0 };
  const keep: number[] = [];
  let last = -Infinity;
  for (let i = 0; i < points.length; i += 3) {
    const s = points[i + 2] ?? 0;
    if (s - last >= cell * 0.75) {
      keep.push(points[i] ?? 0, points[i + 1] ?? 0, s / perimeter);
      last = s;
    }
  }
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cx = (c + 0.5) * cell;
      const cy = (r + 0.5) * cell;
      let best = Infinity;
      let value = 0;
      for (let i = 0; i < keep.length; i += 3) {
        const dx = (keep[i] ?? 0) - cx;
        const dy = (keep[i + 1] ?? 0) - cy;
        const d = dx * dx + dy * dy;
        if (d < best) {
          best = d;
          value = keep[i + 2] ?? 0;
        }
      }
      param[r * cols + c] = value;
    }
  }
  return { param, cols, rows, perimeter };
}

export interface SparkMap {
  readonly canvas: HTMLCanvasElement;
  /** 总弧长, 以距离场像素计 (与 sdfCanvas 同一套留白与尺寸). */
  readonly perimeter: number;
}

/** 按 sdfCanvas 同样的尺寸与留白重画遮罩, 求轮廓参数图并编码成画布. 拿不到 2d 上下文时返回 null. */
export function sparkMapCanvas(mask: MaskCanvas, size: number = SPARK_MARK.raster, pad: number = SOFT.pad): SparkMap | null {
  if (typeof document === "undefined") return null;
  const [w, h] = maskSize(mask.aspect, size);
  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  const ctx = src.getContext("2d");
  if (!ctx) return null;
  const inner = 1 / (1 + 2 * pad);
  ctx.drawImage(mask.canvas, (w * (1 - inner)) / 2, (h * (1 - inner)) / 2, w * inner, h * inner);
  const alpha = ctx.getImageData(0, 0, w, h).data;
  const inside = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i += 1) inside[i] = (alpha[i * 4 + 3] ?? 0) > 127 ? 1 : 0;
  const map = contourParams(inside, w, h);
  const out = document.createElement("canvas");
  out.width = map.cols;
  out.height = map.rows;
  const octx = out.getContext("2d");
  if (!octx) return null;
  const img = octx.createImageData(map.cols, map.rows);
  map.param.forEach((v, i) => {
    const q = Math.round(Math.min(1, Math.max(0, v)) * 65535);
    img.data.set([q >> 8, q & 255, 0, 255], i * 4);
  });
  octx.putImageData(img, 0, 0);
  return { canvas: out, perimeter: map.perimeter };
}

/** 片元端: 生成 `<name>` 采样器与 `<name>_param(uv)` (最近格, 16 位解码). */
export function sparkMapGlsl(name: string): string {
  return `
uniform sampler2D ${name};
float ${name}_param(vec2 uv) {
  ivec2 sz = textureSize(${name}, 0);
  vec4 t = texelFetch(${name}, clamp(ivec2(floor(uv * vec2(sz))), ivec2(0), sz - 1), 0);
  return (floor(t.r * 255.0 + 0.5) * 256.0 + floor(t.g * 255.0 + 0.5)) / 65535.0;
}
`;
}
