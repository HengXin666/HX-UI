// 行为规格参照 docs/research/catalog/animations.md 的 GlowCursor 条目, 实现为 HX 自有.
/**
 * HaloCursor 的模拟: 平滑跟手的光头, 沿路径按间距留下轨迹点, 三层余辉按 linger 各自指数衰减, 点击光环.
 * 坐标与长度都是设备像素; 不碰画布.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
import { HALO } from "../tokens";
import { clamp, follow } from "./common";

export interface HaloPoint {
  x: number;
  y: number;
  age: number;
  /** 留下时的能量 0..1 (随移动速度). */
  energy: number;
}

export interface HaloState {
  x: number;
  y: number;
  energy: number;
  points: HaloPoint[];
  bursts: { x: number; y: number; age: number }[];
  placed: boolean;
}

export function makeHalo(): HaloState {
  return { x: 0, y: 0, energy: 0, points: [], bursts: [], placed: false };
}

/** 跟手时间常数: 0.12 x (1 - followSpeed) + 0.01. */
export function haloFollowTau(followSpeed: number): number {
  return HALO.followTauSpan * (1 - clamp(followSpeed, 0, 1)) + HALO.followTauMin;
}

/** 三层余辉 (wide, core, hot) 在 age 秒时的残留: exp(-age x 4.6 / (linger x 1.2 / 0.8 / 0.2)). */
export function haloLayers(age: number, linger: number): readonly [number, number, number] {
  const l = Math.max(0.05, linger);
  const at = (share: number): number => Math.exp((-age * HALO.lingerRate) / (l * share));
  return [at(HALO.lingerWide), at(HALO.lingerCore), at(HALO.lingerHot)];
}

/** 推进一帧; 返回这一帧光头移动的距离. */
export function stepHalo(s: HaloState, tx: number, ty: number, dt: number, followSpeed: number, linger: number, scale: number): number {
  if (!s.placed) {
    s.x = tx;
    s.y = ty;
    s.placed = true;
  }
  const k = follow(dt, haloFollowTau(followSpeed));
  const nx = s.x + (tx - s.x) * k;
  const ny = s.y + (ty - s.y) * k;
  const moved = Math.hypot(nx - s.x, ny - s.y);
  s.x = nx;
  s.y = ny;
  const speed = dt > 0 ? moved / scale / dt : 0;
  s.energy = Math.max(s.energy * Math.exp(-dt * HALO.calmRate), clamp(speed / 1500, 0, 1));
  for (const p of s.points) p.age += dt;
  const ttl = Math.max(0.05, linger) * HALO.lingerWide;
  s.points = s.points.filter((p) => p.age < ttl);
  const last = s.points[s.points.length - 1];
  if (!last || Math.hypot(last.x - s.x, last.y - s.y) >= HALO.sampleGap * scale) s.points.push({ x: s.x, y: s.y, age: 0, energy: Math.max(0.3, s.energy) });
  if (s.points.length > HALO.maxPoints) s.points.splice(0, s.points.length - HALO.maxPoints);
  for (const b of s.bursts) b.age += dt;
  s.bursts = s.bursts.filter((b) => b.age < HALO.burstS);
  return moved;
}
