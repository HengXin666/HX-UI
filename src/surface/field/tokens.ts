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
