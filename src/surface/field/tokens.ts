// 行为规格参照 docs/research/catalog/animations.md 的 SplashCursor, MetaBalls, MetallicPaint, LaserFlow, RippleDistortion, ShapeBlur, ElectricLogo 条目, 实现为 HX 自有.
/**
 * field 族 (着色器场) 的手感合同. 数值是规格条目里的常数与 props 默认值, 注释写原规格名.
 * 全部走 backdrop 内核的 WebGL2 通道 (useShaderBackdrop + 乒乓离屏通道); 规格没给, 由本库定的值单独标注.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */

/* ── InkSplash (规格 SplashCursor) ── */
export const INK = {
  /** BLOOM_THRESHOLD, BLOOM_KNEE; BLOOM_ITERATIONS 4 对应泛光金字塔 4 级. */
  bloomThreshold: 0.3,
  bloomKnee: 0.7,
  bloomLevels: 4,
  /** 指针推力 6000 x force / sqrt(spread), 补色 0.15 x intensity x min(dt x 60, 1) / sqrt(spread), 点击 1100 x force. */
  push: 6000,
  dye: 0.15,
  click: 1100,
  /** 帧长上限 1/60 秒. */
  maxDt: 1 / 60,
  /** 花瓣形溅点: 0.78 + 0.22 sin(5a + seed) sin(3a - 1.7 seed). */
  petalBase: 0.78,
  petalAmp: 0.22,
  /** 本库定: 溅点半径 (以画面高为 1 的平方) 0.0025 x size, 涡度 swirl x 10, 染料耗散 1 / trail, 速度耗散 0.2 / momentum, 压力热启动保留 0.8. */
  radius: 0.0025,
  curlScale: 10,
  velocityDissipation: 0.2,
  pressureKeep: 0.8,
  /** 本库定: 画质档的模拟网格 / 染料缓冲比例与压力迭代次数. */
  quality: {
    low: { sim: 0.12, dye: 0.3, steps: 8 },
    medium: { sim: 0.18, dye: 0.45, steps: 14 },
    high: { sim: 0.25, dye: 0.6, steps: 20 },
  },
  /** 本库定: 入场 1.2 秒画一道 S 形. 彩虹模式色相每秒走 0.25 x colorSpeed 圈. */
  introS: 1.2,
  hueRate: 0.25,
  /** 一帧最多几个溅点. */
  maxSplats: 4,
  /** 速度编码范围 (格每秒), 8 位缓冲也能存负值. */
  velocityRange: 1024,
  pressureRange: 512,
} as const;

export type InkQuality = keyof typeof INK.quality;

/* ── MergeBlobs (规格 MetaBalls) ── */
export const MERGE = {
  /** MAX_BALLS. */
  maxBalls: 50,
  /** VISIBLE = 1 / sqrt(1.3): 单球等值面半径占 r 的比例. 阈值 1.3^gamma, 影响范围 2^(0.5 / gamma). */
  visible: 0.877,
  thresholdBase: 1.3,
  /** 球间: 贴太近时 -60 x (core - d) 推开, 之外 pull x min(rp, rq) x smoothstep(0, 0.6, t) x (1 - smoothstep(0.82, 1, t)), 按质量分摊. */
  repel: 60,
  /** 光标球: 太近 -140 x (core - d), 之外 pull x 0.6 x rp x 同一窗, 除以 rp^2 + 0.05. */
  cursorRepel: 140,
  cursorPull: 0.6,
  /** 入场: 每球延迟 0.1 + 0..0.55, 1.15 秒缓入缓出放开. */
  introDelay: 0.1,
  introSpread: 0.55,
  introS: 1.15,
  /** 光标速度平滑 1 - exp(-dt / 0.05); 跟手 1 - (1 - hoverSmoothness)^(dt x 60). */
  cursorVelocityTau: 0.05,
  /** props 默认值. */
  speed: 0.3,
  hoverSmoothness: 0.1,
  animationSize: 30,
  ballCount: 15,
  clumpFactor: 1,
  cursorBallSize: 3,
  gooeyness: 0.5,
  stickiness: 0.5,
  stretch: 0.5,
  wobble: 0.5,
  lineWidth: 1.5,
  rings: 4,
  /** 本库定: 球半径 1..2.2 单位 (短边 = animationSize 单位), gamma = mix(3, 0.6, gooeyness), pull = 30 x stickiness,
   * 贴近距离 core = 0.6 (rp + rq), 作用范围 2.2 (rp + rq), 回轨弹簧 6 阻尼 3, 轨道幅度 0.3 x animationSize x clumpFactor,
   * 点击冲量 40 单位每秒 (8 单位外衰减到 0), 等值环间距 = 阈值的 0.7 倍逐级. */
  radiusMin: 1,
  radiusMax: 2.2,
  gammaHard: 3,
  gammaSoft: 0.6,
  pullScale: 30,
  coreRatio: 0.6,
  rangeRatio: 2.2,
  homeSpring: 6,
  homeDamping: 3,
  orbitRatio: 0.3,
  burst: 40,
  burstReach: 8,
  ringStep: 0.7,
} as const;

/* ── ChromeMark (规格 MetallicPaint) ── */
export const CHROME = {
  /** WORKING_SIZE: 形状遮罩栅格化的长边像素. */
  workingSize: 512,
  /** 时钟 0.3 x (time + 2.8). */
  timeRate: 0.3,
  timeOffset: 2.8,
  /** 条纹: 细条 0.12 / cycleWidth x (1 - 0.4 bump), 0.07 / cycleWidth x (1 + 0.4 bump); 边缘弯折 2 x noise x diag x s(1 - s), 1.7 x edge x smoothstep(0.5, 1, edgeBend). */
  thin1: 0.12,
  thin2: 0.07,
  bumpSkew: 0.4,
  bendNoise: 2,
  bendEdge: 1.7,
  /** props 默认值. */
  fontWeight: 800,
  density: 2,
  softness: 0.1,
  dispersion: 0.3,
  distortion: 0.07,
  edgeBend: 0.6,
  angle: 70,
  scale: 0.6,
  mouseTilt: 0.5,
  /** 本库定: 隆起场是在形状内解泊松方程 (Jacobi), 通道比例 0.15, 每帧 24 次, 静态帧一次 240 次;
   * 倾斜弹簧 tau 0.25 秒, 最大 0.6 弧度; 入场 1.2 秒由下往上扫亮. */
  bumpScale: 0.15,
  bumpSteps: 24,
  bumpStillSteps: 240,
  tiltTau: 0.25,
  tiltMax: 0.6,
  introS: 1.2,
} as const;

/* ── BeamFlow (规格 LaserFlow) ── */
export const BEAM = {
  /** 光柱: 起亮 smoothstep(-6, 12, f), 纹 0.88 + 0.24 noise(u x 6, f / 22 - 1.7t), 色带 smoothstep(50, 75, f) 与 smoothstep(100, 125, f) (f 按落点 130 归一), 侧光 smoothstep(-24, 24, dx), 铺展 250 x spread. */
  streakBase: 0.88,
  streakAmp: 0.24,
  spreadPx: 250,
  /** 落点贴地光 exp(-(below / 14)^2) 与 exp(-(below / 40)^2); 呼吸 1 + pulse x (0.12 sin(1.5708 t) + 0.08 (noise - 0.5)); 揭幕前沿 1 - smoothstep(front - 70, front + 8, f). */
  hug: 14,
  hugWide: 40,
  frontLead: 70,
  frontTail: 8,
  /** props 默认值. */
  beamPosition: 0.6,
  intensity: 1.8,
  beamWidth: 1.5,
  flare: 1.5,
  spread: 1.5,
  spill: 1,
  fog: 0.2,
  dust: 1.6,
  streaks: 1.5,
  dots: 1,
  pulse: 1.5,
  speed: 1.5,
  seed: 3,
  revealRadius: 220,
  revealOpacity: 0.6,
  /** 本库定: 落点在宿主高度的 0.78 (规格 surfaceLevel 1 对应 surfaceRef 元素的顶边), 光柱落下 0.9s 后铺展 1.2s,
   * 光柱随指针横移 12% 宿主宽 (tau 0.3s), 揭图圈的在场 tau 0.2s. */
  surfaceLevel: 0.78,
  dropS: 0.9,
  flowS: 1.2,
  sway: 0.12,
  swayTau: 0.3,
} as const;

/* ── RippleLens (规格 RippleDistortion) ── */
export const LENS = {
  /** MAX_WAVES. */
  maxWaves: 100,
  /** QUALITY_SCALE: 像素比上限乘的比例. */
  quality: { low: 0.4, medium: 0.7, high: 1 },
  /** START_SCALE: 波一出生的半径是 brushSize / 2 / 1.5. */
  startScale: 1.5,
  /** EDGE = exp(-5): 振幅 exp(-age x fade) 低于它就出队, 寿命 5 / fade 秒. */
  edge: 0.006737947,
  /** props 默认值. */
  brushSize: 150,
  strength: 0.2,
  swirl: 1,
  rings: 4,
  spread: 5,
  fade: 3,
  spacing: 15,
  dispersion: 0,
  glint: 0,
  tintAmount: 0.1,
  clickStrength: 2,
  /** 本库定: 波半径每秒长 spread x brushSize x 0.1, 波带宽 brushSize x 0.25, 位移满格 brushSize x 0.25 x strength. */
  growth: 0.1,
  bandRatio: 0.25,
  pushRatio: 0.25,
} as const;

export type LensQuality = keyof typeof LENS.quality;

/* ── SoftShape (规格 ShapeBlur) ── */
export const SOFT = {
  /** FIELD, PAD, FAR: 图片形状的距离场边长, 四周留白比例, 距离变换的无穷大. */
  field: 512,
  pad: 0.35,
  far: 1e20,
  /** 透镜跟手 1 - exp(-dt x (在场 10 / 闲置 3)), 力度 1 - exp(-dt x 4). */
  followActive: 10,
  followIdle: 3,
  powerRate: 4,
  /** props 默认值. */
  sides: 6,
  size: 0.8,
  roundness: 0.2,
  thickness: 2,
  echoes: 1,
  spacing: 12,
  blur: 16,
  lensSize: 0.3,
  lensSoftness: 0.7,
  chroma: 0.3,
  /** 本库定: 闲置时透镜沿 9s / 7s 的利萨如漂 (幅度 0.3 短边), 回声上限 8, 色散错开 chroma x 0.35 x 当前模糊. */
  idleAmp: 0.3,
  maxEchoes: 8,
  chromaRatio: 0.35,
  /** 本库定: 真高斯失焦. 西格玛 = blur x 0.5 (blur 约为 2 西格玛的模糊半径), 每遍 15 个采样点, 形状遍满分辨率, 两遍模糊各 0.5 倍. */
  sigmaRatio: 0.5,
  taps: 15,
  blurScale: 0.5,
} as const;

/* ── SparkMark (规格 ElectricLogo) ── */
export const SPARK_MARK = {
  /** RASTER, CELL, FAR, ARCS, PULSES, PIXEL_BUDGET. */
  raster: 560,
  cell: 4,
  far: 1e20,
  arcs: 5,
  pulses: 3,
  pixelBudget: 4e6,
  /** 形变: morph += dt / (排队中 0.3 : 1.6); 逐像素 k = smoothstep(0, 1, morph x 1.7 - 0.35 + 0.35 wobble). 脉冲进度 dt / 1.4, 包络 exp(-front^2) x w x exp(-age x 1.7). */
  morphS: 1.6,
  morphPendingS: 0.3,
  pulseS: 1.4,
  pulseDecay: 1.7,
  /** 光标弹簧: v += ((p - x) x 120 - v x 19) dt; 力度 tau 在场 0.3 离开 0.55. 帧长上限 0.05. */
  hoverK: 120,
  hoverC: 19,
  powerIn: 0.3,
  powerOut: 0.55,
  maxDt: 0.05,
  /** 呼吸 1 + flicker x 0.6 wobble(2.1t), 火花 1 - flicker x 0.3 (0.5 + 0.5 wobble(6t)), 本体 smoothstep(0.75, -0.75, base) x fill x (0.06 + 1.2 min(halo, 1)) x (1 + heat x 0.5), alpha 1 - exp(-energy x gain). */
  breath: 0.6,
  sparkDip: 0.3,
  /** props 默认值 (本库定; 规格只给了两个色值, 换成 token). */
  scale: 0.7,
  intensity: 1,
  glow: 1,
  thickness: 1,
  strands: 3,
  bend: 1,
  crackle: 1,
  flicker: 1,
  fill: 0.35,
  cursorIntensity: 1,
  cursorRadius: 140,
  /** 本库定: 脉冲每 1.1s 发一个 (轮流占 3 个槽), 支弧伸出 reach = 14 x glow 个格. */
  pulseEvery: 1.1,
  reach: 14,
} as const;

/** 本库自画的闪电图形 (24 x 24 视框), 没给 src 时用它. */
export const SPARK_BOLT = { d: "M13 1.5 L3.5 13.5 H10.5 L9.5 22.5 L20.5 9.5 H13.5 Z", viewBox: [24, 24] as const };
