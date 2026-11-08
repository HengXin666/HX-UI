import type { SpringSpec, SpringStep } from "../../craft/spring";
import { DT_MAX_MS, REST_EPSILON } from "../../craft/tokens";

/**
 * 弹簧单步积分器. craft/spring 的 stepSpring 是半隐式欧拉 (dt 钳在 8ms 到 34ms), 刚的弹簧在常见帧长下
 * 过冲会被数值阻尼吃掉; 这里补阻尼谐振子的解析解, 任意帧长都精确. 两者签名相同, 驱动按需选.
 *
 * .agents/notes/implemented/feature/2026-11-08-motion-spring-frame.md
 */
export type SpringIntegrator = (current: number, velocity: number, target: number, spec: SpringSpec, dtMs: number) => SpringStep;

const MS_PER_S = 1000;
const CRITICAL_COEFF = 2;
/** 阻尼比离 1 这么近时按临界阻尼的解求. */
const CRITICAL_BAND = 1e-6;

/**
 * 解析解推进一帧. 速度保留, 目标可随时改; 落定阈值与 stepSpring 同为 REST_EPSILON.
 *
 * @param current 当前值.
 * @param velocity 当前速度, 单位/秒.
 * @param target 目标值.
 * @param spec 弹簧参数.
 * @param dtMs 帧长, 毫秒.
 * @param maxDtMs 帧长上限, 默认与 stepSpring 同为 34ms, 切后台回来不会一帧飞出去.
 */
export function stepSpringExact(current: number, velocity: number, target: number, spec: SpringSpec, dtMs: number, maxDtMs = DT_MAX_MS): SpringStep {
  const t = Math.min(maxDtMs, Math.max(0, dtMs)) / MS_PER_S;
  const omega = Math.sqrt(spec.stiffness / spec.mass);
  const zeta = spec.damping / (CRITICAL_COEFF * Math.sqrt(spec.stiffness * spec.mass));
  const x0 = current - target;
  let x: number;
  let v: number;
  if (Math.abs(zeta - 1) < CRITICAL_BAND) {
    const e = Math.exp(-omega * t);
    const b = velocity + omega * x0;
    x = (x0 + b * t) * e;
    v = (velocity - omega * t * b) * e;
  } else if (zeta < 1) {
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    const e = Math.exp(-zeta * omega * t);
    const cos = Math.cos(wd * t);
    const sin = Math.sin(wd * t);
    x = e * (x0 * cos + ((velocity + zeta * omega * x0) / wd) * sin);
    v = e * (velocity * cos - ((omega * omega * x0 + zeta * omega * velocity) / wd) * sin);
  } else {
    const root = Math.sqrt(zeta * zeta - 1);
    const r1 = -omega * (zeta - root);
    const r2 = -omega * (zeta + root);
    const a = (velocity - r2 * x0) / (r1 - r2);
    const b = x0 - a;
    x = a * Math.exp(r1 * t) + b * Math.exp(r2 * t);
    v = r1 * a * Math.exp(r1 * t) + r2 * b * Math.exp(r2 * t);
  }
  const resting = Math.abs(x) <= REST_EPSILON && Math.abs(v) <= REST_EPSILON;
  return resting ? { current: target, velocity: 0, resting: true } : { current: target + x, velocity: v, resting: false };
}

/** 换一个帧长上限的解析积分器, 供驱动与通道直接使用. */
export function exactStepper(maxDtMs: number): SpringIntegrator {
  return (current, velocity, target, spec, dtMs) => stepSpringExact(current, velocity, target, spec, dtMs, maxDtMs);
}
