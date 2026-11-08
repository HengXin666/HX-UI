// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 ShapeWaves 条目, 实现为 HX 自有.
/**
 * ShapeWaves 的 JS 侧波场: 一格一个高度与速度, 固定步长 (1/60 s) 积分的阻尼波方程; 指针划过时在 splashRadius 内压出水花,
 * 全场能量低于阈值即判为静止并停算. 结果打包成一格一纹素的 RGBA8 纹理 (r 为 |h| 即 charge, g 为带符号高度).
 * 另有文字遮罩: Canvas2D 把 text 画进不超过 1024 边长的离屏画布, 只用 alpha.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
import { clamp } from "../../backdrop/kernel";
import { inkOf, LINE_GREY } from "./tokens";

/** 条目常数: 积分步长, 波速, 速度摩擦, 高度衰减, 静止阈值, 遮罩边长上限. */
export const SHAPE_SIMULATION_STEP = 1 / 60;
export const SHAPE_WAVE_SPEED = 0.42;
export const SHAPE_WAVE_FRICTION = 0.94;
export const SHAPE_WAVE_DECAY = 0.972;
export const SHAPE_SETTLED_THRESHOLD = 0.01;
export const SHAPE_MAX_MASK_SIZE = 1024;
/** 波场格数上限 (每边), 防止极小 cellSize 拖垮 JS 积分 (本库定). */
export const SHAPE_MAX_GRID = 360;
/** 一帧最多补算的步数 (本库定). */
const MAX_STEPS = 4;

/** 波场: 格数, 高度与速度, 积分余量, 上一次指针位置 (格坐标), 是否已静止. */
export interface WaveField {
  readonly cols: number;
  readonly rows: number;
  readonly h: Float32Array;
  readonly v: Float32Array;
  acc: number;
  lastX: number;
  lastY: number;
  settled: boolean;
}

/** 水花输入: 指针在格坐标里的位置 (x 向右, y 向下), 半径 (格), 强度; 不在场时为 null. */
export interface SplashInput {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly strength: number;
}

/**
 * 由画布 CSS 尺寸与格边长得到格数, 每边钳到 [1, SHAPE_MAX_GRID].
 *
 * @param width CSS 宽.
 * @param height CSS 高.
 * @param cell 格边长 (CSS 像素).
 */
export function fieldGrid(width: number, height: number, cell: number): readonly [number, number] {
  const c = Math.max(cell, 1);
  return [clamp(Math.ceil(width / c), 1, SHAPE_MAX_GRID), clamp(Math.ceil(height / c), 1, SHAPE_MAX_GRID)];
}

export function makeWaveField(cols: number, rows: number): WaveField {
  const n = cols * rows;
  return { cols, rows, h: new Float32Array(n), v: new Float32Array(n), acc: 0, lastX: Number.NaN, lastY: Number.NaN, settled: true };
}

/** 一个固定步长: 四邻拉普拉斯推速度, 摩擦后积分高度再衰减; 返回全场最大 |h|. 边界按反射处理. */
export function waveStep(f: WaveField): number {
  const { cols, rows, h, v } = f;
  let peak = 0;
  for (let y = 0; y < rows; y += 1) {
    const up = (y > 0 ? y - 1 : y) * cols;
    const down = (y < rows - 1 ? y + 1 : y) * cols;
    const row = y * cols;
    for (let x = 0; x < cols; x += 1) {
      const i = row + x;
      const sum = h[row + (x > 0 ? x - 1 : x)] + h[row + (x < cols - 1 ? x + 1 : x)] + h[up + x] + h[down + x];
      v[i] = (v[i] + SHAPE_WAVE_SPEED * (sum - 4 * h[i])) * SHAPE_WAVE_FRICTION;
    }
  }
  for (let i = 0; i < h.length; i += 1) {
    h[i] = (h[i] + v[i]) * SHAPE_WAVE_DECAY;
    peak = Math.max(peak, Math.abs(h[i]));
  }
  return peak;
}

/**
 * 在 (x, y) 压一个水花, 量随指针挪动的格数增长 (挪满一格为满量), 落在半径内按 (1 - d / r)^2 衰减.
 * 返回压入的量 (0 表示没动).
 */
export function splash(f: WaveField, input: SplashInput): number {
  const moved = Number.isFinite(f.lastX) ? Math.hypot(input.x - f.lastX, input.y - f.lastY) : 0;
  f.lastX = input.x;
  f.lastY = input.y;
  const amount = input.strength * Math.min(moved, 1);
  const r = Math.max(input.radius, 0.5);
  if (amount <= 0) return 0;
  const x0 = Math.max(0, Math.floor(input.x - r));
  const x1 = Math.min(f.cols - 1, Math.ceil(input.x + r));
  const y0 = Math.max(0, Math.floor(input.y - r));
  const y1 = Math.min(f.rows - 1, Math.ceil(input.y + r));
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const d = Math.hypot(x + 0.5 - input.x, y + 0.5 - input.y) / r;
      if (d < 1) f.h[y * f.cols + x] -= amount * (1 - d) * (1 - d);
    }
  }
  f.settled = false;
  return amount;
}

/**
 * 推进 dt 秒: 先按指针压水花, 再按固定步长补算 (一帧至多 4 步). 已静止且没有新输入时不算.
 *
 * @param f 原地修改的波场.
 * @param dt 帧长 (秒), 静态帧为 0.
 * @param input 水花输入, 指针不在场或关掉交互时为 null.
 */
export function advanceField(f: WaveField, dt: number, input: SplashInput | null): WaveField {
  if (input) splash(f, input);
  else {
    f.lastX = Number.NaN;
    f.lastY = Number.NaN;
  }
  if (f.settled || dt <= 0) return f;
  f.acc = Math.min(f.acc + dt, MAX_STEPS * SHAPE_SIMULATION_STEP);
  let peak = Number.POSITIVE_INFINITY;
  while (f.acc >= SHAPE_SIMULATION_STEP) {
    f.acc -= SHAPE_SIMULATION_STEP;
    peak = waveStep(f);
  }
  if (peak < SHAPE_SETTLED_THRESHOLD) {
    f.h.fill(0);
    f.v.fill(0);
    f.settled = true;
  }
  return f;
}

/** 打包成 RGBA8: r = |h| (charge, 钳到 1), g = 0.5 + 0.5 h, a 满. 行序自上而下. */
export function packWaves(f: WaveField, out: Uint8ClampedArray): Uint8ClampedArray {
  for (let i = 0; i < f.h.length; i += 1) {
    const h = clamp(f.h[i], -1, 1);
    out[i * 4] = Math.round(Math.abs(h) * 255);
    out[i * 4 + 1] = Math.round((0.5 + 0.5 * h) * 255);
    out[i * 4 + 2] = 0;
    out[i * 4 + 3] = 255;
  }
  return out;
}

/** 遮罩画布尺寸: 跟画布同宽高比, 长边不超过 SHAPE_MAX_MASK_SIZE. */
export function maskSize(width: number, height: number): readonly [number, number] {
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  const k = Math.min(1, SHAPE_MAX_MASK_SIZE / Math.max(w, h));
  return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
}

/** 文字遮罩的参数. */
export interface TextMaskSpec {
  readonly text: string;
  readonly fontFamily: string;
  readonly fontWeight: number;
  readonly textSize: number;
}

/**
 * 把文字画进离屏画布 (居中, 字高为 textSize 乘画布高, 太宽时缩到 90% 画布宽). 没有文字, 没有 document
 * 或拿不到 2d 上下文时返回 null, 着色器不叠文字.
 */
export function createTextMask(spec: TextMaskSpec, width: number, height: number): HTMLCanvasElement | null {
  if (!spec.text.trim() || typeof document === "undefined") return null;
  const [w, h] = maskSize(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const font = (px: number): string => `${spec.fontWeight} ${px}px ${spec.fontFamily}`;
  let px = Math.max(1, h * clamp(spec.textSize, 0.05, 1));
  ctx.font = font(px);
  const measured = ctx.measureText(spec.text).width;
  if (measured > w * 0.9) px *= (w * 0.9) / measured;
  ctx.font = font(px);
  ctx.fillStyle = inkOf(LINE_GREY);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(spec.text, w / 2, h / 2);
  return canvas;
}
