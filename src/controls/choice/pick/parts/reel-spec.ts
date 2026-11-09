/** ReelPicker 的规格常数与纯数学: 行距离, 每行姿态 (位移, 倾斜, 透明度, 模糊), 跟随弹簧, 环绕取整. */
import type { SpringSpec } from "../../../../craft/spring";
import { springFromOmega } from "../../../../motion/spring/fit";

/** 规格的默认项. */
export const REEL_DEFAULT_ITEMS = ["Overview", "Projects", "Journal", "Studio", "Archive", "Contact", "About"] as const;
/** 规格默认值. fontSize 以 rem 计, spacing 以字号的倍数计, tilt 每行度数, blur 每行像素, inset 像素. */
export const REEL_DEFAULTS = {
	defaultIndex: 3,
	fontSize: 3,
	spacing: 1.4,
	curve: 1,
	tilt: 6,
	blur: 2,
	fade: 0.25,
	minOpacity: 0.05,
	smoothing: 200,
	inset: 80,
	rows: 7,
	soundVolume: 0.5,
} as const;
/** 规格的帧长上限 (秒): 切后台回来不一步跳完. 弹簧积分器自带同等钳制. */
export const REEL_DT_CAP_S = 0.05;
/**
 * 规格用 tau = smoothing 的指数趋近. 本库换成可中断的临界阻尼弹簧, 固有频率取 2 / tau:
 * 95% 落定约 2.4 tau, 与指数趋近的 3 tau 体感相近, 且换目标保留速度.
 */
export const REEL_OMEGA_PER_TAU = 2;
/** curve 1 时, 离中心一行横向退开的字号倍数 (按距离平方增长). */
export const REEL_CURVE_EM = 0.12;
/** 渲染的最远行距, 更远的行不进 DOM. */
export const REEL_REACH = 6;
/** 滚轮累计到这么多像素算一档. */
export const REEL_WHEEL_STEP_PX = 40;
/** 行模式滚轮 (deltaMode 1) 一行折算的像素. */
export const REEL_LINE_PX = 16;
/** 拖动越过两端时只跟 35%. */
export const REEL_RUBBER = 0.35;
/** 位移超过它才算拖动, 否则按点击处理. */
export const REEL_SLOP_PX = 4;
/** 翻页键一次走的行数. */
export const REEL_PAGE = 5;
const MS_PER_S = 1000;

export type ReelSide = "left" | "right";

export interface ReelItem {
	readonly value: string;
	readonly label: string;
	readonly disabled?: boolean;
}

export interface ReelPose {
	/** 竖向位移, 以字号计 (em). */
	readonly y: number;
	/** 横向退开, 以字号计 (em), 朝锚定侧. */
	readonly x: number;
	readonly rotate: number;
	readonly opacity: number;
	readonly blur: number;
}

export interface ReelShape {
	readonly spacing: number;
	readonly curve: number;
	readonly tilt: number;
	readonly blur: number;
	readonly fade: number;
	readonly minOpacity: number;
	readonly side: ReelSide;
}

/** 第 i 项离当前连续位置 pos 的行距; loop 时取环上最近的一侧. */
export function reelDistance(i: number, pos: number, count: number, loop: boolean): number {
	const d = i - pos;
	if (!loop || count <= 0) return d;
	return d - count * Math.round(d / count);
}

/** 行距 d 处一项的姿态. 中心行完全不透明, 每远一行按 fade 递减到 minOpacity, 模糊与倾斜按行距线性增长. */
export function reelPose(d: number, shape: ReelShape): ReelPose {
	const away = Math.abs(d);
	const sign = shape.side === "left" ? -1 : 1;
	return {
		y: d * shape.spacing,
		x: sign * shape.curve * REEL_CURVE_EM * d * d,
		rotate: -sign * shape.tilt * d,
		opacity: Math.max(shape.minOpacity, 1 - shape.fade * away),
		blur: shape.blur * away,
	};
}

/** smoothing (ms) 换成跟随弹簧. smoothing 0 时给一根极硬的弹簧. */
export function reelSpring(smoothingMs: number): SpringSpec {
	const tau = Math.max(smoothingMs, 1) / MS_PER_S;
	return springFromOmega(REEL_OMEGA_PER_TAU / tau);
}

/** 连续位置取整到合法下标: loop 时环绕, 否则钳在两端. */
export function reelIndex(pos: number, count: number, loop: boolean): number {
	const n = Math.round(pos);
	if (count <= 0) return 0;
	if (loop) return ((n % count) + count) % count;
	return Math.min(count - 1, Math.max(0, n));
}

/** 越过 [0, count - 1] 的拖动位置按 REEL_RUBBER 跟随. */
export function reelRubber(pos: number, count: number): number {
	const last = Math.max(0, count - 1);
	if (pos < 0) return pos * REEL_RUBBER;
	if (pos > last) return last + (pos - last) * REEL_RUBBER;
	return pos;
}

/** 从 from 朝 step 方向找下一个可选项, 找不到返回 from. */
export function reelSeek(items: readonly ReelItem[], from: number, step: number, loop: boolean): number {
	const count = items.length;
	let i = from;
	for (let k = 0; k < count; k += 1) {
		i += step;
		if (loop) i = ((i % count) + count) % count;
		else if (i < 0 || i >= count) return from;
		if (!items[i]?.disabled) return i;
	}
	return from;
}

/** 字符串或对象都收, 统一成 ReelItem. */
export function reelItems(items: readonly (string | ReelItem)[]): ReelItem[] {
	return items.map((item) => (typeof item === "string" ? { value: item, label: item } : item));
}

const KEY_STEP: Readonly<Record<string, number>> = { ArrowDown: 1, ArrowUp: -1, PageDown: REEL_PAGE, PageUp: -REEL_PAGE };

/** 按键对应的目标下标: 方向键一行 (loop 时环绕), 翻页键 REEL_PAGE 行, Home / End 到首末可选项. 不处理的键返回 null. */
export function reelKeyTarget(key: string, items: readonly ReelItem[], index: number, loop: boolean): number | null {
	const last = items.length - 1;
	if (key === "Home") return reelSeek(items, -1, 1, false);
	if (key === "End") return reelSeek(items, last + 1, -1, false);
	const step = KEY_STEP[key];
	if (step === undefined) return null;
	if (Math.abs(step) === 1) return reelSeek(items, index, step, loop);
	const landed = Math.min(last, Math.max(0, index + step));
	return items[landed]?.disabled ? reelSeek(items, landed, Math.sign(step), false) : landed;
}
