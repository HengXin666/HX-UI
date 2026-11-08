import type { SpringSpec } from "../../craft/spring";

/** 本文件内重复出现的字面量, 只写一次. */
const TWO = 2;

/**
 * 把 "时长 + bounce" 写法的弹簧换到 craft/spring 的 stiffness / damping / mass.
 * bounce 定阻尼比 (zeta = 1 - bounce), 时长定固有频率: 包络在该时长衰减到 SETTLE_DELTA.
 */

/*
 * ENGINE-GAP: craft/spring 的 stepSpring 是无子步的半隐式欧拉, dt 下限 8ms. 换算出的参数在解析意义上
 * 保留过冲与时长, 但小 bounce 在 8ms 到 17ms 帧长下的实际过冲会被数值阻尼压低 (bounce 0.2 理论 1.5%).
 * 需要 L1 提供子步或解析解的弹簧步进后才能逐帧对齐.
 */

/** 包络衰减到这个残差即视为落定, 与 motion 弹簧的 restDelta 同量级. */
export const SETTLE_DELTA = 0.001;
const MIN_ZETA = 0.05;
const MAX_ZETA = 1;
const OMEGA_LO = 0.1;
const OMEGA_HI = 2000;
const BISECT_STEPS = 60;

function envelope(zeta: number, omega: number, t: number): number {
  if (zeta >= MAX_ZETA) return (1 + omega * t) * Math.exp(-omega * t);
  return Math.exp(-zeta * omega * t) / Math.sqrt(1 - zeta * zeta);
}

/** 阻尼比. */
export function dampingRatio(spec: SpringSpec): number {
  return spec.damping / (TWO * Math.sqrt(spec.stiffness * spec.mass));
}

/** 从静止走向目标时的首个过冲 (相对行程). 临界及过阻尼为 0. */
export function overshootOf(spec: SpringSpec): number {
  const zeta = dampingRatio(spec);
  if (zeta >= MAX_ZETA) return 0;
  return Math.exp((-zeta * Math.PI) / Math.sqrt(1 - zeta * zeta));
}

/**
 * 时长 (秒) 加 bounce 换成弹簧参数. 保留原意: 过冲由 bounce 决定, 在 durationS 内落定.
 *
 * @param durationS 落定时长, 秒.
 * @param bounce 0 为临界阻尼, 越大过冲越多.
 * @param mass 质量, 默认 1.
 */
export function springFromDuration(durationS: number, bounce: number, mass = 1): SpringSpec {
  const zeta = Math.min(MAX_ZETA, Math.max(MIN_ZETA, 1 - bounce));
  let lo = OMEGA_LO;
  let hi = OMEGA_HI;
  for (let i = 0; i < BISECT_STEPS; i += 1) {
    const mid = (lo + hi) / TWO;
    if (envelope(zeta, mid, durationS) > SETTLE_DELTA) lo = mid;
    else hi = mid;
  }
  const omega = hi;
  const stiffness = omega * omega * mass;
  return { stiffness, damping: TWO * zeta * Math.sqrt(stiffness * mass), mass };
}

/** 已知刚度与质量, 取临界阻尼再乘系数. 系数 1 为临界, 小于 1 带回弹. */
export function dampedSpring(stiffness: number, mass: number, dampingScale: number): SpringSpec {
  return { stiffness, damping: TWO * Math.sqrt(stiffness * mass) * dampingScale, mass };
}
