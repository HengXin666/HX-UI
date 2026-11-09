// 行为规格参照 docs/research/catalog/components-1.md 的 ElasticSlider 条目, 实现为 HX 自有.
/**
 * StretchSlider 的纯逻辑: 三条弹簧 (填充, 拉伸回弹, 激活), 越界拉伸的橡皮筋, 指针到比例, 填充区间, 刻度.
 * 弹簧只换算参数, 步进交给 src/motion 的 stepSpringExact, 与本族其余件同一个积分器.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-range.md
 */
import type { SpringSpec } from "../../../../craft/spring";
import { THUMB_MS } from "../../../../craft/tokens";
import { springFromOmega } from "../../../../motion/spring/fit";
import { clamp } from "../../math";
import { CRITICAL_SETTLE, MAX_BOUNCE, MS_PER_S } from "../../tokens";

/** 规格里激活弹簧写死的阻尼比. */
export const STRETCH_ACTIVE_RATIO = 0.9;
/** 填充用合同的 thumb 时长 (267ms) 临界阻尼落定, 键盘与滚轮改值不过冲. */
export const STRETCH_FILL_OMEGA = CRITICAL_SETTLE / (THUMB_MS / MS_PER_S);
/** 拉伸回弹的固有周期 (秒). bounce 越大阻尼比越低, 回弹次数越多. */
export const STRETCH_RECOIL_PERIOD_S = 0.45;
/** 激活 (变粗, 变实) 约 200ms 到位. */
export const STRETCH_ACTIVE_OMEGA = CRITICAL_SETTLE / 0.2;
/** 拉满时横向收窄的比例: 拉长一截, 截面变细一点, 看着像有体积. */
export const STRETCH_SQUASH = 0.25;
/** 拉满时被拉一侧图标放大的比例. */
export const STRETCH_ICON_POP = 0.25;
/** 刻度最多画这么多条, 再密就成了一条灰带. */
export const STRETCH_TICK_CAP = 50;

const FULL_TURN = 2 * Math.PI;

export interface StretchSprings {
	readonly fill: SpringSpec;
	readonly recoil: SpringSpec;
	readonly active: SpringSpec;
}

/** bounce 0 到 MAX_BOUNCE: 回弹阻尼比 = 1 - bounce. */
export function stretchSprings(bounce: number): StretchSprings {
	const ratio = 1 - clamp(bounce, 0, MAX_BOUNCE);
	return {
		fill: springFromOmega(STRETCH_FILL_OMEGA),
		recoil: springFromOmega(FULL_TURN / STRETCH_RECOIL_PERIOD_S, ratio),
		active: springFromOmega(STRETCH_ACTIVE_OMEGA, STRETCH_ACTIVE_RATIO),
	};
}

/** 越界距离 (px, 带符号) 到可见拉伸 (px). 起步 1:1, 越拉越硬, 渐近 maxStretch. */
export function rubberBand(overflowPx: number, maxStretch: number): number {
	if (maxStretch <= 0) return 0;
	const d = Math.abs(overflowPx);
	return Math.sign(overflowPx) * ((d * maxStretch) / (d + maxStretch));
}

export interface AxisReading {
	/** 0 到 1, 已钳. 竖向时底端是 0. */
	readonly ratio: number;
	/** 越过两端的距离 (px). 低端为负, 高端为正, 轨道内为 0. */
	readonly overflow: number;
}

/** coord 是指针在轴上的坐标, start / length 是轨道的起点与长度 (竖向时 start 是顶端). */
export function readAxis(coord: number, start: number, length: number, vertical: boolean): AxisReading {
	if (length <= 0) return { ratio: 0, overflow: 0 };
	const along = vertical ? start + length - coord : coord - start;
	const overflow = along < 0 ? along : along > length ? along - length : 0;
	return { ratio: clamp(along / length, 0, 1), overflow };
}

export function ratioOf(value: number, min: number, max: number): number {
	return max > min ? clamp((value - min) / (max - min), 0, 1) : 0;
}

/** 填充区间 [lo, hi] (比例). 有 fillFrom 时从它填到当前值, 否则从起点填. */
export function fillSpan(ratio: number, originRatio: number | undefined): readonly [number, number] {
	const origin = originRatio ?? 0;
	return ratio >= origin ? [origin, ratio] : [ratio, origin];
}

/** 刻度位置 (比例), 不含两端; 超过上限时不画. */
export function tickRatios(min: number, max: number, step: number): number[] {
	if (step <= 0 || max <= min) return [];
	const count = Math.floor((max - min) / step);
	if (count < 2 || count > STRETCH_TICK_CAP) return [];
	return Array.from({ length: count - 1 }, (_, i) => ((i + 1) * step) / (max - min));
}

/** 拉伸 s (px) 下的轨道缩放: 沿轴变长, 截面按 SQUASH 变细. */
export function stretchScale(stretchPx: number, lengthPx: number, maxStretch: number): { along: number; across: number } {
	const s = Math.abs(stretchPx);
	return {
		along: lengthPx > 0 ? (lengthPx + s) / lengthPx : 1,
		across: maxStretch > 0 ? 1 - STRETCH_SQUASH * Math.min(1, s / maxStretch) : 1,
	};
}

export function mix(from: number, to: number, t: number): number {
	return from + (to - from) * t;
}
