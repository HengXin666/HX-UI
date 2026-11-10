// 行为规格参照 docs/research/catalog/animations.md 的 ElectricLogo 条目, 实现为 HX 自有.
/**
 * SparkMark 的小状态: 两套形状间的形变进度, 沿轮廓跑的脉冲 (3 个槽), 光标弹簧与力度. 纯函数.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { SPARK_MARK } from "../tokens";

export interface SparkPulse {
  /** 起点 (轮廓角度 0..1). */
  at: number;
  /** 进度 0..1. */
  progress: number;
  /** 强度. */
  w: number;
  /** 年龄 (秒). */
  age: number;
}

export interface SparkState {
  morph: number;
  pending: boolean;
  pulses: SparkPulse[];
  next: number;
  slot: number;
  hover: { x: number; y: number; vx: number; vy: number; power: number; placed: boolean };
  seed: number;
}

export function makeSpark(): SparkState {
  return {
    morph: 1,
    pending: false,
    pulses: Array.from({ length: SPARK_MARK.pulses }, () => ({ at: 0, progress: 1, w: 0, age: 9 })),
    next: 0,
    slot: 0,
    hover: { x: 0.5, y: 0.5, vx: 0, vy: 0, power: 0, placed: false },
    seed: 0.37,
  };
}

/** 开始一次形变 (换了形状): 进度归零; pending 为真时用快档 0.3s. */
export function startMorph(s: SparkState, pending: boolean): void {
  s.morph = 0;
  s.pending = pending;
}

/** 下一个伪随机数 (0..1), 状态里自带种子, 测试可复现. */
function rand(s: SparkState): number {
  s.seed = (s.seed * 9301 + 0.49297) % 1;
  return s.seed;
}

/**
 * 推进一帧. 帧长夹到 0.05.
 *
 * @param pointer 归一化坐标 (y 朝上) 与是否在场.
 */
export function stepSpark(s: SparkState, rawDt: number, time: number, interactive: boolean, pointer: { x: number; y: number; inside: boolean }): void {
  const dt = Math.min(SPARK_MARK.maxDt, Math.max(0, rawDt));
  if (dt <= 0) return;
  if (s.morph < 1) s.morph = Math.min(1, s.morph + dt / (s.pending ? SPARK_MARK.morphPendingS : SPARK_MARK.morphS));
  for (const p of s.pulses) {
    p.progress = Math.min(1, p.progress + dt / SPARK_MARK.pulseS);
    p.age += dt;
  }
  if (time >= s.next) {
    s.next = time + SPARK_MARK.pulseEvery;
    s.pulses[s.slot] = { at: rand(s), progress: 0, w: 0.6 + 0.4 * rand(s), age: 0 };
    s.slot = (s.slot + 1) % SPARK_MARK.pulses;
  }
  const h = s.hover;
  const engaged = interactive && pointer.inside;
  if (engaged && !h.placed) {
    h.x = pointer.x;
    h.y = pointer.y;
    h.placed = true;
  }
  if (!engaged) h.placed = false;
  const gx = engaged ? pointer.x : h.x;
  const gy = engaged ? pointer.y : h.y;
  h.vx += ((gx - h.x) * SPARK_MARK.hoverK - h.vx * SPARK_MARK.hoverC) * dt;
  h.vy += ((gy - h.y) * SPARK_MARK.hoverK - h.vy * SPARK_MARK.hoverC) * dt;
  h.x += h.vx * dt;
  h.y += h.vy * dt;
  h.power += ((engaged ? 1 : 0) - h.power) * (1 - Math.exp(-dt / (engaged ? SPARK_MARK.powerIn : SPARK_MARK.powerOut)));
}

/** 打包脉冲: (起点, 进度, 年龄, 强度) x 3. */
export function packPulses(s: SparkState): Float32Array {
  const out = new Float32Array(SPARK_MARK.pulses * 4);
  s.pulses.forEach((p, i) => out.set([p.at, p.progress, p.age, p.w], i * 4));
  return out;
}

/** 规格 PIXEL_BUDGET: 像素比 min(设备上限, sqrt(budget / CSS 面积)), 大宿主时压低分辨率, 画布总像素约不超过 budget. */
export function pixelBudgetDpr(cssWidth: number, cssHeight: number, cap: number, budget: number = SPARK_MARK.pixelBudget): number {
  const area = Math.max(1, cssWidth) * Math.max(1, cssHeight);
  return Math.min(cap, Math.sqrt(budget / area));
}
