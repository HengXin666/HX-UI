import { ease } from "../../craft/ease";
import { stepSpring, type SpringSpec, type SpringStep } from "../../craft/spring";

/** 本文件内重复出现的字面量, 只写一次. */
const TWO = 2;

/** 一条可中断的轴: 当前值, 速度 (单位/秒) 与目标. 目标改了速度保留. */
export interface Axis {
	current: number;
	velocity: number;
	target: number;
}

const TAU = TWO * Math.PI;
/** motion 的 visualDuration 换算把可感时长放大 1.2 倍求固有频率. */
const VISUAL_STRETCH = 1.2;
const MIN_DAMPING_RATIO = 0.05;
/** 时长太短会让刚度爆炸, 钳到 50ms. */
const MIN_DURATION_S = 0.05;
const MS = 1000;
const MASS = 1;

/*
 * ENGINE-GAP: craft/spring.ts 只收 stiffness/damping/mass, 没有 "时长 + bounce" 到弹簧参数的换算.
 * 这里按 motion 的 visualDuration 公式换算: omega = 2pi / (d * 1.2), k = omega^2 * m, zeta = 1 - bounce,
 * c = 2 * zeta * sqrt(k * m). 过冲与时长和原文 { type: spring, duration, bounce } 同义, 并入 L1 后删除.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-dismiss.md
 */
export function springFromFeel(durationS: number, bounce: number): SpringSpec {
	const omega = TAU / (Math.max(durationS, MIN_DURATION_S) * VISUAL_STRETCH);
	const stiffness = omega * omega * MASS;
	const zeta = Math.min(1, Math.max(MIN_DAMPING_RATIO, 1 - bounce));
	return { stiffness, damping: TWO * zeta * Math.sqrt(stiffness * MASS), mass: MASS };
}

/**
 * ENGINE-GAP: 引擎没有 "趋近时间常数" 形式的弹簧. 原文 omega = 8 / duration 的临界阻尼跟随,
 * 换成 k = omega^2, c = 2 * omega, 交给 stepSpring 积分.
 */
export function springFromSettle(durationS: number, rate: number, floorS: number): SpringSpec {
	const omega = rate / Math.max(floorS, durationS);
	return { stiffness: omega * omega, damping: TWO * omega, mass: MASS };
}

/** 无阻尼比的理论过冲, 测试用来核对换算没有改掉原意. */
export function overshootOf(spec: SpringSpec): number {
	const zeta = spec.damping / (TWO * Math.sqrt(spec.stiffness * spec.mass));
	if (zeta >= 1) return 0;
	return Math.exp((-zeta * Math.PI) / Math.sqrt(1 - zeta * zeta));
}

/** 把轴推进一帧. stepSpring 的速度单位是 单位/秒, 与指针速度同一单位. */
export function stepAxis(axis: Axis, spec: SpringSpec, dtMs: number): SpringStep {
	const step = stepSpring(axis.current, axis.velocity, axis.target, spec, dtMs);
	axis.current = step.current;
	axis.velocity = step.velocity;
	return step;
}

export function makeAxis(value = 0): Axis {
	return { current: value, velocity: 0, target: value };
}

/** 减弱动效或键盘触发: 直接落到目标, 不留速度. */
export function snapAxis(axis: Axis, value: number): void {
	axis.current = value;
	axis.target = value;
	axis.velocity = 0;
}

/**
 * ENGINE-GAP: 引擎没有指数趋近 (from + (to - from) * (1 - e^(-dt / tau))). 用于逐帧跟随指针的倾斜与抬起.
 */
export function approach(from: number, to: number, dtS: number, tauS: number): number {
	if (tauS <= 0) return to;
	return from + (to - from) * (1 - Math.exp(-dtS / tauS));
}

/**
 * ENGINE-GAP: craft/ease 只收具名曲线, 族规格的 0.23, 1, 0.32, 1 没有注册. JS 补间用最接近的 "out" 曲线,
 * CSS 过渡仍写原曲线 (见 tokens.ts 的 DISMISS_EASE_OUT).
 */
export function tween(from: number, to: number, elapsedMs: number, durationMs: number): number {
	if (durationMs <= 0) return to;
	return from + (to - from) * ease("out", elapsedMs / durationMs);
}

/** 按每毫秒衰减率投射惯性终点: v * decel / (1 - decel), v 为 px/s. */
export function projectFlick(position: number, velocity: number, decel: number): number {
	return position + ((velocity / MS) * decel) / (1 - decel);
}

/** 越界部分按阻力收缩. resistance 0 不可越界, 1 不收缩. */
export function resist(value: number, limit: number, resistance: number): number {
	const magnitude = Math.abs(value);
	if (magnitude <= limit) return value;
	return Math.sign(value) * (limit + (magnitude - limit) * resistance);
}

/** 渐近阻力: 越拉越重, 永远不超过 cap. */
export function rubber(distance: number, cap: number): number {
	if (cap <= 0) return 0;
	return (cap * distance) / (cap + Math.abs(distance));
}

export function clamp(value: number, lo: number, hi: number): number {
	return Math.min(hi, Math.max(lo, value));
}

/** 0 到 1 的平滑阶跃, 和着色器里的 smoothstep 同义. */
export function smoothstep(value: number, edge0: number, edge1: number): number {
	const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
	return t * t * (3 - TWO * t);
}

const SAMPLE_WINDOW_MS = 100;

/** ENGINE-GAP: gesture.ts 只给位移不给速度. 这里保留最近 100ms 的样本求 px/s. */
export class VelocityTracker {
	private samples: Array<{ t: number; x: number; y: number }> = [];

	reset(): void {
		this.samples = [];
	}

	push(t: number, x: number, y: number): void {
		this.samples.push({ t, x, y });
		while (this.samples.length > TWO && t - this.samples[0].t > SAMPLE_WINDOW_MS) this.samples.shift();
	}

	velocity(): { x: number; y: number } {
		const first = this.samples[0];
		const last = this.samples[this.samples.length - 1];
		if (!first || !last || last.t <= first.t) return { x: 0, y: 0 };
		const dt = (last.t - first.t) / MS;
		return { x: (last.x - first.x) / dt, y: (last.y - first.y) / dt };
	}
}
