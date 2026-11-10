// 行为规格参照 docs/research/catalog/animations.md 的 PixelTrail 条目, 实现为 HX 自有.

/**
 * CellTrail 的常数与纯函数: 网格尺寸, 轨迹点插值与力度, 每格强度, 抖动阈值.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-pointer.md
 */

/* ── CellTrail (规格 PixelTrail) ── */
export const CELL = {
  /** props 默认值: 横向格数, 笔刷半径 (占宽度的比例), 寿命 ms, 每次移动最多补几个点, 格间隙比例, 光晕. */
  gridSize: 40,
  trailSize: 0.1,
  maxAge: 250,
  interpolate: 5,
  gap: 0.08,
  glow: 0.4,
  /** 力度: 位移比例 x 10000 的平方口径, 钳到 0.3..1 (force). */
  forceMin: 0.3,
  forceScale: 10000,
  /** 强度从 0 升到满所占寿命的比例 (maxAge x 0.3). */
  riseShare: 0.3,
  /** 点数上限, 低于这个强度的格不画, 点击散开的点数 (本库定). */
  maxPoints: 256,
  minStrength: 0.02,
  burstPoints: 10,
  /** 帧长上限 (秒), 像素比上限. */
  maxDtS: 0.05,
  dprCap: 2,
} as const;

export type CellShape = "square" | "circle" | "diamond";
export type CellDecay = "fade" | "shrink" | "dither";

export interface TrailPoint {
  x: number;
  y: number;
  age: number;
  force: number;
}

/** 网格: 横向 gridSize 格, 纵向按方格补满. */
export function cellGrid(width: number, height: number, gridSize: number): { readonly cols: number; readonly rows: number; readonly cell: number } {
  const cols = Math.max(1, Math.round(gridSize));
  const cell = width > 0 ? width / cols : 0;
  return { cols, rows: cell > 0 ? Math.max(1, Math.ceil(height / cell)) : 0, cell };
}

/** 一次移动的力度: 位移 (宽度为 1 的比例) 的平方乘系数, 钳到 [min, 1]. */
export function moveForce(dx: number, dy: number, scale: number, min: number): number {
  return Math.max(min, Math.min((dx * dx + dy * dy) * scale, 1));
}

/** 上一点到这一点之间补多少个点: 按跨过的格数, 最多 limit 个. */
export function fillCount(distCells: number, limit: number): number {
  return Math.max(0, Math.min(Math.max(0, Math.round(limit)), Math.floor(distCells)));
}

/** 一点的寿命包络: 前 riseShare 段升起, 之后线性落到 0. */
export function lifeEnvelope(age: number, maxAge: number, riseShare: number): number {
  if (maxAge <= 0 || age >= maxAge) return 0;
  const rise = maxAge * riseShare;
  if (rise > 0 && age < rise) return age / rise;
  return 1 - (age - rise) / Math.max(1e-6, maxAge - rise);
}

/**
 * 把轨迹点叠进格强度 (取最大值): 每点按高斯笔刷影响半径 radius 格内的格.
 *
 * @param out 长 cols x rows, 调用方清零.
 */
export function stampCells(out: Float32Array, cols: number, rows: number, cell: number, points: readonly TrailPoint[], radiusCells: number, maxAge: number, riseShare: number): void {
  if (cell <= 0 || radiusCells <= 0) return;
  const sigma = radiusCells / 2;
  const reach = Math.ceil(radiusCells);
  for (const p of points) {
    const life = lifeEnvelope(p.age, maxAge, riseShare) * p.force;
    if (life <= 0) continue;
    const cx = p.x / cell;
    const cy = p.y / cell;
    for (let r = Math.max(0, Math.floor(cy) - reach); r <= Math.min(rows - 1, Math.floor(cy) + reach); r += 1) {
      for (let c = Math.max(0, Math.floor(cx) - reach); c <= Math.min(cols - 1, Math.floor(cx) + reach); c += 1) {
        const d2 = (c + 0.5 - cx) ** 2 + (r + 0.5 - cy) ** 2;
        if (d2 > radiusCells * radiusCells) continue;
        const v = life * Math.exp(-d2 / (2 * sigma * sigma));
        const i = r * cols + c;
        if (v > out[i]) out[i] = v;
      }
    }
  }
}

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** 4x4 有序抖动阈值 (0..1): dither 衰减时强度高过它的格才画. */
export function ditherThreshold(col: number, row: number): number {
  return (BAYER4[(row % 4) * 4 + (col % 4)] + 0.5) / 16;
}
