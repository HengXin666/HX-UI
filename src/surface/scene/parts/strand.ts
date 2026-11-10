// 行为规格参照 docs/research/catalog/animations.md 的 Strands 条目, 实现为 HX 自有.
/**
 * FiberStrands 的 JS 侧: 指针偏弯 (lean, 平滑跟随, 离开时回 0), 点击脉冲 (幅度乘子, 指数衰减), 入场进度, 外部电平 level 与 energy 的合成.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
import { STRAND } from "../tokens";

export interface StrandState {
  lx: number;
  ly: number;
}

export function makeStrands(): StrandState {
  return { lx: 0, ly: 0 };
}

/** 指针 (短边单位, 原点中心) 在场时 lean 趋向它, 不在场时回 0; 时间常数 0.25 秒. */
export function stepStrands(s: StrandState, dt: number, pointer: { x: number; y: number } | null): StrandState {
  const a = 1 - Math.exp(-Math.max(0, dt) / 0.25);
  s.lx += ((pointer?.x ?? s.lx) - s.lx) * a;
  s.ly += ((pointer?.y ?? 0) - s.ly) * a;
  return s;
}

/** 点击脉冲: 1 + gain x sum exp(-decay (now - at)). */
export function strandPulse(taps: readonly { at: number }[], now: number): number {
  let sum = 0;
  for (const t of taps) if (now >= t.at) sum += Math.exp(-STRAND.pulseDecay * (now - t.at));
  return 1 + STRAND.pulseGain * Math.min(2, sum);
}

/** 能量: energy 与外部电平 level (0..1) 合成, 钳 0..1.5. */
export function strandEnergy(energy: number, level: number | undefined): number {
  return Math.min(1.5, Math.max(0, energy + (level ?? 0) * 0.8));
}

export function strandIntro(elapsed: number): number {
  return Math.min(1, Math.max(0, elapsed / STRAND.introSeconds));
}
