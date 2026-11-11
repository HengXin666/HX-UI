/**
 * 帧驱动的小工具: 钳位, 指数趋近, 三次缓出, 细分弹簧步, transition 串拼装.
 * 原先在导航族 tokens 里, 画廊 / 叠放 / 玻璃 / 卡片族层层转出; 现收进 src/motion, 各族直接引用.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
import { stepSpring, type SpringSpec, type SpringStep } from "../../craft/spring";
import { DT_MAX_MS, DT_MIN_MS } from "../../craft/tokens";

/** 一帧总长的上限是 craft 帧长上限的两倍 (切后台回来不跳太远). */
const DT_SPAN = 2;

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** 指数趋近一帧: 时间常数 tauMs 内走完约 63%. 规格的 1 - exp(-dt / tau) 写法. */
export function approach(current: number, target: number, dtMs: number, tauMs: number): number {
  if (tauMs <= 0) return target;
  return current + (target - current) * (1 - Math.exp(-dtMs / tauMs));
}

/** 三次缓出, 规格 ease(t) = 1 - (1 - t)^3, t 先钳到 [0, 1]. */
export function easeOutCubic(t: number): number {
  const k = 1 - clamp(t, 0, 1);
  return 1 - k * k * k;
}

/**
 * 细分弹簧步: 一帧切成不短于 DT_MIN_MS 的若干子步, 每步交给 craft 的 stepSpring.
 * 规格各件都按 240Hz 细分; craft 的 dt 下限是 8ms, 这里取它能接受的最细粒度,
 * 低质量高阻尼的弹簧 (Dock 的 0.1 / 150 / 12) 才不会在 16ms 帧上数值振荡.
 */
export function subStepSpring(current: number, velocity: number, target: number, spec: SpringSpec, dtMs: number): SpringStep {
  const total = Math.min(DT_MAX_MS * DT_SPAN, Math.max(DT_MIN_MS, dtMs));
  const steps = Math.max(1, Math.floor(total / DT_MIN_MS));
  const h = total / steps;
  let step: SpringStep = { current, velocity, resting: false };
  for (let i = 0; i < steps; i += 1) {
    step = stepSpring(step.current, step.velocity, target, spec, h);
    if (step.resting) return step;
  }
  return step;
}

/** 一条 CSS 过渡: 属性, 时长 ms, 曲线, 可选延迟 ms. */
export type TransitionPart = readonly [property: string, ms: number, easing: string, delayMs?: number];

/** 拼 transition 串. 只列具体属性, 从不写 all. 减弱动效时返回 none. */
export function transitionOf(parts: readonly TransitionPart[], reduced: boolean): string {
  if (reduced) return "none";
  return parts.map(([property, ms, easing, delayMs]) => `${property} ${ms}ms ${easing}${delayMs ? ` ${delayMs}ms` : ""}`).join(", ");
}
