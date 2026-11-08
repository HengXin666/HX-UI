// RipStub 的逐帧模拟状态与一步推进: 悬停倾斜弹簧, 撕下后的落体, 未撕时存根回位, 票身反冲.
import { stepSpring } from "../../../../../craft/spring";
import { approach, clamp } from "../../../feel";
import { RIP } from "../../../tokens";
import { fallStep, recoilStep } from "../../discard-math";

const MS = 1000;
/** 位移与速度之和低于此值视为静止. */
export const RIP_SETTLE = 0.05;

export interface RipSim {
	sx: number;
	sy: number;
	theta: number;
	thetaV: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	pvx: number;
	pvy: number;
	bx: number;
	bv: number;
	tx: { current: number; velocity: number };
	ty: { current: number; velocity: number };
	tiltTo: { x: number; y: number };
	free: boolean;
}

export function freshRipSim(): RipSim {
	return {
		sx: 0, sy: 0, theta: 0, thetaV: 0, x: 0, y: 0, vx: 0, vy: 0, pvx: 0, pvy: 0, bx: 0, bv: 0,
		tx: { current: 0, velocity: 0 }, ty: { current: 0, velocity: 0 }, tiltTo: { x: 0, y: 0 }, free: false,
	};
}

/** 撕下的瞬间: 存根脱离, 继承指针速度. */
export function releaseStub(s: RipSim): void {
	s.free = true;
	s.x = s.sx;
	s.y = s.sy;
	s.vx = s.pvx;
	s.vy = s.pvy;
	s.thetaV = 0;
}

/** 推进一帧. 返回是否还需要下一帧, 以及存根是否已落出视野. */
export function stepRipSim(s: RipSim, dtMs: number, gone: boolean, held: boolean, tearAngle: number): { busy: boolean; fellOut: boolean } {
	const dt = clamp(dtMs / MS, RIP.minDtS, RIP.maxDtS);
	const tx = stepSpring(s.tx.current, s.tx.velocity, s.tiltTo.x, RIP.tiltSpring, dtMs);
	const ty = stepSpring(s.ty.current, s.ty.velocity, s.tiltTo.y, RIP.tiltSpring, dtMs);
	s.tx = tx;
	s.ty = ty;
	let busy = !tx.resting || !ty.resting;
	let fellOut = false;
	if (s.free) {
		if (!gone) {
			fallStep(s, dt);
			s.theta = approach(s.theta, clamp(s.vx / MS, -1, 1) * tearAngle, dt, RIP.tauHang);
			if (s.y > RIP.fallOutPx || Math.abs(s.x) > RIP.fallOutPx) fellOut = true;
			else busy = true;
		}
	} else if (!held) {
		s.sx = approach(s.sx, 0, dt, RIP.tauHome);
		s.sy = approach(s.sy, 0, dt, RIP.tauHome);
		s.theta = approach(s.theta, 0, dt, RIP.tauHome);
		if (Math.abs(s.sx) + Math.abs(s.sy) + Math.abs(s.theta) > RIP_SETTLE) busy = true;
	} else busy = true;
	recoilStep(s, dt);
	if (Math.abs(s.bx) + Math.abs(s.bv) > RIP_SETTLE) busy = true;
	return { busy, fellOut };
}
