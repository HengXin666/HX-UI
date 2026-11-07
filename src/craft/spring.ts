import { DIGIT_OVERSHOOT, DT_MAX_MS, DT_MIN_MS, REST_EPSILON } from "./tokens";

export interface SpringSpec {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
}

export interface SpringStep {
  readonly current: number;
  readonly velocity: number;
  readonly resting: boolean;
}

/**
 * 半隐式弹簧一步. dt 钳在 8ms 到 34ms, 切后台不会一帧飞出去.
 * 速度保留, 调用方改目标即可中断.
 *
 * .agents/notes/implemented/feature/2026-11-07-craft-motion.md
 */
export function stepSpring(current: number, velocity: number, target: number, spring: SpringSpec, dtMs: number): SpringStep {
  const dt = Math.min(DT_MAX_MS, Math.max(DT_MIN_MS, dtMs)) / 1000;
  const force = spring.stiffness * (target - current) - spring.damping * velocity;
  const nextVelocity = velocity + (force / spring.mass) * dt;
  const next = current + nextVelocity * dt;
  const resting = Math.abs(target - next) <= REST_EPSILON && Math.abs(nextVelocity) <= REST_EPSILON;
  return resting ? { current: target, velocity: 0, resting: true } : { current: next, velocity: nextVelocity, resting: false };
}

/** CountUp 的 makeSpring: 过冲不超过给定位数, 结束补进 1. */
export function digitEase(t: number, overshoot: number = DIGIT_OVERSHOOT): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const log = Math.log(Math.min(0.5, Math.max(0.001, overshoot)));
  const zeta = -log / Math.sqrt(Math.PI * Math.PI + log * log);
  const damped = Math.PI / 0.52;
  const natural = damped / Math.sqrt(1 - zeta * zeta);
  const raw = (time: number): number => 1 - Math.exp(-zeta * natural * time) * Math.cos(damped * time);
  const residual = 1 - raw(1);
  return raw(t) + residual * t * t * t;
}
