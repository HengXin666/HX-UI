// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 AcidSquares 条目, 实现为 HX 自有.
import { clamp, smoothstep } from "../../backdrop/kernel/math";
import { DEG } from "./tokens";

/** 规格常数. */
export const ACID_SQUARES = {
  /** 同时生效的点击涟漪数, 与内核 u_taps 个数一致. */
  maxRipples: 8,
  /** 入场: 柱面从隆起回落的时长 (秒). */
  introSeconds: 3,
  /** 揭开: 由中心向外逐格升起的时长 (秒). */
  revealSeconds: 2.6,
  /** 揭开前沿走到的格数. */
  revealReach: 19,
  /** 入场隆起峰值. */
  swellPeak: 0.9,
  /** 点击涟漪寿命 (秒) 与外扩速度 (格每秒). */
  rippleLife: 2.5,
  rippleSpeed: 6,
  /** 悬停点弹簧: 刚度与阻尼. */
  hoverStiffness: 90,
  hoverDamping: 19,
  /** 视角弹簧: 刚度与阻尼. */
  lookStiffness: 30,
  lookDamping: 11,
  /** 悬停在场程度的升 / 降时间常数 (秒). */
  hoverRise: 0.35,
  hoverFall: 0.6,
  /** 灯光时钟倍率. */
  lightRate: 0.6,
} as const;

/** 步进上限 (质量档): 代替上游网格细分档. */
export const ACID_QUALITY = { low: 48, medium: 72, high: 96 } as const;
export type AcidQuality = keyof typeof ACID_QUALITY;
/** 悬停效果到着色器符号: 按下压低, 抬起顶高. */
export const ACID_HOVER = { press: 1, lift: -1, none: 0 } as const;
export type AcidHover = keyof typeof ACID_HOVER;
/** 打光: 双色分光或单色. */
export const ACID_LIGHTING = { split: 0, mono: 1 } as const;
export type AcidLighting = keyof typeof ACID_LIGHTING;
/** 柱截面. */
export const ACID_SHAPES = { square: 0, circle: 1 } as const;
export type AcidShape = keyof typeof ACID_SHAPES;
/** 脉冲环起点. */
export const ACID_PULSE_ORIGINS = { center: 0, pointer: 1 } as const;
export type AcidPulseOrigin = keyof typeof ACID_PULSE_ORIGINS;

/** 二维弹簧. */
export interface Spring2 {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * 半隐式欧拉推进二维弹簧; dt 为 0 (静态帧) 时直接落到目标.
 *
 * @param s 原地修改的弹簧.
 * @param tx 目标 x.
 * @param ty 目标 y.
 * @param dt 帧长 (秒).
 * @param k 刚度.
 * @param c 阻尼.
 */
export function springStep(s: Spring2, tx: number, ty: number, dt: number, k: number, c: number): Spring2 {
  if (dt <= 0) {
    Object.assign(s, { x: tx, y: ty, vx: 0, vy: 0 });
    return s;
  }
  s.vx += (k * (tx - s.x) - c * s.vx) * dt;
  s.vy += (k * (ty - s.y) - c * s.vy) * dt;
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  return s;
}

/**
 * 入场隆起量: 前 55% 保持峰值, 之后缓落到 0; 关闭入场或减弱动效时为 0.
 *
 * @param elapsed 出帧以来真实秒数.
 * @param enabled 是否播入场.
 */
export function introSwell(elapsed: number, enabled: boolean): number {
  if (!enabled || !Number.isFinite(elapsed)) return 0;
  return ACID_SQUARES.swellPeak * (1 - smoothstep(0.55, 1, elapsed / ACID_SQUARES.introSeconds));
}

/**
 * 揭开前沿: 返回 [前沿格数, 是否已全部揭开 0 / 1].
 *
 * @param elapsed 出帧以来真实秒数.
 * @param enabled 是否播揭开.
 */
export function revealFront(elapsed: number, enabled: boolean): readonly [number, number] {
  if (!enabled || !Number.isFinite(elapsed)) return [ACID_SQUARES.revealReach, 1];
  const t = clamp(elapsed / ACID_SQUARES.revealSeconds, 0, 1);
  return [t * (ACID_SQUARES.revealReach + 3), t >= 1 ? 1 : 0];
}

/**
 * 柱顶可能达到的最高处 (格单位), 给着色器跳过空域.
 *
 * @param o 波幅, 脉冲, 隆起, 悬停效果是否开启.
 */
export function heightReach(o: { waves: number; pulse: number; bulge: number; swell: number; hover: boolean }): number {
  return 0.71 * Math.abs(o.waves) + 0.5 * Math.abs(o.pulse) + 0.25 * Math.abs(o.bulge) + o.swell + (o.hover ? 0.6 : 0) + 0.8;
}

/** 相机: 眼位, 三个轴, 焦距, 画面半高 (格). */
export interface AcidCamera {
  readonly eye: readonly [number, number, number];
  readonly forward: readonly [number, number, number];
  readonly right: readonly [number, number, number];
  readonly up: readonly [number, number, number];
  readonly focal: number;
  readonly viewHalf: number;
}

/**
 * 绕原点的环绕相机. tilt 0..1 映射俯角 20°..88°, 画面半高 8 / (zoom * tileSize) 格, 眼距 depth 格.
 *
 * @param o 旋转 (度), 俯仰, 缩放, 瓦片大小, 眼距, 视角偏移 (格).
 */
export function orbitCamera(o: { rotation: number; tilt: number; zoom: number; tileSize: number; depth: number; look: readonly [number, number] }): AcidCamera {
  const pitch = (20 + 68 * clamp(o.tilt, 0, 1)) * DEG;
  const yaw = o.rotation * DEG;
  const dist = Math.max(2, o.depth);
  const viewHalf = 8 / Math.max(0.05, o.zoom * o.tileSize);
  const back: [number, number, number] = [Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)];
  const right: [number, number, number] = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const up: [number, number, number] = [
    back[1] * right[2] - back[2] * right[1],
    back[2] * right[0] - back[0] * right[2],
    back[0] * right[1] - back[1] * right[0],
  ];
  const reach = dist * 0.25 * viewHalf;
  const tx = (right[0] * o.look[0] - Math.sin(yaw) * o.look[1] * 0.5) * viewHalf;
  const tz = (right[2] * o.look[0] - Math.cos(yaw) * o.look[1] * 0.5) * viewHalf;
  return {
    eye: [tx + back[0] * reach, back[1] * reach, tz + back[2] * reach],
    forward: [-back[0], -back[1], -back[2]],
    right,
    up,
    focal: dist * 0.25,
    viewHalf,
  };
}
