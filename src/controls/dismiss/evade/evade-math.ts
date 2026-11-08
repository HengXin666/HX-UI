import type { MotionPoint } from "../../../primitives/motion-math";
import { clamp } from "../feel";
import { EVADE, STASH } from "../tokens";

/** 本文件内重复出现的字面量, 只写一次. */
const TWO = 2;

/* ── EvadeZone ── */

export type EvadeAxis = "both" | "x" | "y";
export type EvadeWall = "clamp" | "none";

/** 指针离目标越近逃得越远: 强度 (1 - d / radius) ^ falloff, 位移 reach * 强度, 方向背离指针. */
export function fleeStrength(distance: number, radius: number, falloff: number): number {
	if (radius <= 0 || distance >= radius) return 0;
	return Math.pow(1 - distance / radius, falloff);
}

export function fleeOffset(
	pointer: MotionPoint,
	home: MotionPoint,
	options: { radius: number; reach: number; falloff: number; axis: EvadeAxis },
): { offset: MotionPoint; strength: number } {
	const dx = home.x - pointer.x;
	const dy = home.y - pointer.y;
	const distance = Math.hypot(dx, dy);
	const strength = fleeStrength(distance, options.radius, options.falloff);
	const ux = distance > 0 ? dx / distance : 0;
	const uy = distance > 0 ? dy / distance : -1;
	const push = options.reach * strength;
	return {
		offset: { x: options.axis === "y" ? 0 : ux * push, y: options.axis === "x" ? 0 : uy * push },
		strength,
	};
}

/** 把目标中心钳进场地, 四周留 INSET. wall 为 none 时不钳. */
export function keepInside(center: MotionPoint, half: MotionPoint, field: MotionPoint, wall: EvadeWall): MotionPoint {
	if (wall === "none") return center;
	const pad = EVADE.insetPx;
	return {
		x: clamp(center.x, pad + half.x, Math.max(pad + half.x, field.x - pad - half.x)),
		y: clamp(center.y, pad + half.y, Math.max(pad + half.y, field.y - pad - half.y)),
	};
}

/** 强度从下往上越过 COUNT_LINE 记一次躲闪. */
export function crossedCountLine(previous: number, next: number): boolean {
	return previous < EVADE.countLine && next >= EVADE.countLine;
}

/* ── StashFolder ── */

export interface ChipSlot {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly angle: number;
}

/** 纸片宽度按字数估: PAD + 字数 * CHAR. */
export function chipWidth(label: string): number {
	return STASH.pad + label.length * STASH.charPx;
}

/**
 * 纸片从文件夹口往上排: 每行宽不超过 spread, 行内居中, 行高 ROW, 第一行离开文件夹口 lift.
 * 角度左右交替, 越靠边越斜, 最大 tilt 度. 坐标相对文件夹口中点, y 向上为负.
 */
export function layoutChips(labels: readonly string[], spread: number, lift: number, tilt: number): ChipSlot[] {
	const rows: Array<{ labels: number[]; width: number }> = [];
	labels.forEach((label, i) => {
		const w = chipWidth(label);
		const row = rows[rows.length - 1];
		if (row && row.width + STASH.gap + w <= spread) {
			row.labels.push(i);
			row.width += STASH.gap + w;
		} else rows.push({ labels: [i], width: w });
	});
	const slots: ChipSlot[] = new Array(labels.length);
	rows.forEach((row, r) => {
		let x = -row.width / TWO;
		for (const i of row.labels) {
			const width = chipWidth(labels[i]);
			const center = x + width / TWO;
			const side = spread > 0 ? clamp((center / spread) * TWO, -1, 1) : 0;
			slots[i] = { x: center, y: -(lift + STASH.row * (r + 0.5)), width, angle: side * tilt };
			x += width + STASH.gap;
		}
	});
	return slots;
}

/** 漂移力: x = sin(0.9t + ph) k m, y = cos(1.3t + 1.7ph) k m. */
export function driftForce(t: number, phase: number, k: number, mass: number): MotionPoint {
	return {
		x: Math.sin(t * STASH.driftWx + phase) * k * mass,
		y: Math.cos(t * STASH.driftWy + phase * STASH.driftPhaseY) * k * mass,
	};
}

/** 打开回弹曲线: 第二个控制点 1 + bounce * 1.9. */
export function openCurve(bounce: number): string {
	return `cubic-bezier(0.34, ${(1 + bounce * STASH.bounceGain).toFixed(TWO)}, 0.64, 1)`;
}

/** 物理在全部纸片入场之后才接管: open + (n - 1) * stagger + 80ms. */
export function liveDelay(openMs: number, count: number, stagger: number): number {
	return openMs + Math.max(0, count - 1) * stagger + STASH.liveDelayMs;
}

/** 收起时逆序错开, 间隔减半; 淡出在收起时长的 0.45 处开始. */
export function closeDelays(index: number, count: number, stagger: number, closeMs: number): { move: number; fade: number } {
	const move = (count - 1 - index) * stagger * STASH.closeStaggerRatio;
	return { move, fade: move + closeMs * STASH.closeFadeAt };
}
