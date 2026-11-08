import { approach, clamp, smoothstep } from "../feel";
import { CRUSH, RIP, SHRED } from "../tokens";

/** 本文件内重复出现的字面量, 只写一次. */
const TWO = 2;

/* ── ShredBin ── */

/** 一条碎纸的运动状态. ax 是它在卡片里的横向中心. */
export interface Strip {
	left: number;
	width: number;
	ax: number;
	y: number;
	x: number;
	vy: number;
	vx: number;
	splay: number;
}

/** 卡片按 stripWidth 切成竖条; 最后一条不足 SLIVER 时并进前一条, 条数封顶. */
export function cutStrips(width: number, stripWidth: number): number[] {
	const w = Math.max(SHRED.sliver, stripWidth);
	const count = Math.min(SHRED.maxStrips, Math.max(1, Math.floor(width / w)));
	const each = width / count;
	return Array.from({ length: count }, (_, i) => i * each);
}

/** 新碎条: 越靠两边散得越开, 方向随位置左右分开. each 是切开后的实际条宽. */
export function makeStrip(left: number, width: number, each: number): Strip {
	const ax = left + each / TWO;
	return { left, width: each, ax, y: 0, x: 0, vy: 0, vx: 0, splay: (ax - width / TWO) / Math.max(1, width) };
}

/**
 * 碎条推进 dt 秒, 子步 240Hz. 下落速度趋近 speed * breath, 横向散开趋近 splay * tear + 偏心 * 0.25.
 * breath 是每口咬下后的呼吸 (1 稳定, 咬下瞬间更快), tear 是撕开程度 0 到 1.
 */
export function stepStrip(strip: Strip, dtS: number, speed: number, breath: number, tear: number, width: number): void {
	const n = Math.max(1, Math.ceil(dtS * SHRED.substepHz));
	const h = dtS / n;
	for (let i = 0; i < n; i += 1) {
		strip.vy = approach(strip.vy, speed * breath, h, SHRED.tauFall);
		strip.vx = approach(strip.vx, strip.splay * tear * speed + (strip.ax - width / TWO) * SHRED.splayPull, h, SHRED.tauSplay);
		strip.y += strip.vy * h;
		strip.x += strip.vx * h;
	}
}

/** 每咬一口 bite 像素给一次 TUG 的回拽, 回拽按 TUG_DECAY 指数回落. */
export function tugAfter(previousFed: number, fed: number, bite: number, tug: number, dtS: number): number {
	const bites = Math.floor(fed / bite) - Math.floor(previousFed / bite);
	const kicked = tug + (bites > 0 ? SHRED.tug * bites : 0);
	return approach(kicked, 0, dtS, SHRED.tugDecay);
}

/** 拖到刀口下 ENTER 算送入; 已送入的要退回刀口下 ENTER - HYSTERESIS 以上才取消. */
export function feedArmed(depthBelowSlit: number, armed: boolean): boolean {
	if (armed) return depthBelowSlit > SHRED.enter - SHRED.hysteresis;
	return depthBelowSlit > SHRED.enter;
}

/** 重排后每张卡的错开延时: 从变动位置往上逐张 STAGGER 秒. */
export function stackDelay(index: number, from: number): number {
	if (from < 0) return 0;
	return Math.max(0, from - 1 - index) * SHRED.stagger;
}

/** 拖动时的重排落点: 越过相邻卡中心再多 HYSTERESIS 才换位. */
export function reorderIndex(current: number, pointerY: number, slots: readonly number[], slotHeight: number): number {
	let index = current;
	while (index > 0 && pointerY < slots[index - 1] + slotHeight / TWO - SHRED.hysteresis) index -= 1;
	while (index < slots.length - 1 && pointerY > slots[index + 1] + slotHeight / TWO + SHRED.hysteresis) index += 1;
	return index;
}

export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
	const next = list.slice();
	const [item] = next.splice(from, 1);
	next.splice(to, 0, item);
	return next;
}

/* ── CrushSheet ── */

/** 折痕权重: 0.88 - (1 - sharpness) * 0.18 到 0.98 的 smoothstep, 越锐利起点越高. */
export function creaseWeight(dot: number, sharpness: number): number {
	return smoothstep(dot, CRUSH.creaseEdge - (1 - sharpness) * CRUSH.creaseSoften, CRUSH.creaseTop);
}

/** 光照: 折叠量加记忆量的 0 到 0.4 smoothstep. */
export function crushLighting(fold: number, memory: number): number {
	return smoothstep(fold + memory, 0, CRUSH.lightTop);
}

/** 揉皱程度 0 到 1 映射到整体缩放. amount 是 crumpleAmount 上限. */
export function crushScale(progress: number, amount: number): number {
	return 1 - clamp(progress, 0, 1) * amount * CRUSH.shrink;
}

/* ── RipStub ── */

/** 拉动距离按阻力打折; 折后超过 stretch 即撕下. */
export function ripPull(distance: number, resistance: number): number {
	return distance * resistance;
}

export function ripTorn(distance: number, resistance: number, stretch: number): boolean {
	return ripPull(distance, resistance) > stretch;
}

/** 拉动方向的偏角, 钳在 tearAngle 以内 (度). */
export function ripAngle(dx: number, dy: number, tearAngle: number, vertical: boolean): number {
	const along = vertical ? dy : dx;
	const across = vertical ? -dx : dy;
	if (Math.abs(along) + Math.abs(across) === 0) return 0;
	const deg = (Math.atan2(across, Math.max(1, Math.abs(along))) * 180) / Math.PI;
	return clamp(deg, -tearAngle, tearAngle);
}

/** 撕下后的自由落体一步: 重力 GRAVITY, 角度按垂摆弹簧回到 0. */
export function fallStep(
	body: { x: number; y: number; vx: number; vy: number; theta: number; thetaV: number },
	dtS: number,
): void {
	const dt = clamp(dtS, RIP.minDtS, RIP.maxDtS);
	body.vy += RIP.gravity * dt;
	body.x += body.vx * dt;
	body.y += body.vy * dt;
	body.thetaV += (-RIP.hangK * body.theta - RIP.hangC * body.thetaV) * dt;
	body.theta += body.thetaV * dt;
}

/** 主票面的反冲弹簧一步 (bx, bv). */
export function recoilStep(body: { bx: number; bv: number }, dtS: number): void {
	const dt = clamp(dtS, RIP.minDtS, RIP.maxDtS);
	body.bv += (-RIP.bodyK * body.bx - RIP.bodyC * body.bv) * dt;
	body.bx += body.bv * dt;
}
