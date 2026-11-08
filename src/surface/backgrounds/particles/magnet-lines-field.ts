// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 MagnetLines 条目, 实现为 HX 自有.
import type { Rgb } from "../../backdrop/kernel/color";
import { seeded, smooth, TURN, wrapAngle } from "./tokens";

export type MagnetMode = "point" | "orbit" | "repel" | "flow";
export type MagnetShape = "line" | "arrow" | "needle";

export const MAGNET = {
  /** 规格: 点击脉冲环 520 px/s, 扫过时拧 0.34 圈; 入场波 700 px/s, 每根 1.1s 内转 0.65 圈落定; 影响在 FAR (4) 的 0.45..1 倍间淡出. */
  pulseSpeed: 520,
  pulseSpin: 0.34,
  introSpeed: 700,
  introTime: 1.1,
  introSpin: 0.65,
  far: 4,
  /** 规格: 帧长上限 0.05s; 指针 0.035s 跟随 (巡游时 0.6s); 航向 0.25s; 速度 0.12s 衰减; 弹簧子步 1/240s. */
  dtCap: 0.05,
  followTau: 0.035,
  wanderTau: 0.6,
  headingTau: 0.25,
  velocityTau: 0.12,
  substep: 1 / 240,
  /** 规格 MAX_LINES 30000; 本库定: Canvas2D 逐根描线, 上限 8000. */
  maxLines: 8000,
  /** 本库定: 脉冲环宽 (CSS 像素) 与寿命 (秒). */
  pulseWidth: 48,
  pulseLife: 2,
} as const;

/**
 * 角弹簧刚度: inertia 越大越软; inertia 不大于 0 或减弱动效时为 0 (直接到位).
 *
 * @param inertia 0..1.
 * @param reduced 是否减弱动效.
 */
export function stiffnessOf(inertia: number, reduced: boolean): number {
  if (inertia <= 0 || reduced) return 0;
  const w = 6 + 42 * Math.pow(1 - Math.min(1, inertia), 2);
  return w * w;
}

/** 阻尼: 临界阻尼 2 sqrt(k) 乘 (1 - 0.75 bounce), bounce 越大越会回弹. */
export function dampingOf(stiffness: number, bounce: number): number {
  return stiffness ? 2 * Math.sqrt(stiffness) * (1 - 0.75 * bounce) : 0;
}

/**
 * 角度弹簧推进 dt (子步 1/240s), 目标差按 period 折回, 线 (对称) 用 PI, 箭头与磁针用 2 PI.
 *
 * @returns 新的 [角度, 角速度].
 */
export function springAngle(angle: number, velocity: number, goal: number, k: number, c: number, dt: number, period: number): [number, number] {
  if (!k) return [angle + wrapAngle(goal - angle, period), 0];
  const steps = Math.max(1, Math.ceil(dt / MAGNET.substep));
  const h = dt / steps;
  let a = angle;
  let v = velocity;
  for (let i = 0; i < steps; i += 1) {
    v += (k * wrapAngle(goal - a, period) - c * v) * h;
    a += v * h;
  }
  return [a, v];
}

/** 各模式的朝向: point 指向指针, orbit 绕指针切向, repel 背离, flow 顺着指针航向. */
export function modeAngle(mode: MagnetMode, dx: number, dy: number, heading: number): number {
  const toward = Math.atan2(dy, dx);
  if (mode === "orbit") return toward + Math.PI / 2;
  if (mode === "repel") return toward + Math.PI;
  if (mode === "flow") return heading;
  return toward;
}

/** 距指针 d (以 radius 为单位) 的影响: FAR * 0.45 内为 1, 到 FAR 平滑落到 0. */
export function influenceAt(d: number, radius: number): number {
  return 1 - smooth(MAGNET.far * 0.45, MAGNET.far, d / Math.max(1e-3, radius / MAGNET.far));
}

/** 点击脉冲环在距点击 d 处, 点击后 age 秒的强度 (高斯环, 线性淡出). */
export function pulseAt(d: number, age: number): number {
  if (age < 0 || age > MAGNET.pulseLife) return 0;
  const k = (d - age * MAGNET.pulseSpeed) / MAGNET.pulseWidth;
  return Math.exp(-k * k) * (1 - age / MAGNET.pulseLife);
}

/** 入场: 波从中心以 700 px/s 走到距离 d, 之后 1.1s 内显形并把多转的 0.65 圈缓出. */
export function introAt(d: number, elapsed: number): { shown: number; spin: number } {
  if (!Number.isFinite(elapsed)) return { shown: 1, spin: 0 };
  const t = elapsed - d / MAGNET.introSpeed;
  const k = Math.min(1, Math.max(0, t / MAGNET.introTime));
  return { shown: smooth(0, 0.25, k), spin: MAGNET.introSpin * TURN * Math.pow(1 - k, 3) };
}

/** 网格: rows / columns 给了就按它们排满, 否则按 spacing (CSS 像素) 排; 总数钳到上限. */
export interface MagnetGrid {
  readonly cols: number;
  readonly rows: number;
  readonly dx: number;
  readonly dy: number;
  readonly ox: number;
  readonly oy: number;
}

export function layoutGrid(width: number, height: number, spacing: number, rows?: number, columns?: number): MagnetGrid {
  const gap = Math.max(4, spacing);
  let cols = Math.max(1, Math.round(columns ?? width / gap));
  let rs = Math.max(1, Math.round(rows ?? height / gap));
  const over = (cols * rs) / MAGNET.maxLines;
  if (over > 1) {
    cols = Math.max(1, Math.floor(cols / Math.sqrt(over)));
    rs = Math.max(1, Math.floor(rs / Math.sqrt(over)));
  }
  const dx = width / cols;
  const dy = height / rs;
  return { cols, rows: rs, dx, dy, ox: dx / 2, oy: dy / 2 };
}

/** 每根线的状态: 角度, 角速度, 散布偏角. */
export interface MagnetNeedles {
  readonly count: number;
  readonly angle: Float32Array;
  readonly velocity: Float32Array;
  readonly jitter: Float32Array;
}

export function makeNeedles(count: number, base: number, scatter: number, seed: number): MagnetNeedles {
  const rand = seeded(seed);
  const n = Math.max(0, Math.min(MAGNET.maxLines, count));
  const s: MagnetNeedles = { count: n, angle: new Float32Array(n), velocity: new Float32Array(n), jitter: new Float32Array(n) };
  for (let i = 0; i < n; i += 1) {
    s.jitter[i] = (rand() * 2 - 1) * Math.PI * scatter;
    s.angle[i] = base + s.jitter[i];
  }
  return s;
}

/** sRGB 绕亮度轴转色相 (YIQ 平面旋转), rainbow 模式按朝向取色用. */
export function hueTurn(rgb: Rgb, a: number): Rgb {
  const y = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  const i = 0.596 * rgb[0] - 0.274 * rgb[1] - 0.322 * rgb[2];
  const q = 0.211 * rgb[0] - 0.523 * rgb[1] + 0.312 * rgb[2];
  const c = Math.cos(a);
  const s = Math.sin(a);
  const i2 = i * c - q * s;
  const q2 = i * s + q * c;
  const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
  return [clamp01(y + 0.956 * i2 + 0.621 * q2), clamp01(y - 0.272 * i2 - 0.647 * q2), clamp01(y - 1.106 * i2 + 1.703 * q2)];
}
