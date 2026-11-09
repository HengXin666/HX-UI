/**
 * PixelBloom 的规格常数与像素场: 网格布点, 按揭开原点排的延迟, 每格的出现与退场, 闪烁, 近指针聚光, 画到 canvas2d.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
import { clamp, smoothstep } from "../tokens";

/** 单格出现 0.26s, 退场 0.22s (PixelCard.jsx:40-41). */
export const PIXEL_APPEAR_S = 0.26;
export const PIXEL_EXIT_S = 0.22;
/** 形状码 (PixelCard.jsx:38). */
export const PIXEL_SHAPES = { square: 0, circle: 1, diamond: 2 } as const;
export type PixelShape = keyof typeof PIXEL_SHAPES;
export type PixelOrigin = "center" | "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
/** 聚光强度趋近速率: 升 6/s 降 3/s (PixelCard.jsx:399). */
export const PIXEL_SPOT_RATE = { rise: 6, fall: 3 } as const;
/** 预设: 间距 px 与闪烁速度 (规格 VARIANTS 的数值未摘录, HX 自定). */
export const PIXEL_VARIANTS = {
  default: { gap: 5, speed: 35 },
  calm: { gap: 7, speed: 15 },
  dense: { gap: 4, speed: 50 },
  still: { gap: 6, speed: 0 },
} as const;
export type PixelVariant = keyof typeof PIXEL_VARIANTS;
/** 退场延迟取出现延迟的一半 (HX 自定); 延迟抖动占 revealDuration 的 15% (HX 自定). */
export const PIXEL_EXIT_DELAY = 0.5;
export const PIXEL_JITTER = 0.15;
/** 聚光半径为短边的 0.45 (HX 自定). */
export const PIXEL_SPOT_REACH = 0.45;

const ORIGIN: Record<PixelOrigin, readonly [number, number]> = {
  center: [0.5, 0.5],
  top: [0.5, 0],
  bottom: [0.5, 1],
  left: [0, 0.5],
  right: [1, 0.5],
  "top-left": [0, 0],
  "top-right": [1, 0],
  "bottom-left": [0, 1],
  "bottom-right": [1, 1],
};

/** 可复现的伪随机 (0..1), 不依赖 Math.random. */
export function hash01(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export interface PixelField {
  readonly cols: number;
  readonly rows: number;
  readonly x: Float32Array;
  readonly y: Float32Array;
  /** 出现延迟 s. */
  readonly delay: Float32Array;
  readonly phase: Float32Array;
  readonly level: Float32Array;
}

/** 按间距铺网格; 每格延迟 = 离原点的归一化距离 × revealDuration + 抖动. */
export function buildField(width: number, height: number, gap: number, origin: PixelOrigin, revealMs: number): PixelField {
  const step = Math.max(2, gap);
  const cols = Math.max(0, Math.floor(width / step));
  const rows = Math.max(0, Math.floor(height / step));
  const n = cols * rows;
  const f: PixelField = { cols, rows, x: new Float32Array(n), y: new Float32Array(n), delay: new Float32Array(n), phase: new Float32Array(n), level: new Float32Array(n) };
  const [ox, oy] = ORIGIN[origin];
  const far = Math.max(Math.hypot(Math.max(ox, 1 - ox) * width, Math.max(oy, 1 - oy) * height), 1);
  const dur = Math.max(0, revealMs) / 1000;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const i = r * cols + c;
      const px = (c + 0.5) * step;
      const py = (r + 0.5) * step;
      f.x[i] = px;
      f.y[i] = py;
      f.delay[i] = (Math.hypot(px - ox * width, py - oy * height) / far) * dur * (1 - PIXEL_JITTER) + hash01(i) * dur * PIXEL_JITTER;
      f.phase[i] = hash01(i + 9.7) * Math.PI * 2;
    }
  }
  return f;
}

/** 推进一帧: on 时过了各自延迟按 1/APPEAR 升, off 时过了一半延迟按 1/EXIT 降. 返回是否还有格子在动. */
export function stepField(f: PixelField, on: boolean, clockS: number, dtS: number): boolean {
  let busy = false;
  const n = f.level.length;
  for (let i = 0; i < n; i += 1) {
    const v = f.level[i] ?? 0;
    const d = f.delay[i] ?? 0;
    if (on) {
      if (v >= 1) continue;
      busy = true;
      if (clockS >= d) f.level[i] = Math.min(1, v + dtS / PIXEL_APPEAR_S);
    } else {
      if (v <= 0) continue;
      busy = true;
      if (clockS >= d * PIXEL_EXIT_DELAY) f.level[i] = Math.max(0, v - dtS / PIXEL_EXIT_S);
    }
  }
  return busy;
}

/** 聚光强度趋近一帧: 规格 v += (want - v)(1 - exp(-rate dt)). */
export function stepSpot(power: number, want: number, dtS: number): number {
  const rate = want > power ? PIXEL_SPOT_RATE.rise : PIXEL_SPOT_RATE.fall;
  const next = power + (want - power) * (1 - Math.exp(-rate * dtS));
  return Math.abs(want - next) < 0.001 ? want : next;
}

/** 单格画多大: 基础 pixelSize × 出现程度 × 闪烁 × (1 + 聚光). */
export function pixelSize(base: number, level: number, twinkle: number, near: number, spotlight: number): number {
  return base * smoothstep(0, 1, level) * twinkle * (1 + near * spotlight);
}

export interface DrawOptions {
  readonly colors: readonly string[];
  readonly pixelSize: number;
  readonly shape: PixelShape;
  readonly speed: number;
  readonly spotlight: number;
  readonly spotPower: number;
  readonly spotX: number;
  readonly spotY: number;
  readonly opacity: number;
  readonly fade: number;
  readonly timeS: number;
  readonly width: number;
  readonly height: number;
}

/** 把场画到 2d 上下文 (坐标为 css px, 调用方已按 dpr 缩放). */
export function drawField(ctx: CanvasRenderingContext2D, f: PixelField, o: DrawOptions): void {
  ctx.clearRect(0, 0, o.width, o.height);
  const reach = Math.max(1, Math.min(o.width, o.height) * PIXEL_SPOT_REACH);
  const n = f.level.length;
  for (let i = 0; i < n; i += 1) {
    const level = f.level[i] ?? 0;
    if (level <= 0) continue;
    const x = f.x[i] ?? 0;
    const y = f.y[i] ?? 0;
    const twinkle = o.speed > 0 ? 0.7 + 0.3 * Math.sin(o.timeS * o.speed * 0.1 + (f.phase[i] ?? 0)) : 1;
    const near = smoothstep(reach, 0, Math.hypot(x - o.spotX, y - o.spotY)) * o.spotPower;
    const size = pixelSize(o.pixelSize, level, twinkle, near, o.spotlight);
    if (size <= 0.05) continue;
    const edge = o.fade > 0 ? 1 - o.fade * smoothstep(0.6, 1, Math.max(Math.abs(x / o.width - 0.5), Math.abs(y / o.height - 0.5)) * 2) : 1;
    ctx.globalAlpha = clamp(o.opacity * edge * (0.55 + 0.45 * level), 0, 1);
    ctx.fillStyle = o.colors[i % Math.max(1, o.colors.length)] ?? "currentColor";
    const h = size / 2;
    if (o.shape === "circle") {
      ctx.beginPath();
      ctx.arc(x, y, h, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.shape === "diamond") {
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x + h, y);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x - h, y);
      ctx.closePath();
      ctx.fill();
    } else ctx.fillRect(x - h, y - h, size, size);
  }
  ctx.globalAlpha = 1;
}
