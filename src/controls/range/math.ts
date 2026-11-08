/**
 * range 族 (取值, 刻度, 状态与进度) 共用的取值数学: 钳制, 步长吸附, 三次平滑, 松手速度估计.
 * 弹簧换算, 积分与帧循环都在 src/motion, 本文件不再另写.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-range.md
 */
import { MS_PER_S } from "./tokens";

const SMOOTH_A = 3;
const SMOOTH_B = 2;

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
