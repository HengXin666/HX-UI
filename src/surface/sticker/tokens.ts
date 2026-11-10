// 行为规格参照 docs/research/catalog/animations.md 的 StickerPeel 条目, 实现为 HX 自有.
/**
 * sticker 族 (可揭可拖的贴纸) 的手感合同. 数值是规格条目里的常数与 props 默认值, 注释写原规格名.
 * 规格没给, 由本库定的值单独标注.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-sticker.md
 */

/* ── PeelSticker (规格 StickerPeel) ── */
export const PEEL = {
  /** 帧长 1/1000 到 1/30 秒. */
  minDtS: 0.001,
  maxDtS: 1 / 30,
  /** 入场时长 (intro += dt / 1.1). */
  introS: 1.1,
  /** 指针平滑的时间常数 (1 - exp(-dt / 0.045)). */
  pointerTauS: 0.045,
  /** 揭起弹簧: 悬停或按下时 3Hz / 0.7, 回落时 3.6Hz / 0.62. */
  peelHotHz: 3,
  peelHotDamping: 0.7,
  peelRestHz: 3.6,
  peelRestDamping: 0.62,
  /** 托起弹簧 3.2Hz / 0.55, 摆动回正 1.4Hz / 0.32, 摆动驱动 1.1, 摆角上限 1.2 rad. */
  liftHz: 3.2,
  liftDamping: 0.55,
  swingHz: 1.4,
  swingDamping: 0.32,
  swingDrive: 1.1,
  swingCap: 1.2,
  /** 拖动惯性衰减 exp(-dt x (1.5 + 9 x friction)). */
  frictionBase: 1.5,
  frictionScale: 9,
  /** 拖动速度折成摆动力矩的比例 (每 px/s), 托起时的放大与投影加深 (本库定). */
  torquePerPx: 0.002,
  liftScale: 0.06,
  /** 超过这个位移 (px) 才算拖动 (本库定). */
  dragThresholdPx: 4,
  /** props 默认值. */
  width: 200,
  peelBackHoverPct: 25,
  peelBackActivePct: 40,
  curlRadius: 12,
  lightingIntensity: 0.5,
  shadowIntensity: 0.6,
  swing: 1,
  friction: 0.5,
} as const;
