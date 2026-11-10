// 行为规格参照 docs/research/catalog/animations.md 的 CrystalizedBall 条目, 实现为 HX 自有.
/**
 * PrismOrb 的 JS 侧: 预设与显式 props 合并, 悬停状态, 每帧算电弧主干 (MAX_STRANDS) 与支弧 (MAX_ARCS) 的角度与长度,
 * 打包给片元. 角度从 +x 逆时针量 (y 朝上), 长度以球半径为 1.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
import { PRISM, PRISM_PRESETS } from "../tokens";

export type PrismPreset = keyof typeof PRISM_PRESETS;
export type PrismMotion = keyof typeof PRISM.motions;
export type PrismShape = keyof typeof PRISM.shapes;

export interface PrismLook {
  strands: number;
  crackle: number;
  flares: number;
  glow: number;
  sparks: number;
  particleCount: number;
  fill: number;
  motion: PrismMotion;
  particleShape: PrismShape;
  depth: number;
  sway: number;
  twinkle: number;
  haze: number;
  dustSpeed: number;
}

/** 预设打底, 显式给了的 props 覆盖; 数量类钳到规格上限. */
export function prismLook(preset: PrismPreset, overrides: Partial<PrismLook>): PrismLook {
  const base = PRISM_PRESETS[preset] ?? PRISM_PRESETS.plasma;
  const picked = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined)) as Partial<PrismLook>;
  const look: PrismLook = { ...base, ...picked };
  look.strands = Math.max(0, Math.min(PRISM.maxStrands, Math.round(look.strands)));
  look.particleCount = Math.max(0, Math.min(PRISM.maxParticles, Math.round(look.particleCount)));
  return look;
}

export interface PrismState {
  /** 悬停在场 0..1 与指针所在的方向角. */
  power: number;
  angle: number;
}

export function makePrism(): PrismState {
  return { power: 0, angle: Math.PI / 2 };
}

/** 一帧悬停: 指针在球内 (半径 1.15 以内) 时在场趋近 1, 角度跟到指针方向. dx / dy 以球半径为 1, y 朝上. */
export function stepPrism(s: PrismState, dt: number, near: { dx: number; dy: number; inside: boolean } | null): PrismState {
  const on = near !== null && near.inside && Math.hypot(near.dx, near.dy) < 1.15;
  s.power += ((on ? 1 : 0) - s.power) * (1 - Math.exp(-Math.max(0, dt) / PRISM.hoverTau));
  if (on && near) s.angle = Math.atan2(near.dy, near.dx);
  return s;
}

/** 平滑的伪随机游走 (三条不可公度的正弦叠加), 落在 -1..1. */
export function prismWander(t: number, seed: number): number {
  return (Math.sin(t * 0.37 + seed * 1.7) * 0.5 + Math.sin(t * 0.61 + seed * 4.1) * 0.3 + Math.sin(t * 1.13 + seed * 2.3) * 0.2);
}

function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/**
 * 主干打包成 vec4[MAX_STRANDS]: x 角度, y 伸到的长度 (入场时长出来), z 种子, w 亮度 (0 为不画).
 * 支弧打包成 vec4[MAX_ARCS]: x 角度, y 起点半径, z 终点半径, w 亮度 (按时间片闪烁).
 * 悬停时离指针最近的主干被拉过去, 其余按角距衰减地偏一点.
 */
export function packPrism(s: PrismState, look: PrismLook, time: number, elapsed: number, intro: boolean, hoverStrength: number): { strands: Float32Array; arcs: Float32Array } {
  const strands = new Float32Array(PRISM.maxStrands * 4);
  const arcs = new Float32Array(PRISM.maxArcs * 4);
  const grow = intro ? Math.min(1, Math.max(0, elapsed / PRISM.introSeconds)) : 1;
  const reach = grow * grow * (3 - 2 * grow);
  const angles: number[] = [];
  for (let i = 0; i < look.strands; i += 1) {
    const base = (i / Math.max(1, look.strands)) * Math.PI * 2 + prismWander(time * 0.6, i + 1) * 1.1;
    angles.push(base);
  }
  let nearest = -1;
  let best = Infinity;
  angles.forEach((a, i) => {
    const d = Math.abs(wrapAngle(a - s.angle));
    if (d < best) {
      best = d;
      nearest = i;
    }
  });
  const pull = s.power * hoverStrength;
  angles.forEach((a, i) => {
    const d = wrapAngle(s.angle - a);
    const w = i === nearest ? 1 : Math.exp(-Math.abs(d) * 2) * 0.35;
    const angle = a + d * pull * w;
    const bright = 0.75 + 0.25 * prismWander(time * 3, i * 7 + 3) + (i === nearest ? pull * 0.6 : 0);
    strands.set([angle, reach, i * 13.7 + 1, Math.max(0, bright)], i * 4);
  });
  for (let k = 0; k < PRISM.maxArcs; k += 1) {
    const slot = Math.floor(time * 6 + k * 0.37);
    const h = Math.abs(Math.sin(slot * 12.9898 + k * 78.233) * 43758.5453) % 1;
    const host = angles.length ? angles[Math.floor(h * angles.length) % angles.length] ?? 0 : h * Math.PI * 2;
    const on = h < 0.35 + 0.4 * look.crackle ? 1 : 0;
    const r0 = 0.3 + 0.3 * h;
    arcs.set([host + (h - 0.5) * 0.9, r0 * reach, Math.min(0.95, r0 + 0.35) * reach, on * look.crackle], k * 4);
  }
  return { strands, arcs };
}

/** 刚挂载时多给的能量, 按 SETTLE_SECONDS 回落到 1. */
export function prismEnergy(elapsed: number): number {
  const t = Math.min(1, Math.max(0, elapsed / PRISM.settleSeconds));
  return 1 + PRISM.settleBoost * (1 - t) * (1 - t);
}
