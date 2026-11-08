// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Particles 条目, 实现为 HX 自有.
import { DEG, HALF, seeded, smooth, TURN } from "./tokens";

/** 规格 SHAPES: 点的形状. */
export const PARTICLE_SHAPES = { circle: 0, square: 1, ring: 2, sparkle: 3 } as const;
export type ParticleShape = keyof typeof PARTICLE_SHAPES;
/** 规格 EFFECTS: 悬停效果. */
export type ParticleHover = "parallax" | "repel" | "attract";
/** 规格 DRIFTS: 整体漂移方向. */
export type ParticleDrift = "none" | "up" | "down" | "forward";

export const PARTICLES = {
  /** 规格 MAX_COUNT 20000; Canvas2D 逐点画, 本库上限收到 4000. */
  maxCount: 4000,
  /** 规格 MAX_LINKED: 参与连线的点数上限. */
  maxLinked: 900,
  /** 规格 MAX_LINES: 每帧连线上限. */
  maxLines: 9000,
  /** 规格 MAX_BURSTS: 同时存在的点击冲击环. */
  maxBursts: 4,
  /** 规格 FOCAL = 1 / tan(7.5 度), 竖直半视场 7.5 度. */
  focal: 1 / Math.tan(7.5 * DEG),
  /** 规格 NEAR / FAR: 近远裁剪 (世界单位). */
  near: 0.1,
  far: 100,
  /** 规格 INTRO_SECONDS. */
  introSeconds: 1.8,
  /** 规格 BURST_SECONDS / BURST_SPEED (CSS px/s) / BURST_WIDTH (CSS px). */
  burstSeconds: 1.5,
  burstSpeed: 520,
  burstWidth: 46,
  /** 规格: 冲击波前沿把点推开的最大距离 (CSS px). */
  burstPush: 56,
  /** 冲击波推力随离中心距离淡入的跨度 (CSS px), 规格 smoothstep(0, 30, reach). */
  burstReachFade: 30,
  /** 规格: 闪烁幅度系数 0.6, 频率 6 + r * 14, 相位 r * 40. */
  twinkleDepth: 0.6,
  twinkleBase: 6,
  twinkleSpan: 14,
  twinklePhase: 40,
  /** 规格: 离相机 1..4 单位之间淡入, 防止贴脸大点. */
  nearFadeFrom: 1,
  nearFadeTo: 4,
  /** 本库定: 场时钟每秒的整体转速 (弧度), 对应规格 speed=0.1 时的观感. */
  spin: 0.1,
  /** 本库定: 每个点绕自身锚点的摆动幅度 (世界单位) 与频率. */
  wobble: 0.35,
  wobbleRate: 0.6,
  /** 本库定: 漂移每秒世界单位 (乘 driftSpeed). */
  driftRate: 0.8,
  /** 本库定: 视差平移世界单位 (乘 particleHoverFactor). */
  parallax: 1,
  /** 本库定: 推开 / 吸引最多走 hoverRadius 的这一比例. */
  hoverReach: 0.35,
  /** 本库定: 连线最高不透明度. */
  linkAlpha: 0.35,
} as const;

/** 一个点的出生参数: 锚点 (单位球内) 与四个 0..1 随机数. */
export interface ParticleSeed {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly r: readonly [number, number, number, number];
}

/** 由数量与种子生成单位球内均匀分布的点. 同一参数结果相同. */
export function makeParticles(count: number, seed: number): ParticleSeed[] {
  const rand = seeded(seed);
  const n = Math.max(0, Math.min(PARTICLES.maxCount, Math.round(count)));
  const out: ParticleSeed[] = [];
  for (let i = 0; i < n; i += 1) {
    const u = rand();
    const v = rand();
    const w = Math.cbrt(rand());
    const theta = u * TURN;
    const phi = Math.acos(2 * v - 1);
    out.push({
      x: w * Math.sin(phi) * Math.cos(theta),
      y: w * Math.sin(phi) * Math.sin(theta),
      z: w * Math.cos(phi),
      r: [rand(), rand(), rand(), rand()],
    });
  }
  return out;
}

/** 把坐标折回 [-span, span) 区间, 漂移出界的点从另一侧回来. */
export function wrapSpan(v: number, span: number): number {
  const full = span * 2;
  return ((((v + span) % full) + full) % full) - span;
}

/**
 * 透视投影. 相机在 +z 的 distance 处看向原点, 返回以短边一半为单位的屏幕坐标与离相机的深度.
 * 深度小于 near 或大于 far 时返回 null.
 */
export function project(x: number, y: number, z: number, distance: number): { sx: number; sy: number; ahead: number } | null {
  const ahead = distance - z;
  if (ahead < PARTICLES.near || ahead > PARTICLES.far) return null;
  return { sx: (x * PARTICLES.focal) / ahead, sy: (y * PARTICLES.focal) / ahead, ahead };
}

/** 闪烁系数: 1 - twinkle * 0.6 * (0.5 + 0.5 sin(t (6 + 14 r1) + 40 r3)). */
export function twinkleOf(twinkle: number, time: number, r1: number, r3: number): number {
  const wave = HALF + HALF * Math.sin(time * (PARTICLES.twinkleBase + r1 * PARTICLES.twinkleSpan) + r3 * PARTICLES.twinklePhase);
  return 1 - twinkle * PARTICLES.twinkleDepth * wave;
}

/** 点的屏幕直径 (CSS px): baseSize * (1 + sizeRandomness * (r - 0.5)) / 深度, 与规格的点精灵尺寸同式. */
export function pointSize(baseSize: number, sizeRandomness: number, r: number, ahead: number): number {
  return Math.max(0, (baseSize * (1 + sizeRandomness * (r - HALF))) / Math.max(ahead, PARTICLES.near));
}

/**
 * 冲击环对一点的推移 (CSS px). 环半径 age * 520, 宽 46, 寿命 1.5s, 越老越弱.
 *
 * @param dist 点到点击中心的距离 (CSS px).
 * @param age 冲击环年龄 (秒).
 */
export function burstPush(dist: number, age: number): number {
  if (age < 0 || age > PARTICLES.burstSeconds) return 0;
  const front = age * PARTICLES.burstSpeed;
  const k = (dist - front) / PARTICLES.burstWidth;
  const wave = Math.exp(-k * k);
  const fade = 1 - age / PARTICLES.burstSeconds;
  return wave * fade * PARTICLES.burstPush * smooth(0, PARTICLES.burstReachFade, dist);
}

/**
 * 悬停推开或吸引的位移比例 (正为远离指针), 半径内平滑衰减.
 *
 * @param dist 点到指针的距离 (CSS px).
 * @param radius hoverRadius.
 * @param effect 悬停效果.
 */
export function hoverShift(dist: number, radius: number, effect: ParticleHover): number {
  if (effect === "parallax" || radius <= 0 || dist >= radius) return 0;
  const falloff = 1 - smooth(0, radius, dist);
  const reach = radius * PARTICLES.hoverReach * falloff;
  return effect === "repel" ? reach : -Math.min(reach, dist);
}

/** 两点连线的不透明度: 距离越近越实, 超过 maxDist 为 0. */
export function linkAlpha(dist: number, maxDist: number): number {
  if (maxDist <= 0 || dist >= maxDist) return 0;
  return (1 - dist / maxDist) * PARTICLES.linkAlpha;
}
