// 行为规格参照 docs/research/catalog/animations.md 的 LaserFlow 条目, 实现为 HX 自有.
/**
 * BeamFlow 的小状态: 入场 (光柱落下, 再沿地面铺开) 与光柱随指针的横移. 纯函数.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { BEAM } from "../tokens";

export interface BeamState {
  age: number;
  sway: number;
}

export function makeBeam(intro: boolean): BeamState {
  return { age: intro ? 0 : BEAM.dropS + BEAM.flowS, sway: 0 };
}

/** 入场进度: 光柱前沿 (0..1, 落到地面为 1) 与铺展 (0..1). */
export function beamIntro(age: number): { drop: number; flow: number } {
  const drop = Math.min(1, Math.max(0, age / BEAM.dropS));
  const flow = Math.min(1, Math.max(0, (age - BEAM.dropS) / BEAM.flowS));
  const ease = (t: number): number => 1 - (1 - t) ** 3;
  return { drop: ease(drop), flow: ease(flow) };
}

/**
 * 推进一帧, 返回光柱的横向位置 (宿主宽的比例).
 *
 * @param pointer 归一化指针 x 与是否在场; interactive 关时不横移.
 */
export function stepBeam(s: BeamState, dt: number, position: number, pointer: { x: number; inside: boolean }, interactive: boolean): number {
  s.age += Math.max(0, dt);
  const goal = interactive && pointer.inside ? (pointer.x - position) * BEAM.sway * 2 : 0;
  s.sway += (Math.max(-BEAM.sway, Math.min(BEAM.sway, goal)) - s.sway) * (dt > 0 ? 1 - Math.exp(-dt / BEAM.swayTau) : 0);
  return position + s.sway;
}
