// 行为规格参照 docs/research/catalog/animations.md 的 Noise 条目, 实现为 HX 自有.
/**
 * texture 族 (叠在内容上的表面质感) 的手感合同. 数值是规格条目里的常数与 props 默认值, 注释写原规格名.
 * 规格没给, 由本库定的值单独标注.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-texture.md
 */

/* ── GrainLayer (规格 Noise) ── */
export const GRAIN = {
  /** 颗粒贴片边长 px (TILE). */
  tile: 256,
  /** 画布像素比上限. */
  dprCap: 2,
  /** props 默认值: 不透明度, 颗粒倍数, 帧率, 对比度. */
  opacity: 0.2,
  size: 1,
  fps: 24,
  contrast: 0.6,
  /** 每帧每贴片的尘点上限 (dust = 1 时), 尘点边长 px (本库定). */
  dustMax: 24,
  dustPx: 2,
  /** 划痕: 每帧出现的概率上限 (scratches = 1 时), 划痕宽 px (本库定). */
  scratchChance: 0.6,
  scratchPx: 1,
  /** 扫描线周期 px 与压暗上限 (scanlines = 1 时) (本库定). */
  scanPeriodPx: 3,
  scanDim: 0.5,
  /** 闪烁: 不透明度随机下探的上限 (flicker = 1 时) (本库定). */
  flickerDip: 0.5,
} as const;

export type GrainBlend = "overlay" | "soft-light" | "multiply" | "screen" | "normal";
