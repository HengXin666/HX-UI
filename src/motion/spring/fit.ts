import type { SpringSpec } from "../../craft/spring";

/**
 * L1 弹簧换算: "时长 + bounce", 可感时长, "刚度 + bounce", 固有频率四种写法到 stiffness / damping / mass.
 * 各写法原先散在控件各族, 公式差异收成选项; 同输入下与原实现数值一致, 由 tests/motion/spring-fit.test.ts 锁住.
 *
 * .agents/notes/implemented/feature/2026-11-08-motion-spring-frame.md
 */

/** 包络衰减到初始位移的这个比例即视为落定. */
export const SETTLE_RESIDUAL = 0.001;
/** 阻尼比下限的默认值: bounce 再大也留一点阻尼, 否则停不下来. */
export const MIN_DAMPING_RATIO = 0.05;
/** 临界阻尼 c = 2 sqrt(k m) 里的系数, 也是 c = 2 zeta omega m 里的系数. */
const CRITICAL_COEFF = 2;
const HALF = 0.5;
const BISECT_STEPS = 60;
const BISECT_UPPER = 64;
const NEWTON_STEPS = 32;
const NEWTON_EPSILON = 1e-9;
/** 可感时长写法的默认值: 可感时长放大 1.2 倍求固有频率, 时长下限 50ms. */
const VISUAL_STRETCH = 1.2;
const VISUAL_MIN_DURATION_S = 0.05;
const FULL_TURN = CRITICAL_COEFF * Math.PI;

/**
 * 判定落定用的包络, x = omega * T.
 * - amplitude: e^(-zeta x) / sqrt(1 - zeta^2), 位移包络的峰值线.
 * - slope: zeta / sqrt(1 - zeta^2) * e^(-zeta x), 常见 UI 动画库的 "duration" 判据.
 * - linear: (1 + x) e^(-zeta x), 欠阻尼也套用临界阻尼形式.
 * 前两种在 zeta = 1 时都退到临界阻尼的 (1 + x) e^(-x).
 */
export type SettleEnvelope = "amplitude" | "slope" | "linear";

export interface DurationFitOptions {
  /** 质量, 默认 1. 不改变过冲与时长, 只按比例放大刚度与阻尼. */
  readonly mass?: number;
  /** 默认 amplitude. */
  readonly envelope?: SettleEnvelope;
  /** 阻尼比下限, 默认 MIN_DAMPING_RATIO. */
  readonly minDampingRatio?: number;
  /** 时长下限 (秒), 默认 Number.EPSILON, 防止除零. */
  readonly minDurationS?: number;
  /** 固有频率 (rad/s) 的闭区间, 换算结果钳进来; 默认不钳. 极短时长配大 bounce 时防止刚度失控. */
  readonly omegaRange?: readonly [number, number];
}

export interface VisualFitOptions {
  readonly mass?: number;
  readonly minDampingRatio?: number;
  /** 默认 0.05s. */
  readonly minDurationS?: number;
  /** 可感时长到周期的放大系数, 默认 1.2. */
  readonly stretch?: number;
}

export interface StiffnessFitOptions {
  readonly mass?: number;
  /** 给了就先把 bounce 钳进这个闭区间; 不给则原样使用. */
  readonly bounceRange?: readonly [number, number];
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** 临界阻尼包络 (1 + x) e^(-x) 落到 SETTLE_RESIDUAL 的根, 约 9.23. */
function criticalRoot(): number {
  let lo = 0;
  let hi = BISECT_UPPER;
  for (let i = 0; i < BISECT_STEPS; i += 1) {
    const mid = (lo + hi) * HALF;
    if ((1 + mid) * Math.exp(-mid) > SETTLE_RESIDUAL) lo = mid;
    else hi = mid;
  }
  return (lo + hi) * HALF;
}

const CRITICAL_ROOT = criticalRoot();

/** (1 + x) e^(-zeta x) 落到 SETTLE_RESIDUAL 的根, 牛顿迭代. */
function linearRoot(zeta: number): number {
  const target = Math.log(SETTLE_RESIDUAL);
  let x = (-target / zeta) * CRITICAL_COEFF;
  for (let i = 0; i < NEWTON_STEPS; i += 1) {
    const f = Math.log(1 + x) - zeta * x - target;
    const slope = 1 / (1 + x) - zeta;
    if (Math.abs(f) < NEWTON_EPSILON || slope === 0) break;
    x -= f / slope;
  }
  return x;
}

/** 阻尼比 zeta 下包络落到 SETTLE_RESIDUAL 时的 omega * T. */
export function settleRoot(zeta: number, envelope: SettleEnvelope = "amplitude"): number {
  if (envelope === "linear") return linearRoot(zeta);
  if (zeta >= 1) return CRITICAL_ROOT;
  const root = Math.sqrt(1 - zeta * zeta);
  const level = envelope === "slope" ? (SETTLE_RESIDUAL * root) / zeta : SETTLE_RESIDUAL * root;
  return -Math.log(level) / zeta;
}

/**
 * "时长 + bounce" 换成弹簧参数: 阻尼比 zeta = 1 - bounce (钳在 [minDampingRatio, 1]),
 * omega 取包络在 durationS 秒落到 SETTLE_RESIDUAL 的那一个. 过冲只由 bounce 决定.
 *
 * @param durationS 落定时长, 秒.
 * @param bounce 0 为临界阻尼, 越大过冲越多.
 * @param options 质量, 包络, 阻尼比, 时长下限与固有频率区间.
 */
export function springFromDuration(durationS: number, bounce: number, options: DurationFitOptions = {}): SpringSpec {
  const { mass = 1, envelope = "amplitude", minDampingRatio = MIN_DAMPING_RATIO, minDurationS = Number.EPSILON, omegaRange } = options;
  const zeta = clamp(1 - bounce, minDampingRatio, 1);
  const fitted = settleRoot(zeta, envelope) / Math.max(durationS, minDurationS);
  const omega = omegaRange ? clamp(fitted, omegaRange[0], omegaRange[1]) : fitted;
  return { stiffness: mass * omega * omega, damping: CRITICAL_COEFF * zeta * omega * mass, mass };
}

/**
 * 可感时长写法: omega = 2pi / (d * stretch), zeta = 1 - bounce. 与动画库的 visualDuration 同义.
 *
 * @param durationS 可感时长, 秒.
 * @param bounce 0 为临界阻尼.
 * @param options 质量, 阻尼比下限, 时长下限与放大系数.
 */
export function springFromVisualDuration(durationS: number, bounce: number, options: VisualFitOptions = {}): SpringSpec {
  const { mass = 1, minDampingRatio = MIN_DAMPING_RATIO, minDurationS = VISUAL_MIN_DURATION_S, stretch = VISUAL_STRETCH } = options;
  const omega = FULL_TURN / (Math.max(durationS, minDurationS) * stretch);
  const stiffness = omega * omega * mass;
  const zeta = clamp(1 - bounce, minDampingRatio, 1);
  return { stiffness, damping: CRITICAL_COEFF * zeta * Math.sqrt(stiffness * mass), mass };
}

/**
 * 已知刚度: 阻尼取临界阻尼乘 (1 - bounce).
 *
 * @param stiffness 刚度.
 * @param bounce 0 为临界阻尼, 1 为无阻尼.
 * @param options 质量与 bounce 钳制区间.
 */
export function springFromStiffness(stiffness: number, bounce: number, options: StiffnessFitOptions = {}): SpringSpec {
  const { mass = 1, bounceRange } = options;
  const b = bounceRange ? clamp(bounce, bounceRange[0], bounceRange[1]) : bounce;
  return { stiffness, damping: CRITICAL_COEFF * Math.sqrt(stiffness * mass) * (1 - b), mass };
}

/**
 * 已知固有频率 (rad/s) 与阻尼比. 阻尼比默认 1, 即临界阻尼的一阶感跟随.
 *
 * @param omega 固有角频率.
 * @param dampingRatio 阻尼比.
 * @param mass 质量.
 */
export function springFromOmega(omega: number, dampingRatio = 1, mass = 1): SpringSpec {
  return { stiffness: mass * omega * omega, damping: CRITICAL_COEFF * dampingRatio * omega * mass, mass };
}

/** 阻尼比 c / (2 sqrt(k m)). */
export function dampingRatio(spec: SpringSpec): number {
  return spec.damping / (CRITICAL_COEFF * Math.sqrt(spec.stiffness * spec.mass));
}

/** 从静止走向目标时的首个过冲 (相对行程). 临界与过阻尼为 0. */
export function overshootOf(spec: SpringSpec): number {
  const zeta = dampingRatio(spec);
  if (zeta >= 1) return 0;
  return Math.exp((-zeta * Math.PI) / Math.sqrt(1 - zeta * zeta));
}
