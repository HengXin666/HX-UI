// 行为规格参照 docs/research/catalog/animations.md 的 HalftoneReveal, DitherVeil, CrystalizedBall, Cubes, ElasticMesh, Strands 条目, 实现为 HX 自有.
/**
 * scene 族 (揭示与立体场) 的手感合同. 数值是规格条目里的常数与 props 默认值, 注释写原规格名.
 * 全部走 backdrop 内核的 WebGL2 通道 (useShaderBackdrop + 乒乓离屏通道); 规格没给, 由本库定的值单独标注.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */

/* ── DotReveal (规格 HalftoneReveal) ── */
export const DOT = {
  /** MODES, SHAPES 的取值顺序. */
  modes: { mono: 0, duotone: 1, color: 2 },
  shapes: { dot: 0, ellipse: 1, square: 2, diamond: 3, line: 4, cross: 5 },
  /** MAX_BURSTS, BURST_SECONDS, INTRO_SECONDS, MASK_SCALE. */
  maxBursts: 4,
  burstSeconds: 1.3,
  introSeconds: 1.4,
  maskScale: 0.5,
  /** 帧长上限 0.05 秒; 漫游渐入 1.2 秒; 在场 tau 0.16 秒; 跟手 tau 0.035 秒. */
  maxDt: 0.05,
  driftSeconds: 1.2,
  presenceTau: 0.16,
  followTau: 0.035,
  /** 入场: delay = |field| x 1.15 + hash x 0.06, grow = smoothstep(clamp((intro x 1.7 - delay) / 0.45)). */
  introDelay: 1.15,
  introJitter: 0.06,
  introRate: 1.7,
  introSpan: 0.45,
  /** props 默认值. */
  cellSize: 6,
  angle: 45,
  dotScale: 1,
  contrast: 1.1,
  brightness: 0,
  roughness: 0,
  misregistration: 0,
  revealRadius: 160,
  softness: 0.6,
  linger: 1.2,
  /** 本库定: 遮罩每帧至少减 1/255 (8 位缓冲下才褪得干净); 点击爆开最大半径为 revealRadius 的 2.5 倍; 漫游路径的李萨如频率. */
  minFade: 1 / 255,
  burstReach: 2.5,
  wander: { fx: 0.23, fy: 0.31, amp: 0.34 },
  /** 本库定: duotone 的强调色网相对主网转 30°, 吃 0.6 倍暗度. */
  accentTurn: 30,
  accentWeight: 0.6,
} as const;
