import { useEffect, useRef, useState } from "react";
import { type SpringSpec, type SpringStep } from "../../craft/spring";
import { DT_MAX_MS, REST_EPSILON } from "../../craft/tokens";

/** 位移包络衰减到起点的千分之一视为落定, 与 "spring 时长" 的常见语义一致. */
const SETTLE_RESIDUAL = 0.001;
/** 阻尼比下限: bounce 再大也保留一点阻尼, 避免永不落定. */
const MIN_DAMPING_RATIO = 0.05;
const NEWTON_STEPS = 32;
const NEWTON_EPSILON = 1e-9;
const MS_PER_S = 1000;
const FRAME_FALLBACK_MS = 16;
const CRITICAL = 2;

// ENGINE-GAP: src/craft/spring.ts 只认 stiffness/damping/mass, 缺 "时长 + bounce" 到物理参数的换算; 此处为最小局部实现, 应并入 L1.
/**
 * 把 "时长 + bounce" 写法的弹簧换算成引擎的 stiffness / damping / mass.
 * 过冲由阻尼比 1 - bounce 决定, 时长由包络 (1 + wd) e^(-zeta wd) 衰减到千分之一时的 d 决定;
 * 两者都不依赖质量, 质量只按比例放大刚度与阻尼.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-choice.md
 */
export function springFromDuration(durationS: number, bounce: number, mass = 1): SpringSpec {
	const zeta = Math.min(1, Math.max(MIN_DAMPING_RATIO, 1 - bounce));
	const target = Math.log(SETTLE_RESIDUAL);
	let x = (-target / zeta) * CRITICAL;
	for (let i = 0; i < NEWTON_STEPS; i += 1) {
		const f = Math.log(1 + x) - zeta * x - target;
		const slope = 1 / (1 + x) - zeta;
		if (Math.abs(f) < NEWTON_EPSILON || slope === 0) break;
		x -= f / slope;
	}
	const omega = x / Math.max(durationS, NEWTON_EPSILON);
	return { stiffness: mass * omega * omega, damping: CRITICAL * zeta * omega * mass, mass };
}

/** 刚度 + 质量 + bounce 写法: 阻尼取临界阻尼的 (1 - bounce) 倍. */
export function springFromBounce(stiffness: number, mass: number, bounce: number): SpringSpec {
	return { stiffness, mass, damping: CRITICAL * Math.sqrt(stiffness * mass) * (1 - bounce) };
}

/** 无阻尼振荡的理论过冲比例, 测试和调参用. */
export function overshootOf(spec: SpringSpec): number {
	const zeta = spec.damping / (CRITICAL * Math.sqrt(spec.stiffness * spec.mass));
	if (zeta >= 1) return 0;
	return Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta));
}

const CRITICAL_BAND = 1e-6;

// ENGINE-GAP: craft stepSpring 是半隐式欧拉且 dt 下限 8ms, 刚一些的弹簧在 60fps (16ms) 下过冲被数值阻尼吃掉 (bounce 0.2 的 0.4s 弹簧过冲从 1.5% 掉到 0), 规格的回弹无法保留; 此处用阻尼振子解析解做最小局部实现, 应并入 L1.
/**
 * 解析解一步: 任意帧长都精确, 速度保留, 目标可随时改. dt 上限沿用引擎的 34ms, 切后台不会一帧飞出去.
 */
export function stepExact(current: number, velocity: number, target: number, spec: SpringSpec, dtMs: number): SpringStep {
	const t = Math.min(DT_MAX_MS, Math.max(0, dtMs)) / MS_PER_S;
	const x0 = current - target;
	const omega = Math.sqrt(spec.stiffness / spec.mass);
	const zeta = spec.damping / (CRITICAL * Math.sqrt(spec.stiffness * spec.mass));
	let x: number;
	let v: number;
	if (Math.abs(zeta - 1) < CRITICAL_BAND) {
		const b = velocity + omega * x0;
		const e = Math.exp(-omega * t);
		x = e * (x0 + b * t);
		v = e * (velocity - omega * b * t);
	} else if (zeta < 1) {
		const wd = omega * Math.sqrt(1 - zeta * zeta);
		const e = Math.exp(-zeta * omega * t);
		const cos = Math.cos(wd * t);
		const sin = Math.sin(wd * t);
		x = e * (x0 * cos + ((velocity + zeta * omega * x0) / wd) * sin);
		v = e * (velocity * cos - ((zeta * omega * velocity + omega * omega * x0) / wd) * sin);
	} else {
		const root = Math.sqrt(zeta * zeta - 1);
		const r1 = -omega * (zeta - root);
		const r2 = -omega * (zeta + root);
		const c1 = (velocity - r2 * x0) / (r1 - r2);
		const c2 = x0 - c1;
		x = c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t);
		v = c1 * r1 * Math.exp(r1 * t) + c2 * r2 * Math.exp(r2 * t);
	}
	const resting = Math.abs(x) <= REST_EPSILON && Math.abs(v) <= REST_EPSILON;
	return resting ? { current: target, velocity: 0, resting: true } : { current: target + x, velocity: v, resting: false };
}

export interface DriveOptions {
	/** 起步速度. 不给时沿用当前速度, 中途换目标不清零. */
	readonly velocity?: number;
	readonly delayMs?: number;
	readonly onRest?: () => void;
}

// ENGINE-GAP: 引擎缺共享的 rAF 弹簧驱动 (craft 的 usePress 与 SegmentedThumb 各写一份循环); 此处为最小局部实现, 应并入 L1.
/**
 * 一条可中断的弹簧轴: 每帧用 stepExact 推进, 换目标时保留位置与速度.
 */
export class SpringDriver {
	value: number;
	velocity = 0;
	private target: number;
	private spec: SpringSpec = { stiffness: 1, damping: 1, mass: 1 };
	private frame = 0;
	private last = 0;
	private startAt = 0;
	private rest: (() => void) | undefined;
	private readonly onFrame: (value: number) => void;

	constructor(initial: number, onFrame: (value: number) => void) {
		this.value = initial;
		this.target = initial;
		this.onFrame = onFrame;
	}

	get moving(): boolean {
		return this.frame !== 0;
	}

	get goal(): number {
		return this.target;
	}

	to(target: number, spec: SpringSpec, options: DriveOptions = {}): void {
		this.target = target;
		this.spec = spec;
		if (options.velocity !== undefined) this.velocity = options.velocity;
		this.rest = options.onRest;
		this.startAt = performance.now() + (options.delayMs ?? 0);
		if (this.frame) return;
		this.last = 0;
		this.frame = requestAnimationFrame(this.tick);
	}

	/** 直接落到某值: 减弱动效, 拖拽跟手与首帧摆位用. */
	jump(value: number): void {
		this.stop();
		this.value = value;
		this.target = value;
		this.velocity = 0;
		this.onFrame(value);
	}

	stop(): void {
		if (this.frame) cancelAnimationFrame(this.frame);
		this.frame = 0;
	}

	private readonly tick = (now: number): void => {
		if (now < this.startAt) {
			this.last = now;
			this.frame = requestAnimationFrame(this.tick);
			return;
		}
		const dt = this.last ? now - this.last : FRAME_FALLBACK_MS;
		this.last = now;
		const step = stepExact(this.value, this.velocity, this.target, this.spec, dt);
		this.value = step.current;
		this.velocity = step.velocity;
		this.onFrame(step.current);
		if (!step.resting) {
			this.frame = requestAnimationFrame(this.tick);
			return;
		}
		this.frame = 0;
		this.rest?.();
	};
}

/** 秒转毫秒, 规格里的 spring 时长是秒, CSS 与 WAAPI 用毫秒. */
export function toMs(seconds: number): number {
	return seconds * MS_PER_S;
}

/** 组件里用的弹簧轴: 每帧把值写进状态, 卸载时停表. */
export function useSpringValue(initial: number): readonly [number, SpringDriver] {
	const [value, setValue] = useState(initial);
	const driver = useRef<SpringDriver | null>(null);
	if (!driver.current) driver.current = new SpringDriver(initial, setValue);
	useEffect(() => () => driver.current?.stop(), []);
	return [value, driver.current] as const;
}
