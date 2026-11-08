/**
 * 一阶跟随与衰减: 与帧率无关的指数趋近, 逐帧跟随指针的倾斜, 抬起, 平滑速度都用它.
 *
 * .agents/notes/implemented/feature/2026-11-08-motion-spring-frame.md
 */

/** current + (target - current) * (1 - e^(-dt / tau)). tau 秒内走完约 63%; tau <= 0 直接到目标. */
export function approach(current: number, target: number, dtS: number, tauS: number): number {
  if (tauS <= 0) return target;
  return current + (target - current) * (1 - Math.exp(-dtS / tauS));
}

/** 指数衰减 value * e^(-dt / tau); tau <= 0 直接归零. */
export function decay(value: number, dtS: number, tauS: number): number {
  return tauS <= 0 ? 0 : value * Math.exp(-dtS / tauS);
}
