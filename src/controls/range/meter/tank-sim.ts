import { clamp } from "../motion";

/** 本文件内重复出现的字面量, 只写一次. */
const TWO = 2;
const N_10 = 10;

/** 帧间隔上限 (秒). */
export const TANK_DT_MAX = 0.05;
/** 液位速度到液面目标倾角的增益 (度 / (像素每秒)). */
export const TANK_TILT_GAIN = 0.07;
/** 液面最大倾角 (度). */
export const TANK_TILT_MAX = 30;
/** 停住判据: 位置差与速度. */
export const TANK_REST_POS = 0.05;
export const TANK_REST_VEL = TWO;
/** 键盘一步与 PageUp / PageDown 一步 (百分比). */
export const TANK_STEP = TWO;
export const TANK_BIG = N_10;
/** 浪尖最大高度 (px). */
export const TANK_BAND = N_10;
/** 固定子步 (秒). 规格按 n = ceil(dt / H) 拆分一帧, 这里取 240Hz. */
export const TANK_SUBSTEP = 1 / 240;
/*
 * 规格没有给液位与液面的固有频率. 取液位 omega 10 rad/s 临界阻尼 (体积不会过冲),
 * 液面晃动 omega 14 rad/s, 阻尼比 = viscosity. 属于本实现的取值, 不是规格常数.
 */
export const TANK_LEVEL_OMEGA = N_10;
export const TANK_SLOSH_OMEGA = 14;

export interface TankState {
	level: number;
	levelV: number;
	tilt: number;
	tiltV: number;
}

export interface TankParams {
	readonly viscosity: number;
	readonly tilt: number;
	/** 容器高度 (px), 用于把百分比速度换成像素速度. */
	readonly height: number;
}

/**
 * 液位与液面倾角的耦合模拟, 每帧按固定子步推进. 返回是否已停住.
 * 目标改了下一帧就生效, 速度不清零, 所以连续改值不会跳.
 *
 * ENGINE-GAP: L1 的 stepSpring 最小帧 8ms 且只推进单个标量, 无法做两个耦合振子的 240Hz 子步积分.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-range.md
 */
export function stepTank(s: TankState, target: number, dtS: number, p: TankParams): boolean {
	const dt = Math.min(Math.max(dtS, 0), TANK_DT_MAX);
	const n = Math.max(1, Math.ceil(dt / TANK_SUBSTEP));
	const h = dt / n;
	const kL = TANK_LEVEL_OMEGA * TANK_LEVEL_OMEGA;
	const cL = TWO * TANK_LEVEL_OMEGA;
	const kS = TANK_SLOSH_OMEGA * TANK_SLOSH_OMEGA;
	const cS = TWO * clamp(p.viscosity, 0, 1) * TANK_SLOSH_OMEGA;
	for (let i = 0; i < n; i += 1) {
		const accel = kL * (target - s.level) - cL * s.levelV;
		s.levelV += accel * h;
		s.level += s.levelV * h;
		const aim = clamp(-TANK_TILT_GAIN * p.tilt * s.levelV * (p.height / 100), -TANK_TILT_MAX, TANK_TILT_MAX);
		s.tiltV += (kS * (aim - s.tilt) - cS * s.tiltV) * h;
		s.tilt = clamp(s.tilt + s.tiltV * h, -TANK_TILT_MAX, TANK_TILT_MAX);
	}
	const rest =
		Math.abs(target - s.level) < TANK_REST_POS &&
		Math.abs(s.levelV) < TANK_REST_VEL &&
		Math.abs(s.tilt) < TANK_REST_POS &&
		Math.abs(s.tiltV) < TANK_REST_VEL;
	if (rest) Object.assign(s, { level: target, levelV: 0, tilt: 0, tiltV: 0 });
	return rest;
}

/** 液面轮廓: 倾斜直线加一个与倾角角速度成比例的浪尖, 返回 SVG path. */
export function surfacePath(width: number, height: number, s: TankState, splash: number): string {
	const y = height * (1 - s.level / 100);
	const lean = Math.tan((s.tilt * Math.PI) / 180) * (width / TWO);
	const crest = clamp(splash * Math.abs(s.tiltV) * 0.1, 0, TANK_BAND);
	const mid = width / TWO;
	return `M 0 ${y - lean} Q ${mid} ${y - crest} ${width} ${y + lean} L ${width} ${height} L 0 ${height} Z`;
}
