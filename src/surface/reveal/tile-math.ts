// 行为规格参照 docs/research/catalog/animations.md 的 PixelSwap, PixelTransition 条目, 实现为 HX 自有.
/**
 * 方块切换的纯计算: 格子布局 (总数上限), 起步顺序 (图案 + 随机), 方块半径, 剪裁路径, 马赛克每块覆盖量.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-reveal.md
 */
import { BAYER, HALF, MOSAIC, TILE, cellNoise, clamp, smoothstep } from "./tokens";

export type TilePattern = "pointer" | "random" | "left" | "right" | "top" | "bottom" | "center" | "diagonal" | "dither";

export interface TileGrid {
  readonly cols: number;
  readonly rows: number;
  /** 实际格宽 (px), 总数超上限时放大. */
  readonly cell: number;
}

/** 按宿主尺寸与期望格宽排格子, 总数不超过 max. */
export function tileGrid(width: number, height: number, pixelSize: number, max: number = TILE.maxPixels): TileGrid {
  let cell = Math.max(1, pixelSize);
  let cols = Math.max(1, Math.ceil(width / cell));
  let rows = Math.max(1, Math.ceil(height / cell));
  if (cols * rows > max) {
    cell *= Math.sqrt((cols * rows) / max);
    cols = Math.max(1, Math.ceil(width / cell));
    rows = Math.max(1, Math.ceil(height / cell));
  }
  return { cols, rows, cell };
}

/**
 * 每格的起步顺序 0..1: 图案给基础顺序, 再按 randomness 混入格子噪声.
 *
 * @param origin pointer 图案的起点 (归一化 0..1), 其余图案忽略.
 */
export function tileOrders(grid: Pick<TileGrid, "cols" | "rows">, pattern: TilePattern, randomness: number, origin: readonly [number, number] = [HALF, HALF]): Float32Array {
  const { cols, rows } = grid;
  const out = new Float32Array(cols * rows);
  const span = Math.hypot(1, 1);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const u = cols > 1 ? c / (cols - 1) : HALF;
      const v = rows > 1 ? r / (rows - 1) : HALF;
      const noise = cellNoise(c, r);
      let base: number;
      if (pattern === "random") base = noise;
      else if (pattern === "left") base = u;
      else if (pattern === "right") base = 1 - u;
      else if (pattern === "top") base = v;
      else if (pattern === "bottom") base = 1 - v;
      else if (pattern === "diagonal") base = (u + v) * HALF;
      else if (pattern === "dither") base = (BAYER[(r % 4) * 4 + (c % 4)] + noise) / MOSAIC.levels;
      else if (pattern === "center") base = Math.hypot(u - HALF, v - HALF) / (span * HALF);
      else base = Math.hypot(u - origin[0], v - origin[1]) / span;
      out[r * cols + c] = clamp(base, 0, 1) * (1 - randomness) + noise * randomness;
    }
  }
  return out;
}

/** 方块半边长 (以格宽为单位). x 为方块的弹簧进度, gap 为格间留白比例. 到 1 附近与邻格重叠. */
export function tileHalf(x: number, gap: number): number {
  if (x <= 0) return 0;
  const half = HALF * (1 - gap);
  const cover = HALF * gap + TILE.overlap;
  return Math.min(x * TILE.grow, TILE.growCap) * (half + cover * smoothstep(TILE.mergeFrom, TILE.mergeTo, x));
}

/**
 * 全部方块的并集, 写成 clip-path 的 path(). 每格一个 (可旋转的) 方形子路径.
 *
 * @param spinDeg 每格的旋转角, 按格给出; 不给不转.
 */
export function tileClip(grid: TileGrid, halves: ArrayLike<number>, spinDeg?: ArrayLike<number>): string {
  const parts: string[] = [];
  const { cols, rows, cell } = grid;
  for (let i = 0; i < cols * rows; i += 1) {
    const h = halves[i] * cell;
    if (h <= 0) continue;
    const cx = ((i % cols) + HALF) * cell;
    const cy = (Math.floor(i / cols) + HALF) * cell;
    const a = ((spinDeg?.[i] ?? 0) * Math.PI) / 180;
    const cos = Math.cos(a) * h;
    const sin = Math.sin(a) * h;
    const pts = [
      [cx - cos + sin, cy - sin - cos],
      [cx + cos + sin, cy + sin - cos],
      [cx + cos - sin, cy + sin + cos],
      [cx - cos - sin, cy - sin + cos],
    ];
    parts.push(`M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L")}Z`);
  }
  return parts.length ? `path('${parts.join("")}')` : "inset(50%)";
}

export type MosaicAnimation = "pop" | "fade" | "scale";

/**
 * 马赛克某块在当前进度下的覆盖量 0..1. 进度 0..1 里前半盖上, 后半揭开.
 *
 * @param progress 整段进度.
 * @param delay 该块的起步顺序 0..1.
 */
export function mosaicAmount(progress: number, delay: number, animation: MosaicAnimation): number {
  const covering = progress < HALF;
  const local = covering ? progress * 2 : (progress - HALF) * 2;
  if (animation === "pop") return covering ? (local >= delay ? 1 : 0) : local >= delay ? 0 : 1;
  const t = smoothstep(0, 1, clamp((local - delay * (1 - MOSAIC.window)) / MOSAIC.window, 0, 1));
  return covering ? t : 1 - t;
}
