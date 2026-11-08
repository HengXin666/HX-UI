import type { SpringSpec, SpringStep } from "../../craft/spring";
import { REST_EPSILON } from "../../craft/tokens";

/** 本文件内重复出现的字面量, 只写一次. */
const TWO = 2;

/** 落定判据: 包络衰减到初始位移的千分之一视为停住. */
export const SETTLE_EPSILON = 0.001;
/** 临界阻尼下 (1 + x) e^-x = 0.001 的根, 即 omega * T. 规格里写作 9.23. */
export const CRITICAL_SETTLE = 9.23;
/** bounce 上限, 再高阻尼比趋零, 弹簧停不下来. */
export const MAX_BOUNCE = 0.9;
/** 帧间隔上限 (秒), 切后台回来不让积分一步飞出去. */
export const DT_CAP_S = 0.05;
export const MS_PER_S = 1000;

const BISECT_STEPS = 60;
const BISECT_HI = 64;
const SMOOTH_A = 3;
const SMOOTH_B = TWO;

/**
 * range 族 (取值, 刻度, 状态与进度) 共用的数学. 引擎缺口在本文件与 use-frame-loop.ts 里用 ENGINE-GAP 标出.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-range.md
 */
export function clamp(value: number, lo: number, hi: number): number {
	return Math.min(hi, Math.max(lo, value));
}

/** 步长的小数位, 吸附后用 toFixed 去掉浮点尾巴. */
export function decimalsOf(step: number): number {
	return step.toString().split(".")[1]?.length ?? 0;
}

/** 钳进区间并吸附到 min + k * step. */
export function snap(value: number, min: number, max: number, step: number): number {
	const bounded = clamp(value, min, max);
	if (step <= 0) return bounded;
	const stepped = min + Math.round((bounded - min) / step) * step;
	return clamp(Number(stepped.toFixed(decimalsOf(step))), min, max);
}

/** 0 到 1 的三次平滑. 两端斜率为 0, 振幅从无到有不起跳. */
export function smoothstep(s: number): number {
	const t = clamp(s, 0, 1);
	return t * t * (SMOOTH_A - SMOOTH_B * t);
}

/*
 * ENGINE-GAP: 一阶指数跟随 (时间常数 tau, 与帧率无关). L1 只有二阶弹簧 stepSpring, 没有一阶低通.
 */
export function expFollow(current: number, target: number, dtS: number, tau: number): number {
	if (tau <= 0) return target;
	return current + (target - current) * (1 - Math.exp(-dtS / tau));
}

/** 阻尼比 zeta 下包络落到 SETTLE_EPSILON 时的 omega * T. */
export function settleRoot(zeta: number): number {
	if (zeta < 1) return -Math.log(SETTLE_EPSILON * Math.sqrt(1 - zeta * zeta)) / zeta;
	let lo = 0;
	let hi = BISECT_HI;
	for (let i = 0; i < BISECT_STEPS; i += 1) {
		const mid = (lo + hi) / TWO;
		if ((1 + mid) * Math.exp(-mid) > SETTLE_EPSILON) lo = mid;
		else hi = mid;
	}
	return (lo + hi) / TWO;
}

/*
 * ENGINE-GAP: 时长加 bounce 形式的弹簧 ({ duration, bounce }) 换算到 stiffness / damping / mass.
 * L1 的 SpringSpec 只收三参数, 没有这条换算. 这里取阻尼比 zeta = 1 - bounce,
 * omega = settleRoot(zeta) / duration, 于是 duration 秒后残差落到千分之一, 过冲由 zeta 决定.
 */
export function springFromDuration(durationS: number, bounce: number, mass = 1): SpringSpec {
	const zeta = 1 - clamp(bounce, 0, MAX_BOUNCE);
	const omega = settleRoot(zeta) / Math.max(durationS, Number.EPSILON);
	return { stiffness: mass * omega * omega, damping: TWO * zeta * omega * mass, mass };
}

/** 已知刚度, 阻尼取临界阻尼乘 (1 - bounce). 刻度盘规格的写法. */
export function springFromStiffness(stiffness: number, bounce: number, mass = 1): SpringSpec {
	const critical = TWO * Math.sqrt(stiffness * mass);
	return { stiffness, damping: critical * (1 - clamp(bounce, 0, MAX_BOUNCE)), mass };
}

const CRITICAL_BAND = 1e-6;

/*
 * ENGINE-GAP: L1 的 stepSpring 是半隐式欧拉且最小帧钳在 8ms. omega 超过 20 rad/s 的弹簧 (本族多数)
 * 在这个步长下数值阻尼会吃掉大半过冲 (bounce 0.2 时理论 1.5%, 8ms 欧拉只剩 0.3%), 换算后的弹簧就不再保留原意.
 * 这里用阻尼谐振子的解析解推进一帧, 与帧长无关, 接口与返回值和 stepSpring 相同, 落定阈值也用同一个 REST_EPSILON.
 */
export function stepSpringFine(current: number, velocity: number, target: number, spring: SpringSpec, dtMs: number): SpringStep {
	const t = clamp(dtMs / MS_PER_S, 0, DT_CAP_S);
	const w0 = Math.sqrt(spring.stiffness / spring.mass);
	const zeta = spring.damping / (TWO * Math.sqrt(spring.stiffness * spring.mass));
	const y0 = current - target;
	let y: number;
	let v: number;
	if (Math.abs(zeta - 1) < CRITICAL_BAND) {
		const e = Math.exp(-w0 * t);
		const b = velocity + w0 * y0;
		y = (y0 + b * t) * e;
		v = (velocity - w0 * t * b) * e;
	} else if (zeta < 1) {
		const wd = w0 * Math.sqrt(1 - zeta * zeta);
		const e = Math.exp(-zeta * w0 * t);
		const cos = Math.cos(wd * t);
		const sin = Math.sin(wd * t);
		y = e * (y0 * cos + ((velocity + zeta * w0 * y0) / wd) * sin);
		v = e * (velocity * cos - ((w0 * w0 * y0 + zeta * w0 * velocity) / wd) * sin);
	} else {
		const root = Math.sqrt(zeta * zeta - 1);
		const r1 = -w0 * (zeta - root);
		const r2 = -w0 * (zeta + root);
		const a = (velocity - r2 * y0) / (r1 - r2);
		const b = y0 - a;
		y = a * Math.exp(r1 * t) + b * Math.exp(r2 * t);
		v = r1 * a * Math.exp(r1 * t) + r2 * b * Math.exp(r2 * t);
	}
	const resting = Math.abs(y) <= REST_EPSILON && Math.abs(v) <= REST_EPSILON;
	return resting ? { current: target, velocity: 0, resting: true } : { current: target + y, velocity: v, resting: false };
}

/** 欠阻尼二阶系统的理论过冲比例. 测试和文档拿它核对换算保留了原意. */
export function overshootOf(spring: SpringSpec): number {
	const zeta = spring.damping / (TWO * Math.sqrt(spring.stiffness * spring.mass));
	if (zeta >= 1) return 0;
	return Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta));
}

export interface MotionSample {
	readonly t: number;
	readonly v: number;
}

/*
 * ENGINE-GAP: 松手速度估计. src/primitives/gesture.ts 只给相对按下点的位移, 不留时间序列.
 * 这里保留最近 windowMs 的样本, 末样本比 staleMs 还旧 (手指停住再松) 时速度为 0.
 */
export function pushSample(history: MotionSample[], sample: MotionSample, windowMs: number): MotionSample[] {
	const kept = history.filter((s) => sample.t - s.t <= windowMs);
	kept.push(sample);
	return kept;
}

/** 单位/秒. 少于两个样本或已经停住时为 0. */
export function velocityOf(history: readonly MotionSample[], now: number, staleMs: number): number {
	const last = history[history.length - 1];
	const first = history[0];
	if (!last || !first || last === first) return 0;
	if (now - last.t > staleMs) return 0;
	const span = (last.t - first.t) / MS_PER_S;
	return span > 0 ? (last.v - first.v) / span : 0;
}
