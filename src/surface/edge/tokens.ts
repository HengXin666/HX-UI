// 行为规格参照 docs/research/catalog/animations.md 的 StarBorder, ElectricBorder 条目, 实现为 HX 自有.
/**
 * edge 族 (沿边框行进或放电的描边效果) 的手感合同. 数值是规格条目里的常数与 props 默认值, 注释写原规格名.
 * 规格没给, 由本库定的值单独标注.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-edge.md
 */

/* ── CometBorder (规格 StarBorder) ── */
export const COMET = {
  /** 画布向外多出的边距 px, 给光晕留地方 (BLEED). */
  bleedPx: 48,
  /** 悬停加跑一圈的时长 (LAP). */
  lapS: 0.9,
  /** 帧长上下限 (秒). */
  maxDtS: 0.05,
  minDtS: 0.001,
  /** 一圈秒数下限. */
  minDurationS: 0.3,
  /** 速度跟随 0.45s; 显现 0.16s 起 / 0.45s 落; 加亮 0.18s 起 / 0.5s 落; 点击闪光衰减 0.22s. */
  velocityTauS: 0.45,
  revealUpS: 0.16,
  revealDownS: 0.45,
  boostUpS: 0.18,
  boostDownS: 0.5,
  flashTauS: 0.22,
  /** 火星: 每颗每秒基础 2 个, 按速度再加 6 x min(2, pace); 速度衰减系数 2.2/s. */
  emitBase: 2,
  emitPace: 6,
  emitPaceCap: 2,
  moteDrag: 2.2,
  /** 火星寿命 (秒), 初速 px/s, 半径 px (本库定). */
  moteLifeS: 0.8,
  moteSpeed: 40,
  moteRadius: 1.2,
  /** 尾巴分段数, 光晕模糊 px / glow (本库定). */
  trailSegments: 28,
  glowBlurPx: 14,
  /** 同屏火星上限 (本库定). */
  maxMotes: 160,
  /** props 默认值. */
  duration: 4,
  thickness: 1,
  radius: 12,
  trailLength: 0.3,
  stars: 1,
  glow: 0.6,
} as const;

export type CometHover = "lap" | "boost" | "none";

/* ── SparkEdge (规格 ElectricBorder) ── */
export const SPARK_EDGE = {
  /** 支弧上限 (ARCS), 沿边行进的浪涌数 (PULSES). */
  maxArcs: 4,
  pulses: 3,
  /** 画布外扩 px (MARGIN). */
  marginPx: 64,
  /** 画布像素预算 (PIXEL_BUDGET): 像素比再按它压. */
  pixelBudget: 3e6,
  /** 浪涌速度 px/s (SURGE_SPEED). */
  surgeSpeed: 560,
  /** 显现前沿的软边 px, 内收淡出的距离 px (shader 里的 70 与 14). */
  revealSoftPx: 70,
  /** 通电 0.28s 起 / 0.4s 落, 显现扫一圈 0.9s. */
  powerUpS: 0.28,
  powerDownS: 0.4,
  revealS: 0.9,
  /** 指针跟随弹簧: 刚度 120, 阻尼 19. */
  hoverStiffness: 120,
  hoverDamping: 19,
  /** 帧长上限 (秒). */
  maxDtS: 0.05,
  /** 采样间距 px, 抖动的基础空间频率 (每 px) 与幅度 px (本库定). */
  stepPx: 6,
  jagFreq: 0.045,
  jagAmpPx: 10,
  /** 浪涌半宽 px, 支弧长度 px (本库定). */
  surgeHalfPx: 36,
  arcLengthPx: 22,
  /** 光晕模糊 px / glow (本库定). */
  glowBlurPx: 16,
  /** props 默认值. */
  speed: 1,
  chaos: 0.5,
  spread: 0.6,
  thickness: 1.5,
  strands: 3,
  glow: 0.6,
  intensity: 0.8,
  arcs: 1,
  flicker: 0.5,
  borderRadius: 24,
  cursorRadius: 90,
} as const;
