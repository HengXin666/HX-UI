// ShredBin 的逐帧模拟: 堆叠卡片的位置弹簧与拖动回落, 送入中纸张的居中, 进纸, 顿挫与碎条.
import { makeAxis, stepAxis, type Axis } from "../../../../../motion/drive/axis";
import { approach } from "../../../../../motion/spring/follow";
import { clamp } from "../../../feel";
import { SHRED } from "../../../tokens";
import { cutStrips, makeStrip, stepStrip, tugAfter, type Strip } from "../../discard-math";

const TWO = 2;
const SLIVER_SHARE = 10;
const STACK_SPRING = { stiffness: SHRED.stackK, damping: SHRED.stackC, mass: 1 };

export interface CardSim {
	y: Axis;
	delay: number;
	dx: number;
	dy: number;
	tilt: number;
	lift: number;
}

export interface Feed<T> {
	item: T;
	x: number;
	y: number;
	w: number;
	h: number;
	fed: number;
	tug: number;
	strips: Strip[];
	fadeAt: number;
}

/** 新卡片: 落在 y, 第 born 张按 bornDelay 依次入场. */
export function newCardSim(y: number, born: number): CardSim {
	return { y: makeAxis(y), delay: born * SHRED.bornDelay, dx: 0, dy: 0, tilt: 0, lift: 1 };
}

/** 一张卡片一帧: 等入场延迟, 弹向槽位; 不在拖动时偏移, 倾斜与抬起都回落. 返回是否仍在动. */
export function stepCard(sim: CardSim, target: number, dragging: boolean, dt: number, dtMs: number): boolean {
	let busy = false;
	sim.y.target = target;
	if (sim.delay > 0) {
		sim.delay = Math.max(0, sim.delay - dt);
		busy = true;
	} else if (!stepAxis(sim.y, STACK_SPRING, dtMs).resting) busy = true;
	if (dragging) return true;
	sim.dx = approach(sim.dx, 0, dt, 1 / SHRED.settle);
	sim.dy = approach(sim.dy, 0, dt, 1 / SHRED.settle);
	sim.tilt = approach(sim.tilt, 0, dt, SHRED.tauUntilt);
	sim.lift = approach(sim.lift, 1, dt, SHRED.tauDrop);
	return busy || Math.abs(sim.dx) + Math.abs(sim.dy) + Math.abs(sim.tilt) > SHRED.sliver / SLIVER_SHARE;
}

/** 从卡片当前位置起一份送入记录, 按 stripWidth 切好碎条. */
export function newFeed<T>(item: T, x: number, y: number, w: number, h: number, stripWidth: number): Feed<T> {
	return {
		item,
		x,
		y,
		w,
		h: Math.max(1, h),
		fed: 0,
		tug: 0,
		strips: cutStrips(w, stripWidth).map((left, _i, all) => makeStrip(left, w, w / all.length)),
		fadeAt: 0,
	};
}

export interface FeedStepOptions {
	readonly width: number;
	readonly slitY: number;
	/** 本帧是否进纸 (autoFeed 或按住). */
	readonly feeding: boolean;
	readonly feedSpeed: number;
	readonly bite: number;
}

/** 送入中的纸一帧: 居中到刀口上方, 进纸, 算顿挫, 推进每根碎条. */
export function stepFeed<T>(f: Feed<T>, dt: number, { width, slitY, feeding, feedSpeed, bite }: FeedStepOptions): void {
	f.x = approach(f.x, (width - f.w) / TWO, dt, SHRED.tauCenter);
	f.y = approach(f.y, slitY - f.h, dt, SHRED.tauDrop);
	const before = f.fed;
	if (feeding) f.fed += feedSpeed * dt;
	f.tug = tugAfter(before, f.fed, bite, f.tug, dt);
	const tear = clamp(f.fed / f.h, 0, 1);
	const passing = f.fed < f.h;
	for (const strip of f.strips) stepStrip(strip, dt, passing ? 0 : feedSpeed, 1 + f.tug / SHRED.tug, tear, f.w);
}

/** 纸已整张穿过刀口并多走了 over, 可以开始淡出. */
export function feedThrough<T>(f: Feed<T>): boolean {
	return f.fed >= f.h + SHRED.over;
}
