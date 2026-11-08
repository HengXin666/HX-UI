// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Antigravity 条目, 实现为 HX 自有.
import { seeded, TURN } from "./tokens";

export type AntigravityShape = "capsule" | "sphere" | "box" | "tetrahedron";
export type AntigravityColorMode = "conic" | "radial" | "random";

export const ANTIGRAVITY = {
  /** 规格 WORLD_HEIGHT: 画布高对应的世界单位. */
  worldHeight: 31.5,
  /** 本库定: Canvas2D 逐个画, 数量上限 4000. */
  maxCount: 4000,
  /** 规格: 阻尼 = 1.64 * omega, 每帧子步上限 4, 子步数 ceil(omega * dt * 2). */
  dampingRatio: 1.64,
  maxSubsteps: 4,
  /** 规格: 帧长上限 1/30s, 入场钟走到 3s. */
  dtCap: 1 / 30,
  introSpan: 3,
  /** 规格: 入场时从下方 (0.45 + delay * 0.4) 个画布高处升起, 起飞时刻 delay * 0.9. */
  introDrop: 0.45,
  introDropSpan: 0.4,
  introLaunch: 0.9,
  /** 规格: 按住蓄力 dt / 0.9, 松开以 4 / s 泄掉. */
  chargeRise: 0.9,
  chargeFall: 4,
  /** 规格: 光标弹簧 刚度 49, 阻尼 14. */
  cursorStiffness: 49,
  cursorDamping: 14,
  /** 规格: 深度缩放 1 + z * 0.32, 远处雾 1 - max(-z, 0) * 0.35, 脉动 0.22 * variance. */
  depthScale: 0.32,
  depthFog: 0.35,
  pulseDepth: 0.22,
  /** 本库定: lerpSpeed 到弹簧角频率 omega 的换算 omega = 4 + lerpSpeed * 120. */
  omegaBase: 4,
  omegaPerLerp: 120,
  /** 本库定: 蓄满时环半径收到的比例与点击冲量 (世界单位 / 秒). */
  chargeShrink: 0.5,
  burstImpulse: 28,
} as const;

/** 群体的结构化数组: 家位置, 位置, 速度, 深度, 敏捷度, 入场延迟, 色相种子, 环带偏移. */
export interface Swarm {
  readonly count: number;
  readonly hx: Float32Array;
  readonly hy: Float32Array;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly z: Float32Array;
  readonly agility: Float32Array;
  readonly delay: Float32Array;
  readonly hue: Float32Array;
  readonly band: Float32Array;
}

/**
 * 在世界矩形 [0, w] x [0, h] 里撒点, 家位置均匀分布, 入场时整体沉在下方.
 *
 * @param count 数量 (钳到上限).
 * @param w 世界宽.
 * @param h 世界高 (y 朝下).
 * @param seed 种子.
 * @param intro 是否从下方升起.
 */
export function makeSwarm(count: number, w: number, h: number, seed: number, intro: boolean): Swarm {
  const n = Math.max(0, Math.min(ANTIGRAVITY.maxCount, Math.round(count)));
  const rand = seeded(seed);
  const f = (): Float32Array => new Float32Array(n);
  const s: Swarm = { count: n, hx: f(), hy: f(), x: f(), y: f(), vx: f(), vy: f(), z: f(), agility: f(), delay: f(), hue: f(), band: f() };
  for (let i = 0; i < n; i += 1) {
    s.hx[i] = rand() * w;
    s.hy[i] = rand() * h;
    s.z[i] = rand() * 2 - 1;
    s.agility[i] = 0.6 + rand() * 0.8;
    s.delay[i] = rand();
    s.hue[i] = rand();
    s.band[i] = rand() * 2 - 1;
    s.x[i] = s.hx[i];
    s.y[i] = intro ? s.hy[i] + h * (ANTIGRAVITY.introDrop + s.delay[i] * ANTIGRAVITY.introDropSpan) : s.hy[i];
  }
  return s;
}

/** 环在某方位角的半径: ringRadius + 波浪 + 环带厚度. */
export function ringAt(angle: number, time: number, ring: number, amplitude: number, waves: number, waveSpeed: number, band: number): number {
  return ring + amplitude * Math.sin(angle * Math.round(waves) + time * waveSpeed * TURN) + band;
}

/**
 * 临界附近阻尼弹簧的一次显式子步积分 (阻尼 1.64 omega). 子步数按 omega * dt * 2 取整, 上限 4.
 *
 * @returns 新的 [x, v].
 */
export function springStep(x: number, v: number, target: number, omega: number, dt: number): [number, number] {
  if (omega <= 0 || dt <= 0) return [x, v];
  const steps = Math.min(ANTIGRAVITY.maxSubsteps, Math.max(1, Math.ceil(omega * dt * 2)));
  const h = dt / steps;
  let px = x;
  let pv = v;
  for (let i = 0; i < steps; i += 1) {
    pv += (omega * omega * (target - px) - ANTIGRAVITY.dampingRatio * omega * pv) * h;
    px += pv * h;
  }
  return [px, pv];
}

/** 蓄力: 按住时 dt / 0.9 升到 1, 松开时每秒掉 4. */
export function stepCharge(charge: number, down: boolean, dt: number): number {
  return down ? Math.min(1, charge + dt / ANTIGRAVITY.chargeRise) : Math.max(0, charge - dt * ANTIGRAVITY.chargeFall);
}

/** lerpSpeed 换弹簧角频率. */
export function omegaOf(lerpSpeed: number): number {
  return ANTIGRAVITY.omegaBase + lerpSpeed * ANTIGRAVITY.omegaPerLerp;
}
