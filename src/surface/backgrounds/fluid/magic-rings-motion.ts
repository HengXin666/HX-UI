// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 MagicRings 条目, 实现为 HX 自有.
import { smoothstep } from "../../backdrop/kernel/math";

/** 环数上限. */
export const RINGS_MAX = 12;
/** 同时存活的点击爆环数. */
export const RINGS_MAX_BURSTS = 3;
/** pulse 模式下一个环从生到灭的周期 (秒). */
export const RINGS_CYCLE = 3.45;
/** 相邻两环出生的错开 (秒). */
export const RINGS_STAGGER = 0.5;
/** 一个周期里环向外推开的深度倍率 (乘 expansion). */
export const RINGS_DEPTH = 2.6;
/** 爆环寿命 (秒) 与扩散速度 (平面单位每秒). */
export const RINGS_BURST_LIFE = 1.1;
export const RINGS_BURST_SPEED = 0.9;
/** 跟手弹簧: 刚度 70, 阻尼为临界的 0.9, 子步 1/240 秒. */
export const RINGS_STIFFNESS = 70;
export const RINGS_DAMPING = 2 * Math.sqrt(RINGS_STIFFNESS) * 0.9;
export const RINGS_SUBSTEP = 1 / 240;
/** 悬停弹簧刚度 (临界阻尼). */
export const RINGS_HOVER_STIFFNESS = 40;

export type RingsMotion = "pulse" | "breathe" | "static";

export interface RingsLayout {
  readonly ringCount: number;
  readonly motion: RingsMotion;
  readonly baseRadius: number;
  readonly radiusStep: number;
  readonly expansion: number;
  readonly intro: boolean;
}

/** pulse 模式一个环的亮度包络: 0.7 秒亮起, 0.5 到 3.25 秒之间熄灭. */
export function ringsPulseLife(t: number): number {
  return Math.max(0, Math.min(smoothstep(0, 0.7, t), 1 - smoothstep(0.5, 3.25, t)));
}

/** 爆环包络: 进度 0..1, 前 12% 亮起, 62% 之后熄灭. */
export function ringsBurstLife(progress: number): number {
  if (progress < 0 || progress > 1) return 0;
  return smoothstep(0, 0.12, progress) * (1 - smoothstep(0.62, 1, progress));
}

/**
 * 每个环本帧的 (半径, 亮度, 相位, 序号占比), 平铺成 RINGS_MAX * 4 个数.
 *
 * @param layout 环相关 props.
 * @param time 场时钟 (秒).
 * @param elapsed 出帧以来真实秒数, 给入场用; 无穷表示入场已完成.
 */
export function ringsLayout(layout: RingsLayout, time: number, elapsed: number): number[] {
  const out = new Array<number>(RINGS_MAX * 4).fill(0);
  const count = Math.max(1, Math.min(RINGS_MAX, Math.round(layout.ringCount)));
  for (let i = 0; i < count; i += 1) {
    const rest = layout.baseRadius + layout.radiusStep * i;
    let radius = rest;
    let alpha = 1;
    if (layout.motion === "pulse") {
      const local = time - i * RINGS_STAGGER;
      const cycle = local < 0 ? -1 : local % RINGS_CYCLE;
      alpha = cycle < 0 ? 0 : ringsPulseLife(cycle);
      radius = rest + layout.expansion * RINGS_DEPTH * Math.max(cycle, 0) / RINGS_CYCLE;
    } else if (layout.motion === "breathe") {
      radius = rest + layout.expansion * 0.5 * Math.sin(((time + i * RINGS_STAGGER) / RINGS_CYCLE) * Math.PI * 2);
    }
    const rise = layout.intro && Number.isFinite(elapsed) ? smoothstep(i * 0.12, i * 0.12 + 0.9, elapsed) : 1;
    out[i * 4] = radius;
    out[i * 4 + 1] = alpha * rise;
    out[i * 4 + 2] = i * 2.399;
    out[i * 4 + 3] = count > 1 ? i / (count - 1) : 0;
  }
  return out;
}

export interface RingsSpring {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hover: number;
  hoverVelocity: number;
}

/**
 * 推进跟手与悬停弹簧, 按 1/240 秒子步积分.
 *
 * @param s 原地修改的弹簧.
 * @param goalX 目标偏移 x.
 * @param goalY 目标偏移 y.
 * @param hoverTarget 悬停目标 0 或 1.
 * @param dt 帧长 (秒).
 */
export function stepRingsSpring(s: RingsSpring, goalX: number, goalY: number, hoverTarget: number, dt: number): void {
  const steps = Math.max(1, Math.ceil(dt / RINGS_SUBSTEP));
  const h = dt / steps;
  for (let k = 0; k < steps; k += 1) {
    s.vx += (RINGS_STIFFNESS * (goalX - s.x) - RINGS_DAMPING * s.vx) * h;
    s.vy += (RINGS_STIFFNESS * (goalY - s.y) - RINGS_DAMPING * s.vy) * h;
    s.x += s.vx * h;
    s.y += s.vy * h;
    s.hoverVelocity += (RINGS_HOVER_STIFFNESS * (hoverTarget - s.hover) - 2 * Math.sqrt(RINGS_HOVER_STIFFNESS) * s.hoverVelocity) * h;
    s.hover += s.hoverVelocity * h;
  }
}
