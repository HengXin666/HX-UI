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
  /** FITS 的取值顺序 (规格 fit 默认 cover). 抠像 keep *= mix(1, smoothstep(0.05, 0.2, |c - matte|), key) 的两个阈值. */
  fits: { cover: 0, contain: 1, fill: 2 },
  keyLo: 0.05,
  keyHi: 0.2,
  /** 本库定: 底色取自图片四角, 先缩到 16 x 16 再取四角像素的平均. */
  matteGrid: 16,
} as const;

/* ── BayerVeil (规格 DitherVeil) ── */
export const VEIL = {
  /** ORDERED: 片元里按格算阈值的三种; 其余是误差扩散, 在主线程按格算一次 (KERNELS). */
  ordered: { bayer: 0, noise: 1, lines: 2 },
  /** 误差扩散核: [dx, dy, 权重], 权重已除过分母. floyd / atkinson (只推 6/8, 故意丢掉 1/4 误差, 高光更干净) / jarvis / sierra (sierra lite). */
  kernels: {
    floyd: [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]],
    atkinson: [[1, 0, 1 / 8], [2, 0, 1 / 8], [-1, 1, 1 / 8], [0, 1, 1 / 8], [1, 1, 1 / 8], [0, 2, 1 / 8]],
    jarvis: [
      [1, 0, 7 / 48], [2, 0, 5 / 48], [-2, 1, 3 / 48], [-1, 1, 5 / 48], [0, 1, 7 / 48], [1, 1, 5 / 48], [2, 1, 3 / 48],
      [-2, 2, 1 / 48], [-1, 2, 3 / 48], [0, 2, 5 / 48], [1, 2, 3 / 48], [2, 2, 1 / 48],
    ],
    sierra: [[1, 0, 2 / 4], [-1, 1, 1 / 4], [0, 1, 1 / 4]],
  },
  /** MASK_SCALE, MAX_BURSTS, BURST_SECONDS, INTRO_MS. */
  maskScale: 0.5,
  maxBursts: 4,
  burstSeconds: 1.2,
  introSeconds: 1.1,
  /** lines 图样的周期 (格). */
  linePeriod: 6,
  /** props 默认值. */
  pixelSize: 2,
  levels: 2,
  contrast: 1.15,
  brightness: 0,
  revealRadius: 200,
  softness: 0.6,
  linger: 1,
  rim: 0,
  /** 本库定: 主线程误差扩散的格数上限 (超了就按比例放大格子), 揭开边缘描边的带宽. */
  maxCells: 480_000,
  rimBand: 0.18,
} as const;

/* ── PrismOrb (规格 CrystalizedBall) ── */
export const PRISM = {
  /** MOTIONS, SHAPES 的取值顺序. */
  motions: { rise: 0, fall: 1, drift: 2, orbit: 3 },
  shapes: { square: 0, round: 1 },
  /** MAX_STRANDS, MAX_ARCS, MAX_PARTICLES, INTRO_SECONDS, SETTLE_SECONDS. */
  maxStrands: 8,
  maxArcs: 4,
  maxParticles: 40000,
  introSeconds: 2.2,
  settleSeconds: 7,
  /** PIXEL_BUDGET (CrystalizedBall.jsx:153): 画布设备像素上限, dpr 取 min(上限, sqrt(预算 / CSS 面积)). */
  pixelBudget: 4.5e6,
  /** 片元里的规格公式: 玻璃内沿 smoothstep(0.955, 0.985, r), 边光 smoothstep(0.8, 0.97, r), 外晕 R x 0.05..0.105 偏 0.0213 R, 闪烁 smoothstep(-0.9, -0.6, blink). */
  innerEdge: [0.955, 0.985],
  rimLit: [0.8, 0.97],
  halo: [0.05, 0.105, 0.0213],
  twinkleEdge: [-0.9, -0.6],
  /** props 默认值. */
  size: 0.7,
  hoverStrength: 0.7,
  /** 本库定: 悬停在场 tau, 刚挂载时的额外能量 (按 SETTLE_SECONDS 回落), 尘埃分三层. */
  hoverTau: 0.12,
  settleBoost: 1.5,
  dustLayers: 3,
} as const;

/** 本库定: BALL_PRESETS 的取值 (规格条目只给了名字 plasma). */
export const PRISM_PRESETS = {
  plasma: { strands: 6, crackle: 0.6, flares: 0.8, glow: 0.8, sparks: 0.5, particleCount: 12000, fill: 0.3, motion: "rise", particleShape: "round", depth: 0.6, sway: 0.3, twinkle: 0.5, haze: 0.4, dustSpeed: 1 },
  storm: { strands: 8, crackle: 1, flares: 1, glow: 1, sparks: 0.9, particleCount: 8000, fill: 0.2, motion: "drift", particleShape: "round", depth: 0.4, sway: 0.6, twinkle: 0.8, haze: 0.3, dustSpeed: 1.6 },
  calm: { strands: 3, crackle: 0.25, flares: 0.4, glow: 0.6, sparks: 0.15, particleCount: 20000, fill: 0.45, motion: "orbit", particleShape: "round", depth: 0.8, sway: 0.15, twinkle: 0.3, haze: 0.6, dustSpeed: 0.5 },
  frost: { strands: 4, crackle: 0.45, flares: 0.5, glow: 0.5, sparks: 0.3, particleCount: 30000, fill: 0.25, motion: "fall", particleShape: "square", depth: 0.7, sway: 0.4, twinkle: 0.9, haze: 0.5, dustSpeed: 0.7 },
} as const;

/* ── CubeField (规格 Cubes) ── */
export const CUBE = {
  /** STYLES, INTRO_SECONDS. */
  styles: { solid: 0, dashed: 1, dotted: 2, none: 3 },
  introSeconds: 1.1,
  /** 跟手 1 - exp(-18 dt), 速度混合 1 - exp(-10 dt), 在场 attack 6 / release 2.5, 弹簧 k = 160 speed^2, c = 2 (1 - 0.82 bounce) sqrt(k), 涟漪亮度 exp(-3.2 dt), 扫动 x 4. */
  follow: 18,
  velocityBlend: 10,
  attack: 6,
  release: 2.5,
  stiffness: 160,
  bounceDamp: 0.82,
  glowFade: 3.2,
  sweepGain: 4,
  maxDt: 0.05,
  /** props 默认值. */
  gridSize: 10,
  gap: 0.18,
  edgeWidth: 1,
  faceOpacity: 1,
  shading: 0.6,
  maxAngle: 45,
  radius: 3,
  bounce: 0.4,
  brush: 1,
  perspective: 0,
  rippleSpeed: 1,
  /** 本库定: 格数上限 (每块一个 vec4 uniform, 片元 uniform 向量的保底只有 224), 涟漪每秒走的格数, 涟漪踢一下的角速度 (度每秒), 扫动的速度归一. */
  maxGrid: 13,
  rippleCells: 8,
  rippleKick: 420,
  sweepNorm: 0.002,
  /** 本库定: 自动漫游的李萨如频率, 漫游时的在场权重. */
  wander: { fx: 0.13, fy: 0.19, weight: 0.6 },
} as const;

/* ── SpringMesh (规格 ElasticMesh) ── */
export const MESH = {
  /** MATERIALS. */
  materials: { balloon: 0, chrome: 1, jelly: 2, clay: 3 },
  /** 入场弹簧 omega 15, zeta 0.38; 硬度 firm = 0.4 + stiffness x 1.2; 凹陷钳 [-0.6, 0.85]; 不透明 smoothstep(0, 0.18, presence). */
  omega: 15,
  zeta: 0.38,
  firmBase: 0.4,
  firmGain: 1.2,
  dentMin: -0.6,
  dentMax: 0.85,
  /** props 默认值. */
  fontWeight: 900,
  inflate: 1,
  stiffness: 0.5,
  wobble: 0.6,
  grabRadius: 70,
  stretch: 0.5,
  press: 0.5,
  shadow: 0.5,
  /** 本库定: 距离场分辨率与留白, 形状占短边比例, 拉伸上限 (短边单位), 回弹阻尼随 wobble (0.7 - 0.55 wobble, wobble 0.6 时约 0.38), 入场按 x 的逐字延迟, 各材质的环境模糊. */
  field: 256,
  pad: 0.2,
  fill: 0.82,
  maxStretch: 0.35,
  /** 本库定: 同时抓取的指针上限 (每个一份拉伸 / 凹陷弹簧). */
  maxGrabs: 4,
  dampHi: 0.7,
  dampSpan: 0.55,
  introStagger: 0.35,
  blur: [0.06, 0, 0.1, 0.3],
} as const;

/* ── FiberStrands (规格 Strands) ── */
export const STRAND = {
  /** MAX_COLORS; erf 近似 (Abramowitz-Stegun 7.1.26) 的系数; 覆盖 1 - exp(-2.6 lum); 白芯 smoothstep(0.05, 2.2, lum) x 0.92; 边光 0.04 x thickness; 线厚 0.051 x thickness. */
  maxColors: 8,
  erf: [0.3275911, 1.061405429, -1.453152027, 1.421413741, -0.284496736, 0.254829592],
  cover: 2.6,
  coreGain: 0.92,
  edge: 0.04,
  body: 0.051,
  /** 色差 0.02 x dispersion, 边缘菲涅尔 smoothstep(0.8, 1.0, r), 整体增益 2.4. */
  chroma: 0.02,
  gain: 2.4,
  /** props 默认值. */
  count: 3,
  energy: 0.65,
  /** 本库定: 入场时长, 玻璃球半径 (短边单位), 点击脉冲衰减与幅度, 指针偏弯幅度, 每根的竖向间距. */
  introSeconds: 1.6,
  glassRadius: 0.26,
  pulseDecay: 3,
  pulseGain: 0.8,
  lean: 0.15,
  lane: 0.07,
  /** ROLES: 规格把 colors 分到 7 个角色. 本库的角色: 0 填充, 1 边光, 2 外晕 (这三项按根错位取色), 3 白芯 (规格 uColors[3]), 4 玻璃边, 5 玻璃高光, 6 浅色底的投影. */
  roles: 7,
  /** 本库定: 麦克风电平 = 均方根 x 4 钳 0..1, 起 0.06 秒落 0.3 秒平滑; AnalyserNode 的 fftSize. */
  mic: { gain: 4, attack: 0.06, release: 0.3, fftSize: 1024 },
} as const;
