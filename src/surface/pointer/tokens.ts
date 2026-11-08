// 行为规格参照 docs/research/catalog/animations.md 的 ClickSpark, Crosshair, GlareHover, ImageTrail, Magnet, TargetCursor 条目, 实现为 HX 自有.
/**
 * pointer 族 (指针驱动的表层效果) 的手感合同. 数值是规格条目里的常数与 props 默认值, 注释写原规格名.
 * 规格没给, 由本库定的值单独标注.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-pointer.md
 */
export const DOUBLE = 2;

/* ── TapSparks (规格 ClickSpark) ── */
export const SPARK = {
  /** 同屏最多同时存在的爆点 (MAX_BURSTS). */
  maxBursts: 32,
  /** 重力 px/s^2 (GRAVITY). */
  gravity: 500,
  /** 减弱动效时只留一圈淡出的环, 时长 (REDUCED_MS). */
  reducedMs: 320,
  /** 时长下限. */
  minDurationMs: 60,
  /** 每根火花的时长错峰上限: duration * (1 + 0.25 * randomness). */
  staggerSpan: 0.25,
  /** 距离错峰上限: radius * (1 + 0.35 * randomness). */
  reachSpan: 0.35,
  /** spring 曲线额外多走 15%. */
  springReach: 1.15,
  /** 线形火花从 0.55 开始淡, 点形从 0.7. */
  lineFadeFrom: 0.55,
  dotFadeFrom: 0.7,
  /** 中心环: 半径 2 + radius * 0.6 * 进度, 寿命为 duration 的 0.8; 减弱动效时进度固定 0.6. */
  ringBase: 2,
  ringReach: 0.6,
  ringLife: 0.8,
  reducedRing: 0.6,
  /** 线尾追赶头部的滞后占寿命的比例 (本库定). */
  tailLag: 0.25,
  sparkCount: 8,
  sparkRadius: 30,
  sparkSize: 10,
  duration: 500,
  randomness: 0.3,
} as const;

/** 火花的三条曲线 (EASINGS). */
export const SPARK_EASINGS = {
  "ease-out": (t: number): number => 1 - (1 - t) ** 3,
  "ease-in-out": (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-DOUBLE * t + DOUBLE) ** 3 / DOUBLE),
  spring: (t: number): number => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2,
} as const;

export type SparkEasing = keyof typeof SPARK_EASINGS;

/* ── ReticleLines (规格 Crosshair) ── */
export const RETICLE = {
  /** 跟手时间常数 0.008 + smoothing * 0.16 秒. */
  followBase: 0.008,
  followGain: 0.16,
  /** 出现 / 消失时间常数. */
  presenceIn: 0.12,
  presenceOut: 0.25,
  /** 锁定吸附时间常数, 锁框透明度进 / 出. */
  snap: 0.085,
  lockIn: 0.08,
  lockOut: 0.14,
  /** 点击脉冲寿命 (s). */
  pulseLife: 0.55,
  /** 脉冲最大半径 (本库定). */
  pulseReach: 28,
  font: "500 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  /** 坐标标签相对交点的偏移 (本库定). */
  labelOffset: 8,
  /** 虚线与点线的段长 (本库定). */
  dash: [6, 4],
  dot: [1, 3],
  opacity: 0.85,
  smoothing: 0.35,
} as const;

/* ── Attract (规格 Magnet) ── */
export const ATTRACT = {
  /** 默认弹簧 (DEFAULT_SPRING), 与 craft 的 SPRING_FOLLOW 同值. */
  spring: { stiffness: 170, damping: 16, mass: 1 },
  /** 弹簧参数下限: 刚度 1, 阻尼 0, 质量 0.01. */
  minStiffness: 1,
  minMass: 0.01,
  padding: 100,
  strength: 2,
} as const;

/* ── LockOnCursor (规格 TargetCursor) ── */
export const LOCK = {
  /** 出现弹簧 (260, 32) 与按下弹簧 (900, 40), 质量 1. */
  presence: { stiffness: 260, damping: 32, mass: 1 },
  press: { stiffness: 900, damping: 40, mass: 1 },
  /** 自转速度的跟随速率 (1/s). */
  spinRate: 3,
  /** 按下时整体缩到的比例 (本库定). */
  pressScale: 0.85,
  /** 锁定时随指针偏移的视差比例 (本库定). */
  parallax: 0.08,
  spinDuration: 2,
  hoverDuration: 0.2,
  size: 36,
  cornerSize: 12,
  padding: 6,
  dotSize: 4,
  selector: "[data-cursor-target]",
} as const;

/* ── PhotoWake (规格 ImageTrail) ── */
export const WAKE = {
  /** 入场 0.4s (power4), 出场 0.4s / 漂移时 0.9s. */
  inS: 0.4,
  outS: 0.4,
  driftOutS: 0.9,
  /** 闪白回落 0.5s. */
  flashS: 0.5,
  /** 漂移距离为速度的这个比例 (本库定). */
  driftGain: 0.12,
  /** 槽位数: 至少这么多, 图片多时取图片数的两倍. */
  minSlots: 8,
  size: 190,
  aspectRatio: 1.1,
  radius: 15,
  threshold: 80,
  lifetime: 0.4,
  appearScale: 1,
  exitScale: 0.2,
} as const;

/* ── SheenCard (规格 GlareHover) ── */
export const SHEEN = {
  /** 扫光时长下限 ms. */
  minSweepMs: 120,
  /** intro 在露出 40% 时触发 (IntersectionObserver threshold). */
  introThreshold: 0.4,
  /** 光斑出现 / 消失时间常数 (本库定). */
  presenceIn: 0.12,
  presenceOut: 0.3,
  /** 边缘闪光的透明度系数 (本库定). */
  rimGain: 0.6,
  glareOpacity: 0.5,
  glareAngle: -45,
  glareSize: 30,
  softness: 0.6,
  transitionDuration: 650,
  interval: 3,
} as const;

/** 余弦缓入缓出 (GlareHover 的 ease). ENGINE-GAP: craft/ease 只收具名 cubic-bezier, 没有余弦与 power 系列, 先在本族局部给出. */
export function cosineEase(t: number): number {
  return (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, t)))) / DOUBLE;
}

/** power-N 的 out 曲线: 1 - (1 - t)^n. GSAP 的 power1..4 对应 n = 2..5. */
export function powerOut(t: number, n: number): number {
  return 1 - (1 - Math.min(1, Math.max(0, t))) ** n;
}

/* ── 族内共用的小数学, 帧长上限与单位 ── */
export const HALF = 0.5;
export const PERCENT = 100;
export const MS_PER_S = 1000;
export const DEG_PER_RAD = 180 / Math.PI;
/** 一帧最长 50ms, 与 backdrop 内核的 BACKDROP_DT_CAP 同值. */
export const MAX_DT_MS = 50;

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 与着色器同义的平滑阶跃. */
export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0 || Number.EPSILON), 0, 1);
  return t * t * (3 - DOUBLE * t);
}

/** 确定性伪随机 0..1 (xorshift). 同一种子同一序列. */
export function seeded(seed: number): () => number {
  let s = Math.floor(seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}
