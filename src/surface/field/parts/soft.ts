// 行为规格参照 docs/research/catalog/animations.md 的 ShapeBlur 条目, 实现为 HX 自有.
/**
 * SoftShape 的小状态: 自转角, 透镜位置与力度 (指针在场时跟手, 闲置时沿利萨如漂). 坐标是归一化 (y 朝上). 纯函数.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { SOFT } from "../tokens";

export interface SoftState {
  angle: number;
  x: number;
  y: number;
  power: number;
  clock: number;
}

export function makeSoft(): SoftState {
  return { angle: 0, x: 0.5, y: 0.5, power: 0, clock: 0 };
}

/** 闲置漂移路径 (归一化坐标), 以短边比例 amp 为幅度. */
export function softIdlePath(t: number, aspect: number): readonly [number, number] {
  const ax = SOFT.idleAmp / Math.max(aspect, 1e-3);
  return [0.5 + Math.min(0.45, ax) * Math.sin((t * Math.PI * 2) / 9), 0.5 + SOFT.idleAmp * Math.sin((t * Math.PI * 2) / 7 + 1)];
}

/**
 * 推进一帧. 规格: 自转 (angle + spin x dt) % 360, 跟手 1 - exp(-dt x (在场 10 / 闲置 3)), 力度 1 - exp(-dt x 4).
 *
 * @param aspect 宿主宽 / 高.
 */
export function stepSoft(s: SoftState, dt: number, spin: number, idle: boolean, aspect: number, pointer: { x: number; y: number; inside: boolean }): void {
  if (dt <= 0) return;
  s.clock += dt;
  s.angle = (s.angle + spin * dt) % 360;
  const active = pointer.inside;
  const [gx, gy] = active ? [pointer.x, pointer.y] : softIdlePath(s.clock, aspect);
  const follow = 1 - Math.exp(-dt * (active ? SOFT.followActive : SOFT.followIdle));
  s.x += (gx - s.x) * follow;
  s.y += (gy - s.y) * follow;
  const target = active || idle ? 1 : 0;
  s.power += (target - s.power) * (1 - Math.exp(-dt * SOFT.powerRate));
}
