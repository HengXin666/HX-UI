/**
 * SwingLanyard 的规格常数与 2D 绳索: 位置积分 (verlet) 加距离约束, 末端挂卡 (更重), 可被指针钉住.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stage3d.md
 */
import { clamp } from "../tokens";

/** 挂点横向比例 (Lanyard.jsx:12). */
export const ROPE_ANCHORS = { left: 0.27, center: 0.5, right: 0.73 } as const;
export type RopeAnchor = keyof typeof ROPE_ANCHORS;
/** 绳节 4 段, 每节权重 1 / 0.05, 子步 1/960s, 约束迭代 2 次 (Lanyard.jsx:15-18). */
export const ROPE_JOINTS = 4;
export const ROPE_NODE_WEIGHT = 1 / 0.05;
export const ROPE_MAX_STEP = 1 / 960;
export const ROPE_ITERATIONS = 2;
/** 卡相对绳节的质量倍数, 重力 px/s² (gravity 1 时), 风的幅度 px/s² 与周期 s (规格的刚体参数在 3D 单位里, 换到 px 的数值 HX 自定). */
export const ROPE_CARD_MASS = 4;
export const ROPE_GRAVITY = 2400;
export const ROPE_BREEZE = 160;
export const ROPE_BREEZE_PERIOD_S = 3.2;
/** 单帧最长 0.05s, 子步上限 48 (HX 自定, 防切后台回来一帧算太多). */
export const ROPE_MAX_DT = 0.05;
export const ROPE_MAX_SUBSTEPS = 48;

export interface RopeParams {
  readonly gravity: number;
  readonly damping: number;
  readonly elasticity: number;
  readonly breeze: number;
}

export interface Rope {
  readonly x: Float64Array;
  readonly y: Float64Array;
  readonly px: Float64Array;
  readonly py: Float64Array;
  segment: number;
  ax: number;
  ay: number;
  t: number;
}

/**
 * 从挂点竖直垂下的一条绳. 节点 0 是挂点, 最后一个是卡. dropFrom > 0 时卡从高 dropFrom px 处落下:
 * 绳先收成折线 (节点左右交错, 避免完全竖直的对折解不开), 落下时拉直.
 */
export function createRope(ax: number, ay: number, length: number, dropFrom = 0): Rope {
  const n = ROPE_JOINTS + 1;
  const segment = Math.max(1, length / ROPE_JOINTS);
  const r: Rope = { x: new Float64Array(n), y: new Float64Array(n), px: new Float64Array(n), py: new Float64Array(n), segment, ax, ay, t: 0 };
  const lift = Math.min(Math.max(0, dropFrom), length * 0.9);
  const k = 1 - lift / Math.max(1, length);
  for (let i = 0; i < n; i += 1) {
    r.x[i] = ax + (i > 0 && lift > 0 ? (i % 2 ? 1 : -1) * segment * 0.35 * (lift / length) : 0);
    r.y[i] = ay + i * segment * k;
    r.px[i] = r.x[i] ?? ax;
    r.py[i] = r.y[i] ?? ay;
  }
  return r;
}

function inv(i: number, n: number): number {
  if (i === 0) return 0;
  return i === n - 1 ? 1 / ROPE_CARD_MASS : 1;
}

/** 推进 dt 秒. pin 不为空时末端 (卡) 钉在 pin. 返回最大速度 px/s, 供调用方判断是否静止. */
export function stepRope(r: Rope, dtS: number, p: RopeParams, pin: { readonly x: number; readonly y: number } | null): number {
  const n = r.x.length;
  const total = clamp(dtS, 0, ROPE_MAX_DT);
  const steps = Math.min(ROPE_MAX_SUBSTEPS, Math.max(1, Math.ceil(total / ROPE_MAX_STEP - 1e-6)));
  const h = total / steps;
  const keep = 1 - clamp(p.damping, 0, 1) * 0.004;
  const stiff = clamp(1 - p.elasticity * 0.6, 0.2, 1);
  let speed = 0;
  for (let s = 0; s < steps; s += 1) {
    r.t += h;
    const wind = p.breeze * ROPE_BREEZE * Math.sin((r.t / ROPE_BREEZE_PERIOD_S) * Math.PI * 2);
    for (let i = 1; i < n; i += 1) {
      const x = r.x[i] ?? 0;
      const y = r.y[i] ?? 0;
      const vx = (x - (r.px[i] ?? x)) * keep;
      const vy = (y - (r.py[i] ?? y)) * keep;
      r.px[i] = x;
      r.py[i] = y;
      r.x[i] = x + vx + wind * h * h;
      r.y[i] = y + vy + p.gravity * ROPE_GRAVITY * h * h;
    }
    r.x[0] = r.ax;
    r.y[0] = r.ay;
    if (pin) {
      r.x[n - 1] = pin.x;
      r.y[n - 1] = pin.y;
    }
    for (let k = 0; k < ROPE_ITERATIONS; k += 1) {
      for (let i = 0; i < n - 1; i += 1) {
        const dx = (r.x[i + 1] ?? 0) - (r.x[i] ?? 0);
        const dy = (r.y[i + 1] ?? 0) - (r.y[i] ?? 0);
        const d = Math.hypot(dx, dy) || 1e-6;
        const wa = inv(i, n);
        const wb = pin && i + 1 === n - 1 ? 0 : inv(i + 1, n);
        const w = wa + wb;
        if (w <= 0) continue;
        const diff = ((d - r.segment) / d) * stiff;
        r.x[i] = (r.x[i] ?? 0) + dx * diff * (wa / w);
        r.y[i] = (r.y[i] ?? 0) + dy * diff * (wa / w);
        r.x[i + 1] = (r.x[i + 1] ?? 0) - dx * diff * (wb / w);
        r.y[i + 1] = (r.y[i + 1] ?? 0) - dy * diff * (wb / w);
      }
    }
  }
  for (let i = 1; i < n; i += 1) speed = Math.max(speed, Math.hypot((r.x[i] ?? 0) - (r.px[i] ?? 0), (r.y[i] ?? 0) - (r.py[i] ?? 0)) / Math.max(h, 1e-6));
  return speed;
}

/** 卡的朝向: 末段方向相对竖直的角度 deg (向右摆为负). */
export function cardAngle(r: Rope): number {
  const n = r.x.length;
  const dx = (r.x[n - 1] ?? 0) - (r.x[n - 2] ?? 0);
  const dy = (r.y[n - 1] ?? 0) - (r.y[n - 2] ?? 0);
  return 0 - (Math.atan2(dx, dy) * 180) / Math.PI;
}

/** 绳的 SVG 折线 path. */
export function ropePath(r: Rope): string {
  let d = "";
  for (let i = 0; i < r.x.length; i += 1) d += `${i ? " L" : "M"}${(r.x[i] ?? 0).toFixed(1)} ${(r.y[i] ?? 0).toFixed(1)}`;
  return d;
}
