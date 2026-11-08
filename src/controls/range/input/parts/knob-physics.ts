// ArcKnob 的读数物理: 手感常数, 弹簧换算, 惯性衰减, 以及 跟随 / 滑行 / 吸附 三态的逐帧推进.
import { springFromStiffness } from "../../../../motion/spring/fit";
import { approach } from "../../../../motion/spring/follow";
import { stepSpringExact } from "../../../../motion/spring/step";
import { clamp } from "../../math";
import { DT_CAP_S, MS_PER_S, RANGE_BOUNCE_RANGE, RANGE_DT_CAP_MS } from "../../tokens";

/** 盘心死区半径 (px). 指针离圆心这么近时角度不可靠, 不更新目标. */
export const KNOB_DEAD_PX = 44;
/** 彗尾满长对应的速度 (每秒走过的量程数). */
export const KNOB_V_FULL = 4;
/** 松手速度超过它才算甩, 否则直接吸附. */
export const KNOB_V_FLICK = 2;
/** 拖动时读数跟随指针的时间常数 (秒). */
export const KNOB_TAU_FOLLOW = 0.06;
/** 彗尾速度的平滑时间常数 (秒). */
export const KNOB_TAU_V = 0.05;
/** 惯性滑行每 60Hz 帧保留的速度比例. */
export const KNOB_DECEL = 0.99;
/** 指针移动超过它才算拖, 否则按点按处理. */
export const KNOB_DRAG_PX = 10;
/** 松手前最后一个样本比这还旧, 视为停住再松, 速度为 0. */
export const KNOB_STALE_MS = 80;
/** 惯性衰减按 60Hz 帧折算. */
const FRAME_RATE = 60;
/** 惯性速度低于它转入吸附弹簧. */
const COAST_STOP = 0.02;
const IDLE = "idle";
const SPRING = "spring";

export type KnobMode = "idle" | "follow" | "coast" | "spring";

/** r 读数, v 速度, tail 彗尾平滑速度, target 目标, bounce 当前吸附弹簧的回弹. 全部是 0..1 量程. */
export interface KnobState {
	r: number;
	v: number;
	tail: number;
	rPrev: number;
	target: number;
	mode: KnobMode;
	bounce: number;
}

/** 规格的 speed 解释为弹簧固有角频率 (rad/s), stiffness = speed^2, 阻尼 = 临界 * (1 - bounce). */
export function knobSpring(speed: number, bounce: number): ReturnType<typeof springFromStiffness> {
	return springFromStiffness(speed * speed, bounce, { bounceRange: RANGE_BOUNCE_RANGE });
}

/** 惯性一帧: 速度按 DECEL^(dt * 60) 衰减. */
export function coastStep(velocity: number, dtS: number): number {
	return velocity * Math.pow(KNOB_DECEL, dtS * FRAME_RATE);
}

export interface KnobStepOptions {
	readonly speed: number;
	readonly momentum: number;
	readonly flickBounce: number;
	/** 读数吸到最近一档 (0..1). */
	readonly snapFraction: (r: number) => number;
}

/** 推进一帧. 返回是否已完全静止 (读数与彗尾都停了). */
export function stepKnob(s: KnobState, dtMs: number, { speed, momentum, flickBounce, snapFraction }: KnobStepOptions): boolean {
	const dt = clamp(dtMs / MS_PER_S, 0, DT_CAP_S);
	if (s.mode === "follow") s.r = approach(s.r, s.target, dt, KNOB_TAU_FOLLOW);
	else if (s.mode === "coast") {
		s.r += s.v * dt * momentum;
		s.v = coastStep(s.v, dt);
		if (s.r <= 0 || s.r >= 1 || Math.abs(s.v) < COAST_STOP) {
			s.r = clamp(s.r, 0, 1);
			s.target = snapFraction(s.r);
			s.v = 0;
			s.bounce = flickBounce;
			s.mode = SPRING;
		}
	} else if (s.mode === SPRING) {
		const next = stepSpringExact(s.r, s.v, s.target, knobSpring(speed, s.bounce), dtMs, RANGE_DT_CAP_MS);
		s.r = next.current;
		s.v = next.velocity;
		if (next.resting) s.mode = IDLE;
	}
	const vRaw = dt === 0 ? 0 : (s.r - s.rPrev) / dt;
	s.rPrev = s.r;
	s.tail = approach(s.tail, vRaw, dt, KNOB_TAU_V);
	const quiet = s.mode === IDLE && Math.abs(s.tail) < COAST_STOP;
	if (quiet) s.tail = 0;
	return quiet;
}
