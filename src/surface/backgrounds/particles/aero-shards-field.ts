// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 AeroShards 条目, 实现为 HX 自有.
import type { BackdropTap } from "../../backdrop/kernel/pointer";
import { seeded, smooth, TURN } from "./tokens";

export type AeroShardsPlacement = "full" | "center" | "left" | "right";
export type AeroShardsMaterial = "glass" | "frosted" | "crystal";
export type AeroShardsMarkers = "plus" | "dots" | "none";

export const AERO = {
  /** 规格 FLOATS: 着色器 uniform 数组里最多放的碎片数. */
  floats: 24,
  /** 规格 CAMERA: 相机位于 z = 4, 朝 -z 看. */
  camera: 4,
  /** 规格 FOCUS: 焦距, z 处的透视倍率为 FOCUS / (CAMERA - z). */
  focus: 3.1,
  /** 规格 SHARD_FOCUS: 景深对焦的视距, 离它越远越虚. */
  shardFocus: 2.75,
  /** 规格 MAX_BANK: 横滚角上限 (弧度). */
  maxBank: 1.0,
  /** 规格 INTRO_SECONDS. */
  introSeconds: 3.4,
  /** 规格 MARKER_FLOATS: 漂浮标记的个数. */
  markerFloats: 8,
  /** 规格 MAX_RINGS / RING_SECONDS: 点击环个数与寿命. */
  maxRings: 4,
  ringSeconds: 2.6,
  /** 规格 BLOOM_LEVELS (本件只做一级, 见 ENGINE-GAP). */
  bloomLevels: 4,
  /** 规格: 子步 1/120s. */
  substep: 1 / 120,
  /** 规格: 按住时 gather 以 0.3s 升向 hold, 松开以 0.2s 落回 0. */
  gatherRise: 0.3,
  gatherFall: 0.2,
  /** 规格: 弹簧刚度 24 * (1 - gather * 0.95). */
  stiffness: 24,
  gatherSoften: 0.95,
  /** 本库定: 阻尼比, 横滚跟随, 指针排斥半径 (屏幕单位) 与力, 点击冲量半径与强度, 聚拢后的团簇大小, 景深层次. */
  dampingRatio: 0.55,
  bankTau: 0.15,
  bankGain: 0.35,
  repelRadius: 0.32,
  repelForce: 7,
  pulseRadius: 0.9,
  pulseImpulse: 3.2,
  cluster: 0.14,
  nearZ: 1.6,
  farZ: -4.5,
} as const;

/** 规格 MARKER_STYLES (plus 0, dots 1), none 用 -1 关闭. */
export const MARKER_STYLES: Readonly<Record<AeroShardsMarkers, number>> = { plus: 0, dots: 1, none: -1 };
/** 本库定: 材质的折射偏移 / 磨砂 / 菲涅耳边光 / 体色比例. */
export const MATERIALS: Readonly<Record<AeroShardsMaterial, readonly [number, number, number, number]>> = {
  glass: [0.06, 0, 0.85, 0.18],
  frosted: [0.03, 0.6, 0.5, 0.32],
  crystal: [0.1, 0, 1.1, 0.1],
};
/** 摆位: 家位置在视野里所占的横向区间 (-1..1). */
const PLACEMENTS: Readonly<Record<AeroShardsPlacement, readonly [number, number]>> = {
  full: [-1, 1],
  center: [-0.5, 0.5],
  left: [-1, -0.1],
  right: [0.1, 1],
};

/** z 处的透视倍率. */
export function scaleAt(z: number): number {
  return AERO.focus / Math.max(0.2, AERO.camera - z);
}

/** 当前 gather 下的弹簧刚度, 聚拢时变软, 碎片懒懒地飘过去. */
export function shardStiffness(gather: number): number {
  return AERO.stiffness * (1 - Math.min(1, Math.max(0, gather)) * AERO.gatherSoften);
}

export interface Shard {
  hx: number;
  hy: number;
  hz: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  angle: number;
  spin: number;
  bank: number;
  size: number;
  tint: number;
  phase: number;
  delay: number;
  gather: number;
}

export interface ShardOptions {
  readonly count: number;
  readonly aspect: number;
  readonly spread: number;
  readonly size: number;
  readonly placement: AeroShardsPlacement;
  readonly seed: number;
}

/**
 * 撒碎片: 深度在 [farZ, nearZ] 内, 横向按摆位铺进该深度的视野, 纵向铺满. 数量钳到 FLOATS.
 */
export function makeShards(o: ShardOptions): Shard[] {
  const n = Math.max(0, Math.min(AERO.floats, Math.round(o.count)));
  const rand = seeded(o.seed);
  const [lo, hi] = PLACEMENTS[o.placement] ?? PLACEMENTS.full;
  const spread = Math.max(0.1, o.spread);
  const out: Shard[] = [];
  for (let i = 0; i < n; i += 1) {
    const hz = AERO.farZ + rand() * (AERO.nearZ - AERO.farZ);
    const half = 1 / scaleAt(hz);
    const hx = (lo + rand() * (hi - lo)) * Math.max(0.2, o.aspect) * half * 0.9 * spread;
    const hy = (rand() * 2 - 1) * half * 0.85 * spread;
    out.push({
      hx, hy, hz, x: hx, y: hy, z: hz, vx: 0, vy: 0, vz: 0, angle: rand() * TURN, spin: (rand() - 0.5) * 0.6, bank: 0,
      size: (0.16 + rand() * 0.22) * Math.max(0.05, o.size), tint: rand(), phase: rand() * TURN, delay: rand(), gather: 0,
    });
  }
  return out;
}

/** 一帧的输入. 指针用屏幕居中坐标 (y 朝上, 高为 2). */
export interface ShardInput {
  readonly time: number;
  readonly hold: number;
  readonly px: number;
  readonly py: number;
  readonly presence: number;
  readonly mouseStrength: number;
  readonly billow: number;
  readonly twist: number;
}

/**
 * 推进一帧: gather 一阶升降, 子步 1/120s 的阻尼弹簧拉向 (漂浮的家位置 与 指针处团簇 按 gather 混合), 指针排斥, 自转, 按横向速度横滚.
 *
 * @param shards 原地更新.
 * @param dt 帧长 (秒).
 */
export function stepShards(shards: Shard[], dt: number, input: ShardInput): void {
  if (dt <= 0) return;
  const steps = Math.max(1, Math.ceil(dt / AERO.substep));
  const h = dt / steps;
  const hold = Math.min(1, Math.max(0, input.hold));
  for (const s of shards) {
    const rising = hold > s.gather;
    s.gather += ((rising ? hold : 0) - s.gather) * (1 - Math.exp(-dt / (rising ? AERO.gatherRise : AERO.gatherFall)));
    const g = s.gather;
    const k = shardStiffness(g);
    const c = 2 * Math.sqrt(k) * AERO.dampingRatio;
    for (let step = 0; step < steps; step += 1) {
      const t = input.time + step * h;
      const b = input.billow * 0.22;
      const wx = s.hx + Math.sin(t * 0.31 + s.phase) * b;
      const wy = s.hy + Math.sin(t * 0.43 + s.phase * 1.7) * b * 1.2;
      const wz = s.hz + Math.sin(t * 0.27 + s.phase * 2.3) * b * 0.8;
      const tz = wz + (s.hz * 0.35 - wz) * g;
      const sc = scaleAt(tz);
      const tx = wx + (input.px / sc + s.hx * AERO.cluster - wx) * g;
      const ty = wy + (input.py / sc + s.hy * AERO.cluster - wy) * g;
      let ax = k * (tx - s.x) - c * s.vx;
      let ay = k * (ty - s.y) - c * s.vy;
      const az = k * (tz - s.z) - c * s.vz;
      const here = scaleAt(s.z);
      const dx = s.x * here - input.px;
      const dy = s.y * here - input.py;
      const d = Math.hypot(dx, dy);
      if (input.presence > 0 && d < AERO.repelRadius * 2 && d > 1e-4) {
        const push = AERO.repelForce * input.mouseStrength * input.presence * (1 - g) * Math.exp(-(d * d) / (AERO.repelRadius * AERO.repelRadius));
        ax += (dx / d) * push / here;
        ay += (dy / d) * push / here;
      }
      s.vx += ax * h; s.vy += ay * h; s.vz += az * h;
      s.x += s.vx * h; s.y += s.vy * h; s.z += s.vz * h;
    }
    s.z = Math.min(AERO.camera - 0.6, s.z);
    s.angle += s.spin * input.twist * dt * (1 + g * 2);
    const bank = Math.max(-AERO.maxBank, Math.min(AERO.maxBank, s.vx * AERO.bankGain));
    s.bank += (bank - s.bank) * (1 - Math.exp(-dt / AERO.bankTau));
  }
}

/** 点击冲量: 屏幕半径 0.9 内的碎片按距离线性衰减地被推开, 并朝相机方向微微一顶. */
export function pulseShards(shards: Shard[], px: number, py: number, strength: number = 1): void {
  for (const s of shards) {
    const sc = scaleAt(s.z);
    const dx = s.x * sc - px;
    const dy = s.y * sc - py;
    const d = Math.hypot(dx, dy);
    if (d >= AERO.pulseRadius) continue;
    const k = AERO.pulseImpulse * strength * (1 - d / AERO.pulseRadius);
    s.vx += (d > 1e-4 ? dx / d : 0) * k / sc;
    s.vy += (d > 1e-4 ? dy / d : 1) * k / sc;
    s.vz += k * 0.3;
  }
}

/**
 * 点击环: 取寿命 RING_SECONDS 内最近的 MAX_RINGS 个, 摊成 vec4 (归一化 x, y, 进度 0..1, 有效).
 *
 * @param taps 内核的点击队列 (at 为 elapsed 时钟).
 * @param elapsed 当前 elapsed.
 */
export function ringList(taps: readonly BackdropTap[], elapsed: number): Float32Array {
  const list = new Float32Array(AERO.maxRings * 4);
  const live = taps.filter((t) => elapsed - t.at >= 0 && elapsed - t.at < AERO.ringSeconds).slice(-AERO.maxRings);
  live.forEach((t, i) => list.set([t.x, t.y, (elapsed - t.at) / AERO.ringSeconds, 1], i * 4));
  return list;
}

export interface ShardView {
  readonly camX: number;
  readonly camY: number;
  /** 出帧以来秒数; Infinity 视为入场结束. */
  readonly elapsed: number;
  readonly intro: boolean;
}

/** 单片入场进度: 错峰延迟占入场时长一半, 每片用另一半缓出升起. */
export function shardIntro(delay: number, elapsed: number, intro: boolean): number {
  if (!intro || !Number.isFinite(elapsed)) return 1;
  const half = AERO.introSeconds * 0.5;
  return smooth(0, 1, (elapsed - delay * half) / half);
}

/**
 * 投影并按远到近排序, 摊成两张 vec4 表:
 * a = (屏幕 x, 屏幕 y, 视距, 投影尺寸), b = (自转角, 横滚, 色相位, 不透明度). 入场时从下方升起并淡入.
 */
export function packShards(shards: readonly Shard[], view: ShardView): { a: Float32Array; b: Float32Array; count: number } {
  const a = new Float32Array(AERO.floats * 4);
  const b = new Float32Array(AERO.floats * 4);
  const order = shards.slice(0, AERO.floats).sort((p, q) => p.z - q.z);
  order.forEach((s, i) => {
    const sc = scaleAt(s.z);
    const e = shardIntro(s.delay, view.elapsed, view.intro);
    a.set([(s.x - view.camX) * sc, (s.y - view.camY) * sc - (1 - e) * 1.4, AERO.camera - s.z, s.size * sc], i * 4);
    b.set([s.angle + (1 - e) * 1.2, s.bank, s.tint, e], i * 4);
  });
  return { a, b, count: order.length };
}
