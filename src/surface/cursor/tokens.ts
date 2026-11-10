// 行为规格参照 docs/research/catalog/animations.md 的 BlobCursor, GlowCursor, GhostCursor, SwarmCursor, Ribbons, CursorGrid 条目, 实现为 HX 自有.
/**
 * cursor 族 (跟手画布) 的手感合同. 数值是规格条目里的常数与 props 默认值, 注释写原规格名.
 * 规格是着色器场的, 这里全部用 Canvas2D 近似; 规格没给, 由本库定的值单独标注.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */

/** 积分子步长 1/240 秒 (BlobCursor, GhostCursor 共用). */
export const SUBSTEP_S = 1 / 240;

/* ── MeldCursor (规格 BlobCursor) ── */
export const MELD = {
  /** MAX_TRAIL, MAX_DROPS. */
  maxTrail: 16,
  maxDrops: 96,
  /** 质量: 溅出后下限 0.2, 一次损失 clamp(lost x 2.4, 0.25, 0.7), 等 0.28s 再回长, 回长速率 mix(0.9, 6, regrow), 上限 1.35. */
  massFloor: 0.2,
  massLossScale: 2.4,
  massLossMin: 0.25,
  massLossMax: 0.7,
  massWaitS: 0.28,
  regrowSlow: 0.9,
  regrowFast: 6,
  massCap: 1.35,
  /** 形变时钟 dt x 4 x morphSpeed^1.5. */
  morphRate: 4,
  morphPower: 1.5,
  /** props 默认值. */
  size: 140,
  morphSpeed: 0.4,
  trail: 16,
  lag: 0.55,
  stretch: 0.6,
  wobble: 1,
  splashCount: 6,
  splashSpeed: 0.5,
  splashSize: 0.5,
  splashGravity: 0,
  regrow: 0.5,
  shine: 1,
  /** 本库定: 头部弹簧刚度 mix(600, 60, lag), 阻尼比 0.8; 尾链时间常数 0.02 + lag x 0.06; 拉伸满格速度 1500px/s,
   * 拉伸上限 0.6; 晃动幅度 0.06; 溅滴初速 900px/s x splashSpeed, 寿命 1s, 重力 1800px/s^2 x splashGravity. */
  headStiffFast: 600,
  headStiffSlow: 60,
  headDamping: 0.8,
  tailTauBase: 0.02,
  tailTauLag: 0.06,
  stretchSpeed: 1500,
  stretchCap: 0.6,
  wobbleAmp: 0.06,
  dropSpeed: 900,
  dropLifeS: 1,
  dropGravity: 1800,
} as const;

/* ── HaloCursor (规格 GlowCursor) ── */
export const HALO = {
  /** 平静衰减 exp(-dt x 1.2); 三层余辉 exp(-dt x 4.6 / (linger x 0.8 / 0.2 / 1.2)). */
  calmRate: 1.2,
  lingerRate: 4.6,
  lingerCore: 0.8,
  lingerHot: 0.2,
  lingerWide: 1.2,
  /** props 默认值. */
  intensity: 1.3,
  trailWidth: 3,
  linger: 1.4,
  glow: 1.2,
  hotspot: 0.8,
  followSpeed: 0.6,
  /** 本库定: 轨迹点上限 160, 线宽单位 6px, 跟手时间常数 0.12 x (1 - followSpeed) + 0.01, 热点半径 26px,
   * 点击光环 0.7s 扩到 120px, 采样间距 3px. */
  maxPoints: 160,
  widthUnit: 6,
  followTauSpan: 0.12,
  followTauMin: 0.01,
  hotRadius: 26,
  burstS: 0.7,
  burstReach: 120,
  sampleGap: 3,
  /** 流体 (2026-11-10 补做): PRESSURE_STEPS 20, FLOW 0.75 (溅点速度并入比例), 边缘淡出 smoothstep(0, 0.02, 边距), 颗粒默认 0;
   * 密度 1 - exp(-((energy x 1.1 + gas x 0.8) x intensity + halo x 0.25)), 墨色 tint x min(1, 0.5 / tone) x mix(0.95, 0.72, smoothstep(0.5, 3, energy)).
   * BLOOM_LEVELS 5, 内核泛光金字塔上限 4 级. */
  pressureSteps: 20,
  flow: 0.75,
  edgeFade: 0.02,
  grain: 0,
  bloomLevels: 4,
  /** 本库定: 画质档 (模拟格比例, 染料比例, 压力迭代, 泛光级数), 泛光阈值与软膝, 每帧补色量, 速度上限 (格每秒), 点击光环的推力. */
  quality: {
    low: { sim: 0.2, dye: 0.35, steps: 6, bloom: 2 },
    medium: { sim: 0.3, dye: 0.5, steps: 12, bloom: 3 },
    high: { sim: 0.4, dye: 0.6, steps: 20, bloom: 4 },
  },
  bloomThreshold: 0.35,
  bloomKnee: 0.4,
  dye: 0.9,
  maxSpeed: 900,
  burstPush: 260,
} as const;

export type HaloQuality = keyof typeof HALO.quality;

/* ── HazeCursor (规格 GhostCursor) ── */
export const HAZE = {
  /** INTRO_MS 1900; 在场 0.12 进 / 0.08 出; 衰减 exp(-dt / (0.12 + trailLength x 0.022)). */
  introS: 1.9,
  presenceIn: 0.12,
  presenceOut: 0.08,
  decayBase: 0.12,
  decayPerTrail: 0.022,
  /** 弹簧 520 x (1 - inertia)^2 + 26, 阻尼 2 sqrt(k) x 0.92, 拖拽 exp(-dt x 2.4), 漂移 drift x 110 px/s. */
  stiffScale: 520,
  stiffBase: 26,
  dampingRatio: 0.92,
  dragRate: 2.4,
  driftPx: 110,
  /** props 默认值. */
  size: 80,
  trailLength: 50,
  inertia: 0.5,
  turbulence: 0.5,
  drift: 0.3,
  brightness: 1,
  /** 本库定: 烟团上限 140, 每 6px 放一团, 烟团长大到 2.2 倍, 湍流位移 40px, 点击喷 14 团. */
  maxPuffs: 140,
  puffGap: 6,
  puffGrow: 2.2,
  turbulencePx: 40,
  clickPuffs: 14,
  /** 烟雾场 (2026-11-10 补做): wisp = pow(smoothstep(0.18, 0.82, smoke), 2) x 2.8; cloud = body x smoothstep(0, 0.32, body) x 1.15;
   * 打光 0.7 + 0.5 x max(dot(n, normalize(-0.35, 0.55, 0.75)), 0); 芯 smoothstep(0.7, 2.2, cloud);
   * 覆盖 1 - exp(-(a + bloom x bloomStrength x 0.6) x 0.95). props 默认 detail 1, grainIntensity 0.05, bloomStrength 0.6, bloomRadius 1, bloomThreshold 0.025, edgeIntensity 0. */
  wispLo: 0.18,
  wispHi: 0.82,
  wispGain: 2.8,
  cloudKnee: 0.32,
  cloudGain: 1.15,
  coverGain: 0.95,
  detail: 1,
  grainIntensity: 0.05,
  bloomStrength: 0.6,
  bloomRadius: 1,
  bloomThreshold: 0.025,
  edgeIntensity: 0,
  /** 本库定: 模拟格比例与染料比例, 烟团并入的浓度, 拖尾速度换算, 湍流 (格每秒), 渐隐默认 (不给 fadeDelayMs 时不隐). */
  sim: 0.3,
  dyeScale: 0.5,
  puffBody: 0.55,
  puffSmoke: 0.8,
  velocityShare: 0.6,
  turbulenceCells: 22,
} as const;

/* ── 光标流体共用 (HaloCursor / HazeCursor 的速度, 散度, 压力, 染料通道) ── */
export const CURSOR_FLUID = {
  /** 本库定: 每帧溅点上限, 速度与压力编码范围 (RGBA8 回退用), 帧长上限. */
  maxSplats: 12,
  velocityRange: 1200,
  pressureRange: 600,
  maxDt: 1 / 30,
} as const;

/* ── FlockCursor (规格 SwarmCursor) ── */
export const FLOCK = {
  /** MAX_PARTICLES 2000, INTRO_SECONDS 1.4. */
  maxParticles: 2000,
  introS: 1.4,
  /** 抓取 (1 - exp(-dt x 20)) x clamp(moving / 240, 0, 1); 旋涡衰减 exp(-dt / (0.35 + 1.5 x swirl));
   * 聚拢 12, 拉回 30 (x loose x (0.2 + 0.8 x ease)); 指针速度钳 4000, 平滑 exp(-dt x 30), 在场 0.25. */
  grabRate: 20,
  movingFull: 240,
  swirlFadeBase: 0.35,
  swirlFadeScale: 1.5,
  gather: 12,
  pull: 30,
  speedCap: 4000,
  speedBlend: 30,
  presenceTau: 0.25,
  /** props 默认值 (count 800 在 Canvas2D 上偏重, 本库默认 400; 上限仍按规格 2000). */
  count: 400,
  size: 2.6,
  spread: 90,
  speed: 1,
  swirl: 0.6,
  wander: 0.5,
  depth: 0.7,
  /** 本库定: 闲逛轨迹周期 9s / 7s, 爆散冲量 900px/s, 游走力 60. */
  roamPeriodX: 9,
  roamPeriodY: 7,
  burstImpulse: 900,
  wanderForce: 60,
} as const;

/* ── StreamerCursor (规格 Ribbons) ── */
export const STREAMER = {
  /** POINTS 50, DETAIL 4 (这里每段 1 个采样, 见 note), STEP 1/120. */
  points: 50,
  stepS: 1 / 120,
  /** 弹簧 0.03 x 4^(2 x stiffness - 1); 跟随 1 - 0.183^((1 / length) x dt x 60); omega 60 sqrt(spring x pull). */
  springBase: 0.03,
  springPow: 4,
  followBase: 0.183,
  rate: 60,
  /** props 默认值. */
  thickness: 30,
  length: 1.4,
  spread: 18,
  stiffness: 0.5,
  bounce: 0.5,
  wave: 0,
  opacity: 1,
  /** 本库定: 阻尼比 1 - 0.8 x bounce, 每条的拉力与拖拽在 0.85..1.15 之间错开, 波浪频率 3 周 / 条, 波浪速度 4 rad/s. */
  bounceDamp: 0.8,
  spreadPull: 0.15,
  waveCycles: 3,
  waveSpeed: 4,
} as const;

/* ── NudgeGrid (规格 CursorGrid) ── */
export const NUDGE = {
  /** INTRO_SECONDS 1.4, 跟手 0.07, 在场 0.25, 起亮 0.045, 环境闪格概率 ambient x dt x 格数 x 0.04, 帧长上限 1/20. */
  introS: 1.4,
  followTau: 0.07,
  presenceTau: 0.25,
  attackTau: 0.045,
  ambientRate: 0.04,
  maxDtS: 1 / 20,
  /** props 默认值. */
  cellSize: 60,
  radius: 140,
  holdTime: 400,
  fadeDuration: 800,
  lineWidth: 1,
  maxOpacity: 1,
  fillOpacity: 0.06,
  gridOpacity: 0.08,
  cellRadius: 0,
  cellGap: 0,
  spotlight: 0.6,
  pulseSpeed: 600,
  ambient: 0,
  edgeFade: 0.2,
  /** 本库定: 点击波环宽 1 格, 最远 1200px; 虚线 6 / 6. */
  pulseWidthCells: 1,
  pulseReach: 1200,
  dash: 6,
} as const;
